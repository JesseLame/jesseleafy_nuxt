<script setup>
const route = useRoute();
</script>

<template>
    <div class="min-h-screen bg-cover bg-center" :style="{
        backgroundImage: route.path === '/'
            ? 'var(--background-image-home)'
            : 'var(--background-image-default)'
    }">
        <header class="bg-white/70 shadow p-4 text-center text-xl font-semibold text-indigo-700 backdrop-blur-sm">
            My Nuxt Site
        </header>

        <main class="p-6">
            <slot />
        </main>

        <footer class="mt-12 py-4 text-center text-sm text-white bg-black/30">
            &copy; 2025 Your Name
        </footer>
    </div>
</template>
