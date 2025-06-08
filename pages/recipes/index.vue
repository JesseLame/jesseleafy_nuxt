<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue'

const { data: recipes } = await useAsyncData('recipeData', () => {
    return queryCollection('recipes').all()
})

const searchQuery = ref('')

const filteredRecipes = computed(() => {
    if (!recipes.value) return []
    return recipes.value.filter((recipe: any) => {
        const q = searchQuery.value.toLowerCase()
        return (
            recipe.title?.toLowerCase().includes(q) ||
            recipe.description?.toLowerCase().includes(q) ||
            recipe.tags?.some((tag: string) =>
                tag.toLowerCase().includes(q)
            )
        )
    })
})

watchEffect(() => {
    console.log('Filtered Recipes:', filteredRecipes.value)

    useSeoMeta({
        title: 'Jesse\'s Leafy Feasts - All Recipes',
        description: 'Explore a collection of delicious plant-based recipes that celebrate fresh flavors and nourishing greens. Dive into seasonal delights and leafy goodness served with love.',
    })
})
</script>


<template>
    <div class="max-w-6xl mx-auto px-4 py-10">
        <h1 class="text-3xl font-bold mb-6 text-center">All Recipes</h1>

        <!-- Search Box -->
        <div class="mb-8 max-w-md mx-auto">
            <input v-model="searchQuery" type="text" placeholder="Search recipes..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300" />
        </div>

        <!-- Recipes Grid -->
        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <li v-for="recipe in filteredRecipes" :key="recipe.path"
                class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <NuxtLink :to="recipe.path" class="block h-full">
                    <img v-if="recipe.image" :src="recipe.image" alt="Recipe image" class="w-full h-48 object-cover" />
                    <div class="p-5">
                        <h2 class="text-xl font-semibold mb-2">{{ recipe.title }}</h2>
                        <p class="text-gray-600 text-sm">{{ recipe.description }}</p>
                    </div>
                </NuxtLink>
            </li>
        </ul>

        <!-- No Results Message -->
        <div v-if="filteredRecipes.length === 0" class="text-center mt-10 text-gray-500">
            No recipes found.
        </div>
    </div>
</template>


