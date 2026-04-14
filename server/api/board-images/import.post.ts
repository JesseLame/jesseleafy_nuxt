import { Buffer } from 'node:buffer';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import type { BoardIdeaUploadImage } from '~/types/board';
import {
	BOARD_IDEA_IMAGE_BUCKET,
	BOARD_IDEA_IMAGE_MAX_BYTES,
	sanitizeBoardIdeaImageFileName,
} from '~/utils/boardIdeaImages';

const MAX_REDIRECTS = 3;

const MIME_TYPE_EXTENSIONS: Record<string, string> = {
	'image/avif': 'avif',
	'image/gif': 'gif',
	'image/jpeg': 'jpg',
	'image/png': 'png',
	'image/svg+xml': 'svg',
	'image/webp': 'webp',
};

function createHttpError(statusCode: number, statusMessage: string) {
	return createError({ statusCode, statusMessage });
}

function isLocalHostname(hostname: string) {
	return hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local');
}

function isPrivateIpv4(address: string) {
	const octets = address.split('.').map((part) => Number(part));

	if (octets.length !== 4 || octets.some((part) => Number.isNaN(part))) {
		return false;
	}

	return (
		octets[0] === 0
		|| octets[0] === 10
		|| octets[0] === 127
		|| (octets[0] === 169 && octets[1] === 254)
		|| (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
		|| (octets[0] === 192 && octets[1] === 168)
	);
}

function isPrivateIpv6(address: string) {
	const normalized = address.toLowerCase();

	return (
		normalized === '::1'
		|| normalized === '::'
		|| normalized.startsWith('fc')
		|| normalized.startsWith('fd')
		|| normalized.startsWith('fe8')
		|| normalized.startsWith('fe9')
		|| normalized.startsWith('fea')
		|| normalized.startsWith('feb')
	);
}

function isBlockedIpAddress(address: string) {
	const version = isIP(address);

	if (version === 4) {
		return isPrivateIpv4(address);
	}

	if (version === 6) {
		return isPrivateIpv6(address);
	}

	return true;
}

async function assertSafeRemoteUrl(url: URL) {
	if (!['http:', 'https:'].includes(url.protocol)) {
		throw createHttpError(400, 'Only http and https image URLs are allowed.');
	}

	if (!url.hostname || isLocalHostname(url.hostname)) {
		throw createHttpError(400, 'Local image URLs are not allowed.');
	}

	if (isIP(url.hostname)) {
		if (isBlockedIpAddress(url.hostname)) {
			throw createHttpError(400, 'Private network image URLs are not allowed.');
		}

		return;
	}

	const addresses = await lookup(url.hostname, { all: true, verbatim: true });

	if (!addresses.length || addresses.some((entry) => isBlockedIpAddress(entry.address))) {
		throw createHttpError(400, 'Private network image URLs are not allowed.');
	}
}

function getExtensionFromContentType(contentType: string) {
	return MIME_TYPE_EXTENSIONS[contentType.toLowerCase()] || 'bin';
}

function getSafeFileName(targetUrl: URL, contentType: string) {
	const rawName = targetUrl.pathname.split('/').pop() || `image.${getExtensionFromContentType(contentType)}`;
	const safeName = sanitizeBoardIdeaImageFileName(rawName);

	if (safeName.includes('.')) {
		return safeName;
	}

	return `${safeName}.${getExtensionFromContentType(contentType)}`;
}

async function fetchImageWithRedirectValidation(targetUrl: URL) {
	let currentUrl = targetUrl;

	for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
		await assertSafeRemoteUrl(currentUrl);

		const response = await fetch(currentUrl, {
			redirect: 'manual',
			headers: {
				Accept: 'image/*',
			},
		});

		if ([301, 302, 303, 307, 308].includes(response.status)) {
			const location = response.headers.get('location');

			if (!location) {
				throw createHttpError(400, 'Image URL redirect did not include a target.');
			}

			if (redirectCount === MAX_REDIRECTS) {
				throw createHttpError(400, 'Image URL redirected too many times.');
			}

			currentUrl = new URL(location, currentUrl);
			continue;
		}

		if (!response.ok) {
			throw createHttpError(400, 'Unable to download that image URL.');
		}

		return {
			response,
			finalUrl: currentUrl,
		};
	}

	throw createHttpError(400, 'Unable to download that image URL.');
}

async function readImageResponse(response: Response) {
	const contentType = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() || '';

	if (!contentType.startsWith('image/')) {
		throw createHttpError(400, 'That URL does not point to an image.');
	}

	const contentLength = Number(response.headers.get('content-length') || 0);

	if (contentLength > BOARD_IDEA_IMAGE_MAX_BYTES) {
		throw createHttpError(400, 'Images must be 5 MB or smaller.');
	}

	if (!response.body) {
		throw createHttpError(400, 'Unable to read that image.');
	}

	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let totalBytes = 0;

	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		if (!value) {
			continue;
		}

		totalBytes += value.byteLength;

		if (totalBytes > BOARD_IDEA_IMAGE_MAX_BYTES) {
			throw createHttpError(400, 'Images must be 5 MB or smaller.');
		}

		chunks.push(value);
	}

	return {
		buffer: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))),
		contentType,
	};
}

export default defineEventHandler(async (event): Promise<{ boardImage: BoardIdeaUploadImage }> => {
	const runtimeConfig = useRuntimeConfig(event);
	const supabaseUrl = runtimeConfig.public.supabaseUrl;
	const supabaseAnonKey = runtimeConfig.public.supabaseAnonKey;
	const authorization = getHeader(event, 'authorization');

	if (!supabaseUrl || !supabaseAnonKey) {
		throw createHttpError(500, 'Board image imports are unavailable because Supabase is not configured.');
	}

	if (!authorization?.startsWith('Bearer ')) {
		throw createHttpError(401, 'You need to be logged in to import idea images.');
	}

	const accessToken = authorization.slice('Bearer '.length).trim();

	if (!accessToken) {
		throw createHttpError(401, 'You need to be logged in to import idea images.');
	}

	const { url } = await readBody<{ url?: string }>(event);
	const trimmedUrl = url?.trim();

	if (!trimmedUrl) {
		throw createHttpError(400, 'Provide an image URL to import.');
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		global: {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		},
		auth: {
			persistSession: false,
			autoRefreshToken: false,
			detectSessionInUrl: false,
		},
	});

	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser(accessToken);

	if (userError || !user) {
		throw createHttpError(401, 'You need to be logged in to import idea images.');
	}

	let parsedUrl: URL;

	try {
		parsedUrl = new URL(trimmedUrl);
	} catch {
		throw createHttpError(400, 'Enter a valid image URL.');
	}

	const { response, finalUrl } = await fetchImageWithRedirectValidation(parsedUrl);
	const { buffer, contentType } = await readImageResponse(response);
	const safeName = getSafeFileName(finalUrl, contentType);
	const randomId = globalThis.crypto?.randomUUID?.() || String(Date.now());
	const path = `${user.id}/${Date.now()}-${randomId}-${safeName}`;

	const { error: uploadError } = await supabase.storage.from(BOARD_IDEA_IMAGE_BUCKET).upload(path, buffer, {
		cacheControl: '3600',
		contentType,
		upsert: false,
	});

	if (uploadError) {
		throw createHttpError(400, 'Unable to store that image right now.');
	}

	return {
		boardImage: {
			source: 'upload',
			bucket: BOARD_IDEA_IMAGE_BUCKET,
			path,
		},
	};
});
