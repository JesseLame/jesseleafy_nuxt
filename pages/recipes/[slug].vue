<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute();
const slug = route.params.slug;

// Use queryCollection to get the content matching this slug
const { data: recipe } = await useAsyncData(() => queryCollection('content').path(`/${slug}`).first())

watchEffect(() => {
    const recipeValue = recipe.value;
    if (recipeValue) {
        const { title, description, meta } = recipeValue;
        let { ingredients, instructions } = meta;

        let ingredientsSplit = false;
        if (!Array.isArray(ingredients)) {
            ingredientsSplit = true;
        }

        recipeValue.meta.ingredientsSplit = ingredientsSplit;
    }

    useSeoMeta({
        title: recipeValue?.title || 'Recipe Not Found',
        description: recipeValue?.description || 'Delicious plant-based recipe',
        ingredients: recipeValue?.meta.ingredients || [],
        instructions: recipeValue?.meta.instructions || []
    });
});

</script>

<template>
    <div v-if="recipe" class="mx-auto mt-10 mb-16 w-full max-w-3xl bg-white shadow-xl rounded-xl p-8">
        <!-- Recipe Image -->
        <img v-if="recipe.meta.image" :src="recipe.meta.image" :alt="recipe.title"
            class="w-full h-64 object-cover rounded-lg mb-6" />

        <!-- Title & Description -->
        <h1 class="text-4xl font-bold mb-4 text-gray-900">{{ recipe.title }}</h1>
        <p class="text-lg text-gray-600 mb-8">{{ recipe.description }}</p>

        <!-- Long description -->
        <div v-if="recipe.meta.description_long" class="text-gray-700 mb-6">
            <p v-for="(paragraph, index) in recipe.meta.description_long.split('\n')" :key="index">
                {{ paragraph }}
            </p>
        </div>

        <!-- Ingredients -->
        <section>
            <h2 class="text-2xl font-semibold text-green-700 mb-3">Ingredients</h2>

            <!-- Flat list version -->
            <ul v-if="!recipe.meta.ingredientsSplit" class="list-disc list-inside space-y-1 text-gray-800">
                <li v-for="item in recipe.meta.ingredients" :key="item">{{ item }}</li>
            </ul>

            <!-- Sectioned list version -->
            <div v-else class="space-y-4">
                <div v-for="(items, section) in recipe.meta.ingredients" :key="section">
                    <h3 class="text-xl font-semibold text-green-600 mb-1 capitalize">
                        {{ section.replace(/_/g, ' ') }}
                    </h3>
                    <ul class="list-disc list-inside space-y-1 text-gray-800">
                        <li v-for="item in items" :key="item">{{ item }}</li>
                    </ul>
                </div>
            </div>
        </section>


        <!-- Instructions -->
        <section class="mt-8">
            <h2 class="text-2xl font-semibold text-green-700 mb-3">Instructions</h2>
            <ol class="list-decimal list-inside space-y-2 text-gray-800">
                <li v-for="step in recipe.meta.instructions" :key="step">{{ step }}</li>
            </ol>
        </section>
    </div>

    <div v-else class="text-center text-gray-500 py-20">
        <p>Recipe not found.</p>
    </div>
</template>



