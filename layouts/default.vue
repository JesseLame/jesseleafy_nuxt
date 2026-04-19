<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { user, isAuthenticated, isAdmin, isLoading, signOut } = useAuth();
const authError = ref('');
const authMenuOpen = ref(false);
const authMenuRef = ref<HTMLElement | null>(null);
const userDisplayLabel = computed(() => {
	const displayName = user.value?.user_metadata?.name;

	if (typeof displayName === 'string' && displayName.trim()) {
		return displayName.trim();
	}

	if (user.value?.email) {
		return user.value.email;
	}

	return 'Account';
});

const closeAuthMenu = () => {
	authMenuOpen.value = false;
};

const toggleAuthMenu = () => {
	authMenuOpen.value = !authMenuOpen.value;
};

const handleDocumentClick = (event: MouseEvent) => {
	if (!authMenuRef.value) {
		return;
	}

	if (event.target instanceof Node && !authMenuRef.value.contains(event.target)) {
		closeAuthMenu();
	}
};

const handleDocumentKeydown = (event: KeyboardEvent) => {
	if (event.key === 'Escape') {
		closeAuthMenu();
	}
};

const handleSignOut = async () => {
	authError.value = '';
	closeAuthMenu();

	try {
		await signOut();

		if (route.path !== '/') {
			await navigateTo('/');
		}
	} catch (error) {
		authError.value = error instanceof Error ? error.message : 'Unable to sign out right now.';
	}
};

onMounted(() => {
	document.addEventListener('click', handleDocumentClick);
	document.addEventListener('keydown', handleDocumentKeydown);
});

onBeforeUnmount(() => {
	document.removeEventListener('click', handleDocumentClick);
	document.removeEventListener('keydown', handleDocumentKeydown);
});
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
                    <NuxtLink to="/list" class="hover:underline"
                        :class="{ 'underline font-bold': route.path === '/list' }">
                        Grocery List
                    </NuxtLink>
                    <ClientOnly>
                        <NuxtLink v-if="isAuthenticated" to="/boards" class="hover:underline"
                            :class="{ 'underline font-bold': route.path.startsWith('/boards') }">
                            Boards
                        </NuxtLink>
                    </ClientOnly>
                    <NuxtLink to="/about" class="hover:underline"
                        :class="{ 'underline font-bold': route.path === '/about' }">
                        About
                    </NuxtLink>
                    <NuxtLink to="/contact" class="hover:underline"
                        :class="{ 'underline font-bold': route.path === '/contact' }">
                        Contact
                    </NuxtLink>
                    <ClientOnly>
                        <template #fallback>
                            <button type="button"
                                class="flex h-9 w-9 items-center justify-center rounded-md border border-green-700/30 bg-white/70 text-green-900"
                                aria-label="Open account menu">
                                <span class="sr-only">Open account menu</span>
                                <span class="flex flex-col gap-1">
                                    <span class="block h-0.5 w-4 rounded bg-current"></span>
                                    <span class="block h-0.5 w-4 rounded bg-current"></span>
                                    <span class="block h-0.5 w-4 rounded bg-current"></span>
                                </span>
                            </button>
                        </template>

                        <div v-if="!isLoading" ref="authMenuRef" class="relative">
                            <button v-if="!isAuthenticated" type="button"
                                class="flex h-9 w-9 items-center justify-center rounded-md border border-green-700/30 bg-white/70 text-green-900 transition hover:bg-white"
                                aria-label="Open account menu" :aria-expanded="authMenuOpen ? 'true' : 'false'"
                                @click.stop="toggleAuthMenu">
                                <span class="sr-only">Open account menu</span>
                                <span class="flex flex-col gap-1">
                                    <span class="block h-0.5 w-4 rounded bg-current"></span>
                                    <span class="block h-0.5 w-4 rounded bg-current"></span>
                                    <span class="block h-0.5 w-4 rounded bg-current"></span>
                                </span>
                            </button>

                            <button v-else type="button"
                                class="flex items-center gap-2 rounded-md border border-green-700/30 bg-white/70 px-3 py-2 text-green-900 transition hover:bg-white"
                                aria-label="Open account menu" :aria-expanded="authMenuOpen ? 'true' : 'false'"
                                @click.stop="toggleAuthMenu">
                                <span class="max-w-[12rem] truncate" :title="userDisplayLabel">
                                    {{ userDisplayLabel }}
                                </span>
                                <span class="text-xs" aria-hidden="true">
                                    ▼
                                </span>
                            </button>

                            <div v-if="authMenuOpen"
                                class="absolute right-0 top-full z-20 mt-2 min-w-[11rem] rounded-lg border border-green-700/20 bg-white shadow-lg">
								<template v-if="!isAuthenticated">
									<NuxtLink to="/login"
										class="block px-4 py-2 text-left text-green-900 hover:bg-green-50 rounded-t-lg"
										@click="closeAuthMenu">
                                        Login
                                    </NuxtLink>
                                    <NuxtLink to="/create-account"
                                        class="block px-4 py-2 text-left text-green-900 hover:bg-green-50 rounded-b-lg"
                                        @click="closeAuthMenu">
                                        Create Account
                                    </NuxtLink>
								</template>

								<template v-else>
									<NuxtLink v-if="isAdmin" to="/admin/recipes"
										class="block px-4 py-2 text-left text-green-900 hover:bg-green-50"
										@click="closeAuthMenu">
										Admin
									</NuxtLink>
									<button type="button"
										class="block w-full rounded-lg px-4 py-2 text-left text-green-900 hover:bg-green-50"
										:class="{ 'rounded-t-none': isAdmin }"
										@click="handleSignOut">
										Logout
									</button>
								</template>
							</div>
						</div>
					</ClientOnly>
                </nav>
            </div>
            <p v-if="authError" class="mt-3 text-center text-sm text-red-600">
                {{ authError }}
            </p>
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
