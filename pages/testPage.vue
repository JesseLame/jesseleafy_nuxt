<script setup lang="ts">
const { data: home } = await useAsyncData(() => queryCollection('content').path('/banana').first())

useSeoMeta({
  title: home.value?.title,
  description: home.value?.description,
  ingredients: home.value?.ingredients,
  instructions: home.value?.instructions
})
</script>

<template>
  <ContentRenderer v-if="home" :value="home" />
  <div v-else>Home not found</div>
</template>
