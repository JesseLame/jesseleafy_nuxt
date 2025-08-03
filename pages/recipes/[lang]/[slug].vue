<script setup lang="ts">
import { useRoute } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { toRaw } from 'vue'

const md = new MarkdownIt()
const route = useRoute()
const slug = route.params.slug as string
const lang = route.params.lang as string
const { comments, loading, error, fetchComments, addComment } = useComments(slug);

const newText = ref('');
const newAuthor = ref('');
const replyTexts = ref<Record<number, string>>({});
const replyAuthors = ref<Record<number, string>>({});
const showReplyForm = ref<Record<number, boolean>>({});

const { data: recipe } = await useAsyncData('recipe', () =>
    queryCollection('recipes').path(`/recipes/${lang}/${slug}`).first()
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

const setIngredientsAsGroceries = () => {
    if (!recipe.value || !recipe.value.ingredients) {
        console.error('No ingredients found in the recipe.')
        return
    }

    let rawIngredients = toRaw(recipe.value.ingredients) as string[]

    // Check if the ingredients are grouped
    if (ingredientsSplit.value) {
        // Flatten the grouped ingredients
        const flattened = Object.values(rawIngredients).flat()
        rawIngredients = flattened
    }

    const groceries = rawIngredients.map(item => ({
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
        hour12: false, 
    }
    return new Date(dateStr).toLocaleString(undefined, options)
}

async function submitComment() {
    await addComment(newText.value, newAuthor.value);
    newText.value = '';
    newAuthor.value = '';
}

// Submit reply tied to a parent comment ID
async function submitReply(parentId: number) {
    const text = replyTexts.value[parentId];
    const author = replyAuthors.value[parentId];

    console.log('Submitting reply:', { text, author, parentId });

    if (!text || !author) return;

    await addComment(text, author, parentId);
    replyTexts.value[parentId] = '';
    replyAuthors.value[parentId] = '';
}

function toggleReplyForm(commentId: number) {
    showReplyForm.value[commentId] = !showReplyForm.value[commentId];
}


onMounted(async () => {
    await fetchComments()
    console.log('Loaded Comments:', comments.value)
})

watchEffect(() => {
    if (recipe.value) {
        console.log('Recipe:', recipe.value)
    }

    useSeoMeta({
        title: recipe.value?.title || 'Recipe',
        description: recipe.value?.description || 'A delicious recipe from Jesse\'s Leafy Feasts.',
    })
})
</script>

<template>
    <div v-if="recipe" class="mx-4 sm:mx-auto mt-10 mb-16 w-full max-w-3xl bg-white shadow-xl rounded-xl p-4 sm:p-8">
        <img v-if="recipe.image" :src="recipe.image" :alt="recipe.title"
            class="w-full aspect-square object-cover rounded-lg mb-6" />
        <!-- <div class="flex justify-end mb-4">
            <button
                @click="$router.push({ name: 'recipes-lang-slug', params: { lang: lang === 'en' ? 'nl' : 'en', slug } })"
                class="px-3 py-1 bg-green-600 text-white font-medium text-sm rounded-md hover:bg-green-700 transition">
                Switch to {{ lang === 'en' ? 'Dutch' : 'English' }}
            </button>
        </div> -->


        <h1 class="text-2xl sm:text-4xl font-bold mb-4 text-gray-900">{{ recipe.title }}</h1>
        <p class="text-base sm:text-lg text-gray-600 mb-8">{{ recipe.description }}</p>

        <!-- Long description -->
        <div v-if="descriptionLongHTML" class="text-gray-700 mb-6 prose" v-html="descriptionLongHTML"></div>

        <button @click="setIngredientsAsGroceries"
            class="mt-6 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
            Add to groceries list
        </button>

        <!-- Ingredients -->
        <section>
            <h2 class="text-2xl font-semibold text-green-700 mb-3">Ingredients</h2>

            <!-- Flat list version -->
            <ul v-if="!ingredientsSplit" class="list-disc list-inside space-y-1 text-gray-800">
                <li v-for="(item, index) in recipe.ingredients" :key="index" v-html="parseIngredient(item as string)">
                </li>
            </ul>

            <!-- Sectioned list version -->
            <div v-else class="space-y-4">
                <div v-for="(items, section) in recipe.ingredients" :key="section">
                    <h3 class="text-xl font-semibold text-green-600 mb-1 capitalize">
                        {{ String(section).replace(/_/g, ' ') }}
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

        <!-- Comments Section -->
        <section class="mt-10">
            <h2 class="text-2xl font-semibold text-green-700 mb-3">Comments</h2>

            <!-- Comment Form -->
            <div class="mb-6">
                <input v-model="newAuthor" type="text" placeholder="Your name" class="w-full p-2 mb-2 border rounded" />
                <textarea v-model="newText" placeholder="Write a comment..." class="w-full p-2 border rounded"
                    rows="3"></textarea>
                <button @click="submitComment"
                    class="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                    Submit Comment
                </button>
                <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
            </div>

            <!-- Comment List -->
            <div v-if="comments.length" class="space-y-4">
                <div v-for="comment in comments" :key="comment.id" class="p-4 border rounded-lg bg-gray-50">
                    <div class="text-sm text-gray-500 mb-1">
                        <span class="font-semibold text-gray-800">{{ comment.author_name }}</span>
                        <span>•</span>
                        <span>{{ formatDate(comment.created_at) }}</span>
                    </div>
                    <p class="text-gray-800">{{ comment.text }}</p>

                    <!-- Existing Replies -->
                    <div v-if="comment.replies && comment.replies.length" class="ml-4 mt-2 space-y-2">
                        <div v-for="reply in comment.replies" :key="reply.id"
                            class="text-sm text-gray-700 bg-white p-2 rounded border">
                            <strong>{{ reply.author_name }}:</strong> {{ reply.text }}
                        </div>
                    </div>

                    <!-- Reply Button -->
                    <button @click="toggleReplyForm(comment.id)" class="mt-2 text-green-600 text-sm hover:underline">
                        Reply
                    </button>

                    <!-- Reply Form -->
                    <div v-if="showReplyForm[comment.id]" class="ml-4 mt-3">
                        <input v-model="replyAuthors[comment.id]" type="text" placeholder="Your name"
                            class="w-full p-2 mb-1 border rounded text-sm" />
                        <textarea v-model="replyTexts[comment.id]" placeholder="Write a reply..."
                            class="w-full p-2 border rounded text-sm" rows="2"></textarea>
                        <button @click="submitReply(comment.id)"
                            class="mt-2 px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                            Submit Reply
                        </button>
                    </div>

                </div>
            </div>

            <div v-else class="text-gray-500">No comments yet.</div>
        </section>

    </div>

    <div v-else class="text-center text-gray-500 py-20">
        <p>Recipe not found.</p>
    </div>
</template>

<style>
li a {
    color: #059669;
    /* green-600 */
    text-decoration: underline;
}

li a:hover {
    color: #047857;
    /* green-700 */
    text-decoration: underline;
    }
</style>


