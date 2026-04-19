import { defineContentConfig, defineCollection } from '@nuxt/content';

export default defineContentConfig({
	collections: {
		content: defineCollection({
			type: 'page',
			// Keep recipe markdown on disk for imports/history, but do not publish it via Nuxt Content.
			source: {
				include: '**/*.md',
				exclude: ['recipes/**/*.md'],
			},
		}),
	},
});
