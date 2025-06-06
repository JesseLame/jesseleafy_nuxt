<template>
    <div class="min-h-screen flex items-center justify-center p-6">
        <div class="w-full max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-10">
            <h1 class="text-4xl md:text-6xl font-extrabold text-indigo-700 mb-4">
                Welcome to My Nuxt Site 🚀
            </h1>
            <p class="text-lg md:text-xl text-gray-700 max-w-xl mx-auto mb-6">
                This is a blazing fast Nuxt 3 application styled with Tailwind CSS.
                Let's build something amazing together.
            </p>
            <div class="flex flex-wrap justify-center gap-4">
                <NuxtLink to="/about"
                    class="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl shadow hover:bg-indigo-700 transition">
                    Learn More
                </NuxtLink>
                <a href="https://nuxt.com" target="_blank"
                    class="px-6 py-3 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition">
                    Nuxt Docs
                </a>
            </div>
        </div>
    </div>
</template>
