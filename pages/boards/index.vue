<script setup lang="ts">
import { ref, watch } from 'vue';
import BoardCreateModal from '~/components/boards/BoardCreateModal.vue';
import type { Board } from '~/types/board';

useSeoMeta({
	title: "Boards - Jesse's Leafy Feasts",
	description: 'Private idea boards for planning concepts, flavors, and decorations.',
});

const route = useRoute();
const { isAuthenticated, isLoading } = useAuth();
const { listBoards, createBoard, deleteBoard } = useBoards();

const boards = ref<Board[]>([]);
const pageError = ref('');
const successMessage = ref('');
const loadingBoards = ref(false);
const deletingBoardId = ref<string | null>(null);
const isCreateModalOpen = ref(false);
const isSubmitting = ref(false);
const createError = ref('');

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

watch(
	() => route.query.deleted,
	async (deletedQuery) => {
		const wasDeleted = Array.isArray(deletedQuery) ? deletedQuery.includes('1') : deletedQuery === '1';

		if (!wasDeleted) {
			return;
		}

		successMessage.value = 'Board deleted.';

		const nextQuery = { ...route.query };
		delete nextQuery.deleted;

		await navigateTo({
			path: route.path,
			query: nextQuery,
		}, { replace: true });
	},
	{ immediate: true }
);

const handleCreateBoard = async () => {
	createError.value = '';

	if (!newBoardTitle.value.trim()) {
		createError.value = 'Give your board a title before creating it.';
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
		isCreateModalOpen.value = false;

		await navigateTo(`/boards/${board.id}`);
	} catch (error) {
		createError.value = error instanceof Error ? error.message : 'Unable to create your board right now.';
	} finally {
		isSubmitting.value = false;
	}
};

const openCreateBoardModal = () => {
	createError.value = '';
	isCreateModalOpen.value = true;
};

const closeCreateBoardModal = () => {
	if (isSubmitting.value) {
		return;
	}

	createError.value = '';
	isCreateModalOpen.value = false;
};

const handleDeleteBoard = async (board: Board) => {
	if (deletingBoardId.value) {
		return;
	}

	const confirmed = window.confirm(`Delete "${board.title}" permanently? This removes the board, its cards, links, and concepts.`);

	if (!confirmed) {
		return;
	}

	pageError.value = '';
	successMessage.value = '';
	deletingBoardId.value = board.id;

	try {
		await deleteBoard(board.id);
		boards.value = boards.value.filter((entry) => entry.id !== board.id);
		successMessage.value = `"${board.title}" was deleted.`;
	} catch (error) {
		pageError.value = error instanceof Error ? error.message : 'Unable to delete that board right now.';
	} finally {
		deletingBoardId.value = null;
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

		<section class="rounded-3xl bg-white/80 p-6 shadow-xl backdrop-blur-sm">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-2xl font-bold text-green-900">
						Your Boards
					</h2>
					<p class="mt-1 text-sm text-gray-600">
						Open a board to place cards, group concepts, and iterate on versions.
					</p>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					<button
						type="button"
						class="rounded-full bg-green-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
						:disabled="isLoading || loadingBoards || Boolean(deletingBoardId)"
						@click="openCreateBoardModal"
					>
						Create board
					</button>

					<button
						type="button"
						class="rounded-full border border-green-700/20 px-4 py-2 text-sm font-semibold text-green-900 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
						:disabled="loadingBoards || Boolean(deletingBoardId)"
						@click="loadBoards"
					>
						Refresh
					</button>
				</div>
			</div>

			<p v-if="successMessage" class="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
				{{ successMessage }}
			</p>

			<p v-if="pageError" class="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
				{{ pageError }}
			</p>

			<div v-if="isLoading || loadingBoards" class="mt-6 rounded-2xl border border-dashed border-green-200 bg-green-50/60 px-5 py-8 text-center text-sm text-green-900/80">
				Loading your boards...
			</div>

			<div v-else-if="boards.length" class="mt-6 grid gap-4 md:grid-cols-2">
				<article
					v-for="board in boards"
					:key="board.id"
					class="group rounded-3xl border border-green-900/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
				>
					<div>
						<div class="flex items-start justify-between gap-3">
							<NuxtLink :to="`/boards/${board.id}`" class="min-w-0 flex-1">
								<div class="flex items-start justify-between gap-3">
									<div class="min-w-0">
										<h3 class="text-xl font-semibold text-green-900 transition group-hover:text-green-700">
											{{ board.title }}
										</h3>
										<p class="mt-2 text-sm text-gray-600">
											{{ board.description || 'No description yet. Open the board and start placing ideas.' }}
										</p>
									</div>
									<span class="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">
										Board
									</span>
								</div>
							</NuxtLink>

							<button
								type="button"
								class="shrink-0 rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
								:disabled="Boolean(deletingBoardId)"
								@click="handleDeleteBoard(board)"
							>
								{{ deletingBoardId === board.id ? 'Deleting...' : 'Delete' }}
							</button>
						</div>
					</div>
				</article>
			</div>

			<div v-else class="mt-6 rounded-3xl border border-dashed border-green-200 bg-green-50/70 px-6 py-12 text-center">
				<h3 class="text-xl font-semibold text-green-900">
					Your first concept board starts here
				</h3>
				<p class="mt-2 text-sm text-gray-700">
					Create a board for wedding cakes, tart experiments, seasonal boxes, or any other creative thread you want to keep together.
				</p>
				<button
					type="button"
					class="mt-6 rounded-full bg-green-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
					:disabled="isLoading || loadingBoards || Boolean(deletingBoardId)"
					@click="openCreateBoardModal"
				>
					Create your first board
				</button>
			</div>
		</section>

		<BoardCreateModal
			v-model:board-title="newBoardTitle"
			v-model:board-description="newBoardDescription"
			:error-message="createError"
			:is-open="isCreateModalOpen"
			:is-submitting="isSubmitting"
			@close="closeCreateBoardModal"
			@submit="handleCreateBoard"
		/>
	</div>
</template>
