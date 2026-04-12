<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Board } from '~/types/board';

useSeoMeta({
	title: "Boards - Jesse's Leafy Feasts",
	description: 'Private idea boards for planning concepts, flavors, and decorations.',
});

const { isAuthenticated, isLoading } = useAuth();
const { listBoards, createBoard } = useBoards();

const boards = ref<Board[]>([]);
const pageError = ref('');
const loadingBoards = ref(false);
const isSubmitting = ref(false);

const newBoardTitle = ref('');
const newBoardDescription = ref('');

const loadBoards = async () => {
	loadingBoards.value = true;
	pageError.value = '';

	try {
		boards.value = await listBoards();
	} catch (error) {
		pageError.value = error instanceof Error ? error.message : 'Unable to load your boards right now.';
	} finally {
		loadingBoards.value = false;
	}
};

watch(
	[isLoading, isAuthenticated],
	async ([loading, authenticated]) => {
		if (loading) {
			return;
		}

		if (!authenticated) {
			await navigateTo('/login?redirect=%2Fboards', { replace: true });
			return;
		}

		await loadBoards();
	},
	{ immediate: true }
);

const handleCreateBoard = async () => {
	pageError.value = '';

	if (!newBoardTitle.value.trim()) {
		pageError.value = 'Give your board a title before creating it.';
		return;
	}

	isSubmitting.value = true;

	try {
		const board = await createBoard({
			title: newBoardTitle.value,
			description: newBoardDescription.value,
		});

		newBoardTitle.value = '';
		newBoardDescription.value = '';

		await navigateTo(`/boards/${board.id}`);
	} catch (error) {
		pageError.value = error instanceof Error ? error.message : 'Unable to create your board right now.';
	} finally {
		isSubmitting.value = false;
	}
};
</script>

<template>
	<div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
		<section class="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
			<p class="text-sm font-semibold uppercase tracking-[0.2em] text-green-700/80">
				Board Studio
			</p>
			<h1 class="mt-3 text-3xl font-black text-green-900 sm:text-4xl">
				Private idea boards for your bakes and concepts
			</h1>
			<p class="mt-3 max-w-3xl text-base text-gray-700 sm:text-lg">
				Capture components, flavors, decorations, and constraints in one place, then turn them into concepts when they click.
			</p>
		</section>

		<section class="grid gap-6 lg:grid-cols-[minmax(0,1fr),22rem]">
			<div class="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm">
				<div class="flex items-center justify-between gap-3">
					<div>
						<h2 class="text-2xl font-bold text-green-900">
							Your Boards
						</h2>
						<p class="mt-1 text-sm text-gray-600">
							Open a board to place cards, group concepts, and iterate on versions.
						</p>
					</div>

					<button
						type="button"
						class="rounded-full border border-green-700/20 px-4 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-50"
						:disabled="loadingBoards"
						@click="loadBoards"
					>
						Refresh
					</button>
				</div>

				<p v-if="pageError" class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
					{{ pageError }}
				</p>

				<div v-if="isLoading || loadingBoards" class="mt-6 rounded-2xl border border-dashed border-green-200 bg-green-50/60 px-5 py-8 text-center text-sm text-green-900/80">
					Loading your boards...
				</div>

				<div v-else-if="boards.length" class="mt-6 grid gap-4 md:grid-cols-2">
					<NuxtLink
						v-for="board in boards"
						:key="board.id"
						:to="`/boards/${board.id}`"
						class="group rounded-3xl border border-green-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
					>
						<div class="flex items-start justify-between gap-3">
							<div>
								<h3 class="text-xl font-semibold text-green-900 group-hover:text-green-700">
									{{ board.title }}
								</h3>
								<p class="mt-2 text-sm text-gray-600">
									{{ board.description || 'No description yet. Open the board and start placing ideas.' }}
								</p>
							</div>
							<span class="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
								Board
							</span>
						</div>
					</NuxtLink>
				</div>

				<div v-else class="mt-6 rounded-3xl border border-dashed border-green-200 bg-green-50/70 px-6 py-12 text-center">
					<h3 class="text-xl font-semibold text-green-900">
						Your first concept board starts here
					</h3>
					<p class="mt-2 text-sm text-gray-700">
						Create a board for wedding cakes, tart experiments, seasonal boxes, or any other creative thread you want to keep together.
					</p>
				</div>
			</div>

			<aside class="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm">
				<h2 class="text-2xl font-bold text-green-900">
					Create a Board
				</h2>
				<p class="mt-2 text-sm text-gray-600">
					Use one board per project, client brief, season, or product family.
				</p>

				<form class="mt-6 space-y-4" @submit.prevent="handleCreateBoard">
					<div>
						<label for="board-title" class="block text-sm font-medium text-gray-700">
							Title
						</label>
						<input
							id="board-title"
							v-model="newBoardTitle"
							type="text"
							maxlength="120"
							class="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
							placeholder="Spring wedding cake ideas"
						/>
					</div>

					<div>
						<label for="board-description" class="block text-sm font-medium text-gray-700">
							Description
						</label>
						<textarea
							id="board-description"
							v-model="newBoardDescription"
							rows="5"
							class="mt-1 w-full rounded-2xl border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/30"
							placeholder="Client brief, mood, product goals, or what you want to explore."
						/>
					</div>

					<button
						type="submit"
						:disabled="isSubmitting || isLoading"
						class="w-full rounded-2xl bg-green-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{{ isSubmitting ? 'Creating board...' : 'Create and open board' }}
					</button>
				</form>
			</aside>
		</section>
	</div>
</template>
