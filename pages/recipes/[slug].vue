<script setup lang="ts">
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt()

const route = useRoute()
const slug = route.params.slug

const { data: recipe } = await useAsyncData('recipe', () =>
    queryCollection('recipes').path(`/recipes/${slug}`).first()
)

// Determine if ingredients are grouped
const ingredientsSplit = computed(() =>
    recipe.value && !Array.isArray(recipe.value.ingredients)
)

const descriptionLongHTML = computed(() => {
    const raw = recipe.value?.description_long || ''
    return md.render(raw.replace(/\\n/g, '\n')) // Replace literal \n with real line breaks
})

const parseIngredient = (item: string): string => {
    const linkRegex = /\((\/[^\s)]+)\)/ // Matches (link) pattern
    const match = item.match(linkRegex)

    if (match) {
        const text = item.replace(linkRegex, '').trim()
        const href = match[1]
        return `<a href="${href}" class="text-green-600 underline hover:text-green-800">${text}</a>`
    } else {
        return item
    }
}


watchEffect(() => {
    if (recipe.value) {
        console.log('Recipe:', recipe.value)
    }

    useSeoMeta({
        title: recipe.value?.title || 'Recipe',
        description: recipe.value?.description || 'A delicious recipe from Jesse\'s Leafy Feasts.',
        image: recipe.value?.image || '/default-recipe-image.jpg',
    })
})
</script>

<template>
    <div v-if="recipe" class="mx-4 sm:mx-auto mt-10 mb-16 w-full max-w-3xl bg-white shadow-xl rounded-xl p-4 sm:p-8">
        <img v-if="recipe.image" :src="recipe.image" :alt="recipe.title"
            class="w-full aspect-square object-cover rounded-lg mb-6" />
        <h1 class="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">{{ recipe.title }}</h1>
        <p class="text-base sm:text-lg text-gray-600 mb-8">{{ recipe.description }}</p>

        <!-- Long description -->
        <div v-if="descriptionLongHTML" class="text-gray-700 mb-6 prose" v-html="descriptionLongHTML"></div>

        <!-- Ingredients -->
        <section>
            <h2 class="text-2xl font-semibold text-green-700 mb-3">Ingredients</h2>

            <!-- Flat list version -->
            <ul v-if="!ingredientsSplit" class="list-disc list-inside space-y-1 text-gray-800">
                <li v-for="item in recipe.ingredients" :key="item" v-html="parseIngredient(item)"></li>
            </ul>

            <!-- Sectioned list version -->
            <div v-else class="space-y-4">
                <div v-for="(items, section) in recipe.ingredients" :key="section">
                    <h3 class="text-xl font-semibold text-green-600 mb-1 capitalize">
                        {{ section.replace(/_/g, ' ') }}
                    </h3>
                    <ul class="list-disc list-inside space-y-1 text-gray-800">
                        <li v-for="item in items" :key="item" v-html="parseIngredient(item)"></li>
                    </ul>
                </div>
            </div>
        </section>


        <!-- Instructions -->
        <section class="mt-8">
            <h2 class="text-2xl font-semibold text-green-700 mb-3">Instructions</h2>
            <ol class="list-decimal list-inside space-y-2 text-gray-800">
                <li v-for="step in recipe.instructions" :key="step">{{ step }}</li>
            </ol>
        </section>
    </div>

    <div v-else class="text-center text-gray-500 py-20">
        <p>Recipe not found.</p>
    </div>
</template>
