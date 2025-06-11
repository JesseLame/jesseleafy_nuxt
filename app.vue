<script setup>
const { data: recentRecipes } = await useAsyncData('recentRecipes', async () => {
  const allRecipes = await queryCollection('recipes').all()

  console.log('All Recipes app:', allRecipes)

  let categories = [...new Set(allRecipes
    .map((r) => r.categories)
    .flat()
    .filter((c) => c !== 'uncategorized'))]

  console.log('Categories:', categories)
  const tags = [...new Set(allRecipes
    .map((r) => r.tags)
    .flat()
    .filter((t) => t !== 'uncategorized'))]
  console.log('Tags:', tags)

  return allRecipes
    .filter((r) => r.created)
    .sort((a, b) => {
      return new Date(b.created) - new Date(a.created)
    })
    .slice(0, 6)
})

useSeoMeta({
  title: 'Jesse\'s Leafy Feasts - Home',
  description: 'A celebration of fresh flavors, nourishing greens, and plant-based magic. Dive into seasonal recipes, kitchen tales, and leafy goodness served with love.',
})

</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
