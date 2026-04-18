<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import type { RecipeLang } from '~/composables/useRecipeLanguage'
import type { RecipeDetail } from '~/types/recipe'
import {
    buildRecipePath,
    flattenIngredientSections,
    formatIngredientSectionTitle,
    isRecipeLang,
    normalizeRecipeHref,
} from '~/utils/recipe'

type RecipePageCopy = {
    languageLabel: string
    addToGroceries: string
    ingredients: string
    instructions: string
    comments: string
    yourName: string
    writeComment: string
    submitComment: string
    reply: string
    writeReply: string
    submitReply: string
    noComments: string
    recipeNotFound: string
    translationUnavailable: (targetLanguageLabel: string) => string
    fallbackSeoTitle: string
    fallbackSeoDescription: string
}

const copyByLanguage: Record<RecipeLang, RecipePageCopy> = {
    en: {
        languageLabel: 'Language',
        addToGroceries: 'Add to groceries list',
        ingredients: 'Ingredients',
        instructions: 'Instructions',
        comments: 'Comments',
        yourName: 'Your name',
        writeComment: 'Write a comment...',
        submitComment: 'Submit Comment',
        reply: 'Reply',
        writeReply: 'Write a reply...',
        submitReply: 'Submit Reply',
        noComments: 'No comments yet.',
        recipeNotFound: 'Recipe not found.',
        translationUnavailable: (targetLanguageLabel: string) => `This recipe is not available in ${targetLanguageLabel} yet.`,
        fallbackSeoTitle: 'Recipe',
        fallbackSeoDescription: "A delicious recipe from Jesse's Leafy Feasts."
    },
    nl: {
        languageLabel: 'Taal',
        addToGroceries: 'Toevoegen aan boodschappenlijst',
        ingredients: 'Ingredienten',
        instructions: 'Instructies',
        comments: 'Reacties',
        yourName: 'Je naam',
        writeComment: 'Schrijf een reactie...',
        submitComment: 'Plaats reactie',
        reply: 'Beantwoorden',
        writeReply: 'Schrijf een antwoord...',
        submitReply: 'Plaats antwoord',
        noComments: 'Nog geen reacties.',
        recipeNotFound: 'Recept niet gevonden.',
        translationUnavailable: (targetLanguageLabel: string) => `Dit recept is nog niet beschikbaar in ${targetLanguageLabel}.`,
        fallbackSeoTitle: 'Recept',
        fallbackSeoDescription: "Een heerlijk recept van Jesse's Leafy Feasts."
    }
}

const md = new MarkdownIt()
const route = useRoute()
const router = useRouter()
const { language, setLanguage, supportedLanguages } = useRecipeLanguage()

const slug = computed(() => String(route.params.slug || ''))
const routeLang = computed<RecipeLang | null>(() => {
    return isRecipeLang(route.params.lang) ? route.params.lang : null
})

const activeLanguage = computed<RecipeLang>(() => routeLang.value ?? 'en')
const copy = computed(() => copyByLanguage[activeLanguage.value])
const translationAvailabilityMessage = ref('')

watch(routeLang, (nextLanguage) => {
    if (nextLanguage && language.value !== nextLanguage) {
        setLanguage(nextLanguage)
    }
}, { immediate: true })

watch([routeLang, slug], () => {
    translationAvailabilityMessage.value = ''
})

const { comments, error, fetchComments, addComment } = useComments(slug.value)

const newText = ref('')
const newAuthor = ref('')
const replyTexts = ref<Record<number, string>>({})
const replyAuthors = ref<Record<number, string>>({})
const showReplyForm = ref<Record<number, boolean>>({})

const { data: recipe } = await useAsyncData<RecipeDetail | null>(
    () => `recipe-${routeLang.value ?? 'invalid'}-${slug.value}`,
    () => {
        if (!routeLang.value) {
            return null
        }

        return $fetch(`/api/recipes/${routeLang.value}/${slug.value}`)
    },
    {
        watch: [routeLang, slug],
        default: () => null,
    }
)

