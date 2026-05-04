// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	css: ['~/assets/css/main.css'],
	postcss: {
		plugins: {
			'@tailwindcss/postcss': {},
			autoprefixer: {},
		},
	},
	compatibilityDate: '2025-05-15',
	devtools: { enabled: true },
	modules: ['@nuxt/content'],
	runtimeConfig: {
		claudeApiKey: process.env.CLAUDE_API || process.env.ANTHROPIC_API_KEY || '',
		supabaseSecretKey: process.env.NUXT_SUPABASE_SECRET_KEY || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
		public: {
			supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
			supabasePublishableKey: process.env.NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '',
		},
	},
});
