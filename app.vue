<script setup>
import { parse } from 'date-fns'

const { data: recentRecipes } = await useAsyncData('recentRecipes', async () => {
  const allRecipes = await queryCollection('recipes').all()

  const englishRecipes = allRecipes.filter((recipe) => recipe.path?.startsWith('/recipes/en/'))

  const recentRecipes = englishRecipes
    .filter((r) => r.created)
    .map((r) => ({
      ...r,
      _createdParsed: parse(r.created, 'dd-MM-yyyy', new Date())
    }))
    .filter((r) => !isNaN(r._createdParsed))
    .sort((a, b) => b._createdParsed - a._createdParsed)
    .slice(0, 6)

  return recentRecipes
})

useSeoMeta({
  title: "Jesse's Leafy Feasts - Home",
  description: 'A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love.',
})
</script>


<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