const ingredientsSplit = computed(() => {
    const sections = recipe.value?.ingredientSections ?? []
    return !(sections.length === 1 && !sections[0]?.title)
})

const descriptionLongHTML = computed(() => {
    const raw = recipe.value?.bodyMarkdown || ''

    if (!raw) {
        return ''
    }

    return md.render(raw.replace(/\\n/g, '\n'))
})

const parseIngredient = (item: string): string => {
    const linkRegex = /\((\/[^\s)]+)\)/
    const match = item.match(linkRegex)

    if (!match) {
        return item
    }

    const text = item.replace(linkRegex, '').trim()
    const normalizedHref = normalizeRecipeHref(match[1], activeLanguage.value)
    return `<a href="${normalizedHref}" class="text-green-600 underline hover:text-green-800">${text}</a>`
}

const setIngredientsAsGroceries = () => {
    if (!recipe.value?.ingredientSections.length) {
        return
    }

    const groceries = flattenIngredientSections(recipe.value.ingredientSections).map((item) => ({
        name: item,
        checked: false
    }))

    localStorage.setItem('groceries', JSON.stringify(groceries))
    window.location.href = '/list'
}

const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }

    return new Date(dateStr).toLocaleString(undefined, options)
}

const switchLanguage = async (targetLanguage: RecipeLang) => {
    translationAvailabilityMessage.value = ''

    if (!routeLang.value || targetLanguage === routeLang.value) {
        return
    }

    if (!recipe.value?.availableLanguages.includes(targetLanguage)) {
        const targetLanguageLabel = supportedLanguages.find((option) => option.code === targetLanguage)?.label ?? targetLanguage
        translationAvailabilityMessage.value = copy.value.translationUnavailable(targetLanguageLabel)
        return
    }

    setLanguage(targetLanguage)
    await router.push(buildRecipePath(targetLanguage, slug.value))
}

async function submitComment() {
    await addComment(newText.value, newAuthor.value)
    newText.value = ''
    newAuthor.value = ''
}

async function submitReply(parentId: number) {
    const text = replyTexts.value[parentId]
    const author = replyAuthors.value[parentId]

    if (!text || !author) {
        return
    }

    await addComment(text, author, parentId)
    replyTexts.value[parentId] = ''
    replyAuthors.value[parentId] = ''
}

function toggleReplyForm(commentId: number) {
    showReplyForm.value[commentId] = !showReplyForm.value[commentId]
}

onMounted(async () => {
    await fetchComments()
})

watchEffect(() => {
    useSeoMeta({
        title: recipe.value?.title || copy.value.fallbackSeoTitle,
        description: recipe.value?.description || copy.value.fallbackSeoDescription
    })
})
</script>

