<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue'
import type { RecipeLang } from '~/composables/useRecipeLanguage'

type RecipeListItem = {
    path: string
    title?: string
    description?: string
    tags?: string[]
    category?: string
    image?: string
}

const { language, setLanguage, supportedLanguages } = useRecipeLanguage()

const copyByLanguage: Record<RecipeLang, {
    title: string
    searchPlaceholder: string
    all: string
    noResults: string
    languageLabel: string
    recipeImageAlt: string
}> = {
    en: {
        title: 'All Recipes',
        searchPlaceholder: 'Search recipes...',
        all: 'All',
        noResults: 'No recipes found.',
        languageLabel: 'Language',
        recipeImageAlt: 'Recipe image'
    },
    nl: {
        title: 'Alle Recepten',
        searchPlaceholder: 'Zoek recepten...',
        all: 'Alles',
        noResults: 'Geen recepten gevonden.',
        languageLabel: 'Taal',
        recipeImageAlt: 'Afbeelding van recept'
    }
}

const copy = computed(() => copyByLanguage[language.value])

const { data: recipes } = await useAsyncData('recipeData', () => queryCollection('recipes').all())

const searchQuery = ref('')
const activeCategory = ref<string | null>(null)

const isRecipeLang = (value: string): value is RecipeLang => value === 'en' || value === 'nl'

function extractLanguageFromPath(path: string): RecipeLang | null {
    const parts = path.split('/').filter(Boolean)
    const candidate = parts[1]
    return candidate && isRecipeLang(candidate) ? candidate : null
}

const recipesForLanguage = computed(() => {
    const recipeCollection = (recipes.value ?? []) as RecipeListItem[]
    return recipeCollection.filter((recipe) => extractLanguageFromPath(recipe.path) === language.value)
})

const categories = computed(() => {
    const categoriesSet = new Set<string>()
    recipesForLanguage.value.forEach((recipe) => {
        if (recipe.category) {
            categoriesSet.add(recipe.category)
        }
    })

    return Array.from(categoriesSet)
})

const filteredRecipes = computed(() => {
    const q = searchQuery.value.trim().toLowerCase()

    return recipesForLanguage.value.filter((recipe) => {
        const matchesSearch =
            !q ||
            recipe.title?.toLowerCase().includes(q) ||
            recipe.description?.toLowerCase().includes(q) ||
            recipe.tags?.some((tag) => tag.toLowerCase().includes(q))

        const matchesCategory = !activeCategory.value || recipe.category === activeCategory.value

        return matchesSearch && matchesCategory
    })
})

watch(language, () => {
    activeCategory.value = null
})

watchEffect(() => {
    useSeoMeta({
        title: `Jesse's Leafy Feasts - ${copy.value.title}`,
        description:
            'Explore a collection of delicious plant-based recipes that celebrate fresh flavors and nourishing greens. Dive into seasonal delights and leafy goodness served with love.'
    })
})
</script>

<template>
    <div class="max-w-6xl mx-auto px-4 py-10">
        <h1 class="text-3xl font-bold mb-6 text-center">{{ copy.title }}</h1>

        <div class="mb-6 flex items-center justify-center gap-2">
            <span class="text-sm font-medium text-gray-700">{{ copy.languageLabel }}:</span>
            <button v-for="option in supportedLanguages" :key="option.code"
                class="px-3 py-1 text-sm rounded-full border transition-colors" :class="language === option.code
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-700 border-gray-300'" @click="setLanguage(option.code)">
                {{ option.label }}
            </button>
        </div>

        <!-- Search Box -->
        <div class="mb-4 max-w-md mx-auto">
            <input v-model="searchQuery" type="text" :placeholder="copy.searchPlaceholder"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring focus:border-blue-300" />
        </div>

        <!-- Category Buttons -->
        <div class="mb-8 flex flex-wrap gap-2 justify-center">
            <button class="px-3 py-1 text-sm rounded-full border transition-colors" :class="!activeCategory
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-700 border-gray-300'" @click="activeCategory = null">
                {{ copy.all }}
            </button>

            <button v-for="category in categories" :key="category"
                class="px-3 py-1 text-sm rounded-full border transition-colors" :class="activeCategory === category
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300'" @click="activeCategory = category">
                {{ category }}
            </button>
        </div>

        <!-- Recipes Grid -->
        <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <li v-for="recipe in filteredRecipes" :key="recipe.path"
                class="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                <NuxtLink :to="recipe.path" class="block h-full">
                    <img v-if="recipe.image" :src="recipe.image" :alt="copy.recipeImageAlt"
                        class="w-full h-48 object-cover" />
                    <div class="p-5">
                        <h2 class="text-xl font-semibold mb-2">
                            {{ recipe.title }}
                        </h2>
                        <p class="text-gray-600 text-sm">
                            {{ recipe.description }}
                        </p>
                    </div>
                </NuxtLink>
            </li>
        </ul>

        <!-- No Results Message -->
        <div v-if="filteredRecipes.length === 0" class="text-center mt-10 text-gray-500">
            {{ copy.noResults }}
        </div>
    </div>
</template>
