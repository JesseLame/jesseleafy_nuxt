import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');

function loadDotEnv() {
	const envPath = path.join(projectRoot, '.env');

	return fs.readFile(envPath, 'utf8')
		.then((content) => {
			for (const line of content.split(/\r?\n/)) {
				const trimmedLine = line.trim();

				if (!trimmedLine || trimmedLine.startsWith('#')) {
					continue;
				}

				const separatorIndex = trimmedLine.indexOf('=');

				if (separatorIndex === -1) {
					continue;
				}

				const key = trimmedLine.slice(0, separatorIndex).trim();
				const rawValue = trimmedLine.slice(separatorIndex + 1).trim();
				const value = rawValue.replace(/^['"]|['"]$/g, '');

				if (!process.env[key]) {
					process.env[key] = value;
				}
			}
		})
		.catch(() => {});
}

function printUsage() {
	console.log('Usage: npm run make:user-admin -- <supabase-user-id>');
	console.log('');
	console.log('Promotes the given Supabase Auth user to app_metadata.role = admin.');
}

function getUserIdArgument() {
	const argumentsList = process.argv.slice(2);

	if (argumentsList.includes('--help') || argumentsList.includes('-h')) {
		printUsage();
		process.exit(0);
	}

	const userId = argumentsList[0]?.trim();

	if (!userId) {
		printUsage();
		throw new Error('Provide a Supabase user id.');
	}

	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
		throw new Error('Provide a valid UUID user id.');
	}

	return userId;
}

async function main() {
	await loadDotEnv();

	const userId = getUserIdArgument();
	const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL?.trim() || process.env.SUPABASE_URL?.trim();
	const secretKey = process.env.NUXT_SUPABASE_SECRET_KEY?.trim()
		|| process.env.SUPABASE_SECRET_KEY?.trim()
		|| process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

	if (!supabaseUrl || !secretKey) {
		throw new Error('Set NUXT_PUBLIC_SUPABASE_URL and NUXT_SUPABASE_SECRET_KEY before promoting a user.');
	}

	const supabase = createClient(supabaseUrl, secretKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});

	const { data: existingUserData, error: getUserError } = await supabase.auth.admin.getUserById(userId);

	if (getUserError) {
		throw getUserError;
	}

	const existingUser = existingUserData.user;

	if (!existingUser) {
		throw new Error(`No Supabase Auth user found for id ${userId}.`);
	}

	const nextAppMetadata = {
		...(existingUser.app_metadata ?? {}),
		role: 'admin',
	};

	const { data: updatedUserData, error: updateUserError } = await supabase.auth.admin.updateUserById(userId, {
		app_metadata: nextAppMetadata,
	});

	if (updateUserError) {
		throw updateUserError;
	}

	const updatedUser = updatedUserData.user;

	console.log(`Promoted user ${userId} to admin.`);
	console.log(`Email: ${updatedUser?.email ?? existingUser.email ?? '(no email)'}`);
	console.log(`app_metadata: ${JSON.stringify(updatedUser?.app_metadata ?? nextAppMetadata)}`);
	console.log('If the user is currently signed in, have them sign out and sign back in to refresh their JWT.');
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : error);
	process.exitCode = 1;
});
