<script setup lang="ts">

const { data: recipes } = await useAsyncData('recipeData', () => {
    return queryCollection('recipes').all()
})
watchEffect(() => {
    if (recipes.value) {
        console.log('Recipes:', recipes.value)
    }

    useSeoMeta({
        title: 'Jesse\'s Leafy Feasts - All Recipes',
        description: 'Explore a collection of delicious plant-based recipes that celebrate fresh flavors and nourishing greens. Dive into seasonal delights and leafy goodness served with love.',
    })
})
</script>

<template>
    <div class="max-w-6xl mx-auto px-4 py-10">
        <h1 class="text-3xl font-bold mb-8 text-center">All Recipes</h1>

        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <li v-for="recipe in recipes" :key="recipe.path"
                class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <NuxtLink :to="`${recipe.path}`" class="block h-full">
                    <img v-if="recipe.image" :src="recipe.image" alt="Recipe image"
                        class="w-full h-48 object-cover" />
                    <div class="p-5">
                        <h2 class="text-xl font-semibold mb-2">{{ recipe.title }}</h2>
                        <p class="text-gray-600 text-sm">{{ recipe.description }}</p>
                    </div>
                </NuxtLink>
            </li>
        </ul>
    </div>
</template>

