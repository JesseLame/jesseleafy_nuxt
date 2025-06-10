import { defineContentConfig, defineCollection, z } from '@nuxt/content';

export default defineContentConfig({
	collections: {
		content: defineCollection({
			type: 'page',
			source: '**/*.md',
		}),
		recipes: defineCollection({
			type: 'page',
			source: 'recipes/**/*.md',
			schema: z.object({
				title: z.string(),
				description: z.string(),
				description_long: z.string().optional(),
				image: z.string().url().optional(),
				ingredients: z.union([
					z.array(z.string()), // flat list
					z.record(z.array(z.string())), // grouped object
				]),
				instructions: z.array(z.string()),
				created: z.date(),
				tags: z.array(z.string()).optional(),
				categories: z.array(z.string()).optional(),
			}),
		}),
	},
});