<template>
    <div v-if="recipe" class="mx-4 sm:mx-auto mt-10 mb-16 w-full max-w-3xl bg-white shadow-xl rounded-xl p-4 sm:p-8">
        <div class="mb-4">
            <div class="flex flex-wrap items-center gap-2">
                <span class="text-sm font-medium text-gray-700">{{ copy.languageLabel }}:</span>
                <button v-for="option in supportedLanguages" :key="option.code"
                    class="px-3 py-1 text-sm rounded-full border transition-colors" :class="activeLanguage === option.code
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300'" @click="switchLanguage(option.code)">
                    {{ option.label }}
                </button>
            </div>
            <p v-if="translationAvailabilityMessage" class="mt-2 text-sm text-amber-700">
                {{ translationAvailabilityMessage }}
            </p>
        </div>

        <img v-if="recipe.image" :src="recipe.image" :alt="recipe.title" class="w-full aspect-square object-cover rounded-lg mb-6" />

        <h1 class="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">{{ recipe.title }}</h1>
        <p class="text-base sm:text-lg text-gray-600 mb-8">{{ recipe.description }}</p>

        <div v-if="descriptionLongHTML" class="text-gray-700 mb-6 prose" v-html="descriptionLongHTML"></div>

        <button @click="setIngredientsAsGroceries"
            class="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
            {{ copy.addToGroceries }}
        </button>

        <section>
            <h2 class="text-2xl font-semibold text-green-700 mb-3">{{ copy.ingredients }}</h2>

            <ul v-if="!ingredientsSplit" class="list-disc list-inside space-y-1 text-gray-800">
                <li v-for="(item, index) in recipe.ingredientSections[0]?.items ?? []" :key="index" v-html="parseIngredient(item)">
                </li>
            </ul>

            <div v-else class="space-y-4">
                <div v-for="(section, index) in recipe.ingredientSections" :key="section.title ?? index">
                    <h3 class="text-xl font-semibold text-green-600 mb-1 capitalize">
                        {{ formatIngredientSectionTitle(section.title) }}
                    </h3>
                    <ul class="list-disc list-inside space-y-1 text-gray-800">
                        <li v-for="item in section.items" :key="item" v-html="parseIngredient(item)"></li>
                    </ul>
                </div>
            </div>
        </section>

        <section class="mt-8">
            <h2 class="text-2xl font-semibold text-green-700 mb-3">{{ copy.instructions }}</h2>
            <ol class="list-decimal list-inside space-y-2 text-gray-800">
                <li v-for="step in recipe.instructionSteps" :key="step">{{ step }}</li>
            </ol>
        </section>

        <section class="mt-10">
            <h2 class="text-2xl font-semibold text-green-700 mb-3">{{ copy.comments }}</h2>

            <div class="mb-6">
                <input v-model="newAuthor" type="text" :placeholder="copy.yourName" class="w-full p-2 mb-2 border rounded" />
                <textarea v-model="newText" :placeholder="copy.writeComment" class="w-full p-2 border rounded" rows="3"></textarea>
                <button @click="submitComment" class="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    {{ copy.submitComment }}
                </button>
                <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
            </div>

            <div v-if="comments.length" class="space-y-4">
                <div v-for="comment in comments" :key="comment.id" class="p-4 border rounded-lg bg-gray-50">
                    <div class="text-sm text-gray-500 mb-1">
                        <span class="font-semibold text-gray-800">{{ comment.author_name }}</span>
                        <span>•</span>
                        <span>{{ formatDate(comment.created_at) }}</span>
                    </div>
                    <p class="text-gray-800">{{ comment.text }}</p>

                    <div v-if="comment.replies && comment.replies.length" class="ml-4 mt-2 space-y-2">
                        <div v-for="reply in comment.replies" :key="reply.id"
                            class="text-sm text-gray-700 bg-white p-2 rounded border">
                            <strong>{{ reply.author_name }}:</strong> {{ reply.text }}
                        </div>
                    </div>

                    <button @click="toggleReplyForm(comment.id)" class="mt-2 text-green-600 text-sm hover:underline">
                        {{ copy.reply }}
                    </button>

                    <div v-if="showReplyForm[comment.id]" class="ml-4 mt-3">
                        <input v-model="replyAuthors[comment.id]" type="text" :placeholder="copy.yourName"
                            class="w-full p-2 mb-1 border rounded text-sm" />
                        <textarea v-model="replyTexts[comment.id]" :placeholder="copy.writeReply"
                            class="w-full p-2 border rounded text-sm" rows="2"></textarea>
                        <button @click="submitReply(comment.id)"
                            class="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                            {{ copy.submitReply }}
                        </button>
                    </div>
                </div>
            </div>

            <div v-else class="text-gray-500">{{ copy.noComments }}</div>
        </section>
    </div>

    <div v-else class="text-center text-gray-500 py-20">
        <p>{{ copy.recipeNotFound }}</p>
    </div>
</template>

<style>
li a {
    color: #059669;
    text-decoration: underline;
}

li a:hover {
    color: #047857;
    text-decoration: underline;
}
</style>
