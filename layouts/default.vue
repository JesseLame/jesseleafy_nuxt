<script setup>
import { useRoute } from 'vue-router'
const route = useRoute();
</script>

<template>
    <div class="min-h-screen bg-cover bg-center" :style="{
        backgroundImage: route.path === '/'
            ? 'var(--background-image-home)'
            : 'var(--background-image-default)'
    }">
        <!-- Header with Logo and Navigation -->
        <header class="bg-white/70 shadow p-4 backdrop-blur-sm">
            <div class="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-center">

                <!-- Clickable Logo -->
                <NuxtLink to="/" class="flex items-center">
                    <img src="/logo_2.png" alt="Jesse's Leafy Feasts logo" class="h-10 w-auto" />
                </NuxtLink>

                <!-- Navigation Menu -->
                <nav class="flex flex-wrap justify-center gap-4 text-green-800 text-sm font-medium">
                    <NuxtLink to="/" class="hover:underline" :class="{ 'underline font-bold': route.path === '/' }">
                        Home
                    </NuxtLink>
                    <NuxtLink to="/recipes" class="hover:underline"
                        :class="{ 'underline font-bold': route.path === '/recipes' }">
                        Recipes
                    </NuxtLink>
                    <NuxtLink to="/about" class="hover:underline"
                        :class="{ 'underline font-bold': route.path === '/about' }">
                        About
                    </NuxtLink>
                    <NuxtLink to="/contact" class="hover:underline"
                        :class="{ 'underline font-bold': route.path === '/contact' }">
                        Contact
                    </NuxtLink>
                </nav>
            </div>
        </header>

        <!-- Main Content -->
        <main class="p-6">
            <slot />
        </main>

        <!-- Footer -->
        <footer class="mt-12 py-4 text-center text-sm text-white bg-black/30">
            &copy; 2025 Jesse's Leafy Feasts. All rights reserved.
        </footer>
    </div>
</template>
