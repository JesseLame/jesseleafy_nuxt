/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./components/**/*.{vue,js}', './layouts/**/*.{vue,js}', './pages/**/*.{vue,js}', './app.vue', './nuxt.config.{js,ts}'],
	theme: {
		extend: {
			backgroundImage: {
				default: "url('/background.png')",
				home: "url('/background-home.png')",
			},
		},
	},
	plugins: [],
};
