<script setup>
const { data: recentRecipes } = await useAsyncData('recentRecipes', async () => {
    const allRecipes = await queryCollection('recipes').all()

    return allRecipes
        .filter((r) => r.created)
        .sort((a, b) => {
            return new Date(b.created) - new Date(a.created)
        })
        .slice(0, 3)
})

useSeoMeta({
    title: 'Jesse\'s Leafy Feasts - Home',
    description: 'A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love.',
})

// import { createClient } from '@supabase/supabase-js'
// const config = useRuntimeConfig()

// const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey)

// console.log('Supabase Client:', supabase)
// const comments = ref([])
// async function getComments() {
//     const { data } = await supabase.from('comments').select().eq('post_id', 'banana').order('created_at', { ascending: false })
//     console.log('Fetched Comments:', data)
//     comments.value = data
// }

// onMounted(async () => {
//     getComments()

//     // Log comments to console
//     console.log('Comments:', comments.value)
// })

</script>

<template>
    <div class="min-h-screen flex flex-col items-center px-4 sm:px-6 pt-10">
        <!-- Welcome Section -->
        <div class="w-full max-w-3xl bg-white/70 backdrop-blur-sm rounded-xl shadow-lg text-center p-6 sm:p-10 mb-10">
            <h1 class="text-3xl sm:text-4xl md:text-6xl font-extrabold text-green-700 mb-4">
                Welcome to Jesse's Leafy Feasts 🍃
            </h1>
            <p class="text-base sm:text-lg md:text-xl text-gray-700 max-w-xl mx-auto mb-6">
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

        <!-- Recent Recipes Section -->
        <div class="w-full max-w-5xl">
            <h2 class="text-2xl sm:text-3xl font-bold text-green-800 mb-6 text-center">Recent Recipes</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                <div v-for="recipe in recentRecipes" :key="recipe.path"
                    class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                    <NuxtLink :to="`${recipe.path}`" class="block h-full">
                        <img v-if="recipe.image" :src="recipe.image" alt="Recipe image"
                            class="w-full h-48 object-cover" />
                        <div class="p-5">
                            <h2 class="text-xl font-semibold mb-2">{{ recipe.title }}</h2>
                            <p class="text-gray-600 text-sm">{{ recipe.description }}</p>
                        </div>
                    </NuxtLink>
                </div>
            </div>

        </div>
    </div>
</template>


