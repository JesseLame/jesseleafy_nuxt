<script setup>
useSeoMeta({
    title: 'Jesse\'s Leafy Feasts - Home',
    description: 'A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love.',
})
</script>

<template>
    <div class="min-h-screen flex items-center justify-center p-6">
        <div class="w-full max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-10">
            <h1 class="text-4xl md:text-6xl font-extrabold text-green-700 mb-4">
                Welcome Jesse's Leafy Feasts 🍃
            </h1>
            <p class="text-lg md:text-xl text-gray-700 max-w-xl mx-auto mb-6">
                A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes,
                kitchen tales, and leafy goodness served with love.
            </p>
            <div class="flex flex-wrap justify-center gap-4">
                <NuxtLink to="/about"
                    class="px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow hover:bg-green-700 transition">
                    Learn More
                </NuxtLink>
            </div>
        </div>
    </div>
</template>
