<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import BoardIdeaEditorForm from '~/components/boards/BoardIdeaEditorForm.vue';
import BoardIdeaImage from '~/components/boards/BoardIdeaImage.vue';
import type { Concept, Idea, IdeaMediaSource, IdeaType } from '~/types/board';
import {
	BOARD_RELATION_KIND_OPTIONS,
	CARD_BACKGROUND_OPTIONS,
	IDEA_TYPE_OPTIONS,
	formatIdeaTypeLabel,
	getPromotedConceptMemberCount,
	getPromotedConceptMemberTitles,
	isPromotedConceptIdea,
} from '~/utils/board';

const props = defineProps<{
	allTags: string[];
	canRemoveImage: boolean;
	conceptBusyId: string | null;
	conceptItemCounts: Record<string, number>;
	editingIdeaId: string | null;
	filteredIdeas: Idea[];
	imageError: string;
	imageFileName: string;
	isOpen: boolean;
	isSavingIdea: boolean;
	mediaPreviewIdea: IdeaMediaSource | null;
	relationSummary: string;
	selectedCardTone: (typeof CARD_BACKGROUND_OPTIONS)[number]['value'];
	selectedItemCount: number;
	selectedRelationId: string | null;
	selectionConceptId: string | null;
	visibleConcepts: Concept[];
}>();

const emit = defineEmits<{
	'create-concept': [];
	'delete-idea': [idea: Idea];
	'delete-selected-relation': [];
	'delete-selection': [];
	'duplicate-concept': [concept: Concept];
	'edit-idea': [idea: Idea];
	'place-idea': [idea: Idea];
	'remove-image': [];
	'reset-idea-form': [];
	'save-idea': [];
	'save-selected-relation': [];
	'select-concept': [conceptId: string];
	'select-image-file': [file: File | null];
	'toggle-open': [];
	'ungroup-selection': [];
}>();

const ideaTitle = defineModel<string>('ideaTitle', { required: true });
const ideaType = defineModel<IdeaType>('ideaType', { required: true });
const ideaDescription = defineModel<string>('ideaDescription', { required: true });
const ideaImageMode = defineModel<'url' | 'upload'>('ideaImageMode', { required: true });
const ideaImageUrl = defineModel<string>('ideaImageUrl', { required: true });
const ideaReferenceUrl = defineModel<string>('ideaReferenceUrl', { required: true });
const ideaNotes = defineModel<string>('ideaNotes', { required: true });
const ideaTagsInput = defineModel<string>('ideaTagsInput', { required: true });
const libraryTypeFilter = defineModel<'all' | IdeaType>('libraryTypeFilter', { required: true });
const libraryTagFilter = defineModel<string>('libraryTagFilter', { required: true });
const conceptTitle = defineModel<string>('conceptTitle', { required: true });
const conceptNotes = defineModel<string>('conceptNotes', { required: true });
const relationLabel = defineModel<string>('relationLabel', { required: true });
const relationKind = defineModel<string>('relationKind', { required: true });
const activeSection = defineModel<'library' | 'selection' | 'links' | 'concepts'>('activeSection', { required: true });

const composerExpanded = ref(false);

const selectedToneLabel = computed(() =>
	CARD_BACKGROUND_OPTIONS.find((option) => option.value === props.selectedCardTone)?.label ?? 'Paper'
);

const workspaceTabs = computed(() => [
	{ id: 'library', label: 'Library', count: props.filteredIdeas.length },
	{ id: 'selection', label: 'Selection', count: props.selectedItemCount },
	{ id: 'links', label: 'Links', count: props.selectedRelationId ? 1 : 0 },
	{ id: 'concepts', label: 'Concepts', count: props.visibleConcepts.length },
]);

const activeSectionLabel = computed(() =>
	workspaceTabs.value.find((tab) => tab.id === activeSection.value)?.label ?? 'Studio'
);

const libraryFilterSummary = computed(() => {
	const typeLabel = libraryTypeFilter.value === 'all'
		? 'All types'
		: IDEA_TYPE_OPTIONS.find((option) => option.value === libraryTypeFilter.value)?.label ?? 'Filtered type';
	const tagLabel = libraryTagFilter.value || 'All tags';

	return `${typeLabel} · ${tagLabel}`;
});

const showComposer = computed(() => composerExpanded.value || Boolean(props.editingIdeaId));

const openComposer = () => {
	activeSection.value = 'library';
	composerExpanded.value = true;
};

watch(
	() => props.editingIdeaId,
	(editingIdeaId) => {
		if (editingIdeaId) {
			composerExpanded.value = true;
		}
	}
);
</script>

<template>
	<aside
		v-if="isOpen"
		class="board-studio-panel w-full overflow-hidden lg:w-[25rem] lg:min-w-[25rem]"
	>
		<div class="flex items-start justify-between gap-4 border-b border-[color:var(--board-outline)] px-5 py-5 sm:px-6">
			<div class="min-w-0">
				<p class="board-studio-kicker">
					Board Studio
				</p>
				<h2 class="board-studio-display mt-3 text-[1.9rem] leading-none text-[color:var(--board-ink)]">
					Creative workspace
				</h2>
			</div>

			<button
				type="button"
				class="board-studio-button board-studio-button-secondary shrink-0"
				aria-expanded="true"
				aria-label="Collapse board workspace"
				@click="emit('toggle-open')"
			>
				Hide
			</button>
		</div>

		<div class="border-b border-[color:var(--board-outline)] px-5 py-4 sm:px-6">
			<div class="grid grid-cols-2 gap-2">
				<button
					v-for="tab in workspaceTabs"
					:key="tab.id"
					type="button"
					class="board-studio-tab"
					:class="{ 'board-studio-tab-active': activeSection === tab.id }"
					@click="activeSection = tab.id"
				>
					<span>{{ tab.label }}</span>
					<span class="board-studio-pill">
						{{ tab.count }}
					</span>
				</button>
			</div>
		</div>

		<div class="px-5 py-5 sm:px-6">
			<div class="board-studio-card board-studio-card-soft flex flex-wrap items-center gap-3 px-4 py-4">
				<div>
					<p class="board-studio-kicker">
						Active view
					</p>
					<p class="mt-2 text-base font-semibold text-[color:var(--board-ink)]">
						{{ activeSectionLabel }}
					</p>
				</div>
				<div class="flex flex-wrap gap-2 sm:ml-auto">
					<span class="board-studio-pill">
						{{ selectedItemCount }} selected
					</span>
					<span class="board-studio-pill">
						{{ selectedRelationId ? '1 link active' : 'No link active' }}
					</span>
				</div>
			</div>

			<Transition name="board-section-fade" mode="out-in">
				<section v-if="activeSection === 'library'" key="library" class="mt-5 space-y-4">
					<div class="flex flex-wrap items-start justify-between gap-3">
						<div>
							<p class="board-studio-kicker">
								Idea Library
							</p>
							<h3 class="board-studio-display mt-3 text-[1.7rem] leading-none text-[color:var(--board-ink)]">
								Reusable pieces
							</h3>
							<p class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]">
								Build and curate the ingredients of a concept before you place them on the board.
							</p>
						</div>

						<div class="flex flex-wrap gap-2">
							<button
								type="button"
								class="board-studio-button board-studio-button-secondary"
								@click="openComposer"
							>
								{{ editingIdeaId ? 'Continue editing' : 'New idea' }}
							</button>
							<button
								v-if="showComposer"
								type="button"
								class="board-studio-button board-studio-button-ghost"
								@click="composerExpanded = false"
							>
								Collapse form
							</button>
						</div>
					</div>

					<div class="board-studio-card board-studio-card-soft px-4 py-4">
						<div class="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p class="board-studio-kicker">
									Current filters
								</p>
								<p class="mt-2 text-sm font-medium text-[color:var(--board-ink)]">
									{{ libraryFilterSummary }}
								</p>
							</div>
							<span class="board-studio-pill">
								{{ filteredIdeas.length }} visible
							</span>
						</div>

						<div class="mt-4 grid gap-3 sm:grid-cols-2">
							<div>
								<label for="library-type-filter" class="board-studio-label">
									Type
								</label>
								<select
									id="library-type-filter"
									v-model="libraryTypeFilter"
									class="board-studio-input"
								>
									<option value="all">
										All types
									</option>
									<option v-for="option in IDEA_TYPE_OPTIONS" :key="option.value" :value="option.value">
										{{ option.label }}
									</option>
								</select>
							</div>

							<div>
								<label for="library-tag-filter" class="board-studio-label">
									Tag
								</label>
								<select
									id="library-tag-filter"
									v-model="libraryTagFilter"
									class="board-studio-input"
								>
									<option value="">
										All tags
									</option>
									<option v-for="tag in allTags" :key="tag" :value="tag">
										{{ tag }}
									</option>
								</select>
							</div>
						</div>
					</div>

					<div v-if="showComposer" class="board-studio-card px-4 py-4">
						<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
							<div>
								<p class="board-studio-kicker">
									{{ editingIdeaId ? 'Editing idea' : 'New idea composer' }}
								</p>
								<p class="mt-2 text-base font-semibold text-[color:var(--board-ink)]">
									{{ editingIdeaId ? 'Refine an existing reusable piece.' : 'Capture a new reusable idea for future boards.' }}
								</p>
							</div>

							<button
								v-if="editingIdeaId"
								type="button"
								class="board-studio-button board-studio-button-secondary"
								@click="emit('reset-idea-form')"
							>
								Start fresh
							</button>
						</div>

						<BoardIdeaEditorForm
							v-model:idea-title="ideaTitle"
							v-model:idea-type="ideaType"
							v-model:idea-description="ideaDescription"
							v-model:idea-image-mode="ideaImageMode"
							v-model:idea-image-url="ideaImageUrl"
							v-model:idea-reference-url="ideaReferenceUrl"
							v-model:idea-notes="ideaNotes"
							v-model:idea-tags-input="ideaTagsInput"
							:editing-idea-id="editingIdeaId"
							id-prefix="workspace-library"
							:can-remove-image="canRemoveImage"
							:image-error="imageError"
							:image-file-name="imageFileName"
							:is-saving-idea="isSavingIdea"
							:media-preview-idea="mediaPreviewIdea"
							@remove-image="emit('remove-image')"
							@save-idea="emit('save-idea')"
							@select-image-file="emit('select-image-file', $event)"
						/>
					</div>

					<div class="space-y-4">
						<article
							v-for="idea in filteredIdeas"
							:key="idea.id"
							class="board-studio-card px-4 py-4"
						>
							<div class="flex items-start justify-between gap-3">
								<div class="min-w-0">
									<p class="board-studio-kicker">
										{{ formatIdeaTypeLabel(idea.type) }}
									</p>
									<h4 class="mt-2 text-lg font-semibold text-[color:var(--board-ink)]">
										{{ idea.title }}
									</h4>
								</div>

								<button
									type="button"
									class="board-studio-button board-studio-button-primary shrink-0"
									@click="emit('place-idea', idea)"
								>
									Place
								</button>
							</div>

							<BoardIdeaImage
								:idea="idea"
								:alt="idea.title"
								wrapper-class="mt-4 overflow-hidden rounded-[1.35rem] border border-[color:var(--board-outline)] bg-white/70 p-2"
								image-class="h-[220px] w-full rounded-[1rem] object-cover"
							/>

							<p v-if="idea.description" class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]">
								{{ idea.description }}
							</p>

							<div
								v-if="isPromotedConceptIdea(idea) && getPromotedConceptMemberCount(idea)"
								class="mt-3 rounded-[1.35rem] border border-[color:var(--board-outline)] bg-white/65 px-3 py-3"
							>
								<p class="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--board-muted)]">
									{{ getPromotedConceptMemberCount(idea) }} linked member{{ getPromotedConceptMemberCount(idea) === 1 ? '' : 's' }}
								</p>
								<p
									v-if="getPromotedConceptMemberTitles(idea).length"
									class="mt-2 text-sm leading-6 text-[color:var(--board-ink)]"
								>
									{{ getPromotedConceptMemberTitles(idea).slice(0, 3).join(' · ') }}
								</p>
							</div>

							<div v-if="idea.tags.length" class="mt-4 flex flex-wrap gap-2">
								<span
									v-for="tag in idea.tags"
									:key="tag"
									class="board-studio-pill"
								>
									{{ tag }}
								</span>
							</div>

							<div class="mt-4 flex flex-wrap gap-2">
								<a
									v-if="idea.reference_url"
									:href="idea.reference_url"
									target="_blank"
									rel="noopener noreferrer"
									class="board-studio-button board-studio-button-ghost"
								>
									Open link
								</a>
								<button
									type="button"
									class="board-studio-button board-studio-button-secondary"
									@click="emit('edit-idea', idea)"
								>
									Edit
								</button>
								<button
									type="button"
									class="board-studio-button board-studio-button-danger"
									@click="emit('delete-idea', idea)"
								>
									Delete
								</button>
							</div>
						</article>

						<div v-if="!filteredIdeas.length" class="board-studio-empty">
							No ideas match the current filters yet.
						</div>
					</div>
				</section>

				<section v-else-if="activeSection === 'selection'" key="selection" class="mt-5 space-y-4">
					<div>
						<p class="board-studio-kicker">
							Selection
						</p>
						<h3 class="board-studio-display mt-3 text-[1.7rem] leading-none text-[color:var(--board-ink)]">
							Selected cards
						</h3>
						<p class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]">
							{{ selectedItemCount ? 'Turn the current selection into a saved concept or tidy it up before the next iteration.' : 'Click a card to select it. Shift-click lets you build a multi-selection.' }}
						</p>
					</div>

					<div v-if="selectedItemCount" class="board-studio-card px-4 py-4">
						<div class="flex flex-wrap items-center gap-2">
							<span class="board-studio-pill">
								{{ selectedItemCount }} card{{ selectedItemCount === 1 ? '' : 's' }}
							</span>
							<span class="board-studio-pill">
								Tone: {{ selectedToneLabel }}
							</span>
							<span v-if="selectionConceptId" class="board-studio-pill">
								Grouped concept
							</span>
						</div>

						<div class="mt-4 space-y-4">
							<div>
								<label for="concept-title" class="board-studio-label">
									Concept title
								</label>
								<input
									id="concept-title"
									v-model="conceptTitle"
									type="text"
									maxlength="120"
									class="board-studio-input"
									placeholder="Wedding cake v1"
								/>
							</div>

							<div>
								<label for="concept-notes" class="board-studio-label">
									Concept notes
								</label>
								<textarea
									id="concept-notes"
									v-model="conceptNotes"
									rows="4"
									class="board-studio-input min-h-28"
									placeholder="What ties these cards together?"
								/>
							</div>
						</div>

						<p class="mt-4 text-xs leading-5 text-[color:var(--board-muted)]">
							Card styling is still stored on each board card, so this section keeps the tone readable but does not edit it yet.
						</p>

						<div class="mt-5 grid gap-2">
							<button
								type="button"
								class="board-studio-button board-studio-button-primary w-full justify-center"
								@click="emit('create-concept')"
							>
								Create concept from selection
							</button>
							<button
								type="button"
								class="board-studio-button board-studio-button-secondary w-full justify-center"
								:disabled="!selectionConceptId"
								@click="emit('ungroup-selection')"
							>
								Ungroup selected cards
							</button>
							<button
								type="button"
								class="board-studio-button board-studio-button-danger w-full justify-center"
								@click="emit('delete-selection')"
							>
								Delete selected cards
							</button>
						</div>
					</div>

					<div v-else class="board-studio-empty">
						Nothing is selected on the canvas yet.
					</div>
				</section>

				<section v-else-if="activeSection === 'links'" key="links" class="mt-5 space-y-4">
					<div>
						<p class="board-studio-kicker">
							Links
						</p>
						<h3 class="board-studio-display mt-3 text-[1.7rem] leading-none text-[color:var(--board-ink)]">
							Board relations
						</h3>
						<p class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]">
							{{ selectedRelationId ? 'Refine the meaning of the active relationship without leaving the workspace rail.' : 'Drag from one card handle to another on the canvas, then select the relation to label or remove it here.' }}
						</p>
					</div>

					<div v-if="selectedRelationId" class="board-studio-card px-4 py-4">
						<div class="flex flex-wrap items-center gap-2">
							<span class="board-studio-pill">
								Active relation
							</span>
							<span class="text-sm font-medium text-[color:var(--board-ink)]">
								{{ relationSummary }}
							</span>
						</div>

						<div class="mt-4 space-y-4">
							<div>
								<label for="relation-kind" class="board-studio-label">
									Relation kind
								</label>
								<select
									id="relation-kind"
									v-model="relationKind"
									class="board-studio-input"
								>
									<option v-for="option in BOARD_RELATION_KIND_OPTIONS" :key="option.value" :value="option.value">
										{{ option.label }}
									</option>
								</select>
							</div>

							<div>
								<label for="relation-label" class="board-studio-label">
									Label
								</label>
								<input
									id="relation-label"
									v-model="relationLabel"
									type="text"
									maxlength="120"
									class="board-studio-input"
									placeholder="Optional edge label"
								/>
							</div>
						</div>

						<div class="mt-5 grid gap-2">
							<button
								type="button"
								class="board-studio-button board-studio-button-primary w-full justify-center"
								@click="emit('save-selected-relation')"
							>
								Save relation
							</button>
							<button
								type="button"
								class="board-studio-button board-studio-button-danger w-full justify-center"
								@click="emit('delete-selected-relation')"
							>
								Delete relation
							</button>
						</div>
					</div>

					<div v-else class="board-studio-empty">
						No relation is active right now.
					</div>
				</section>

				<section v-else key="concepts" class="mt-5 space-y-4">
					<div class="flex items-end justify-between gap-3">
						<div>
							<p class="board-studio-kicker">
								Concepts
							</p>
							<h3 class="board-studio-display mt-3 text-[1.7rem] leading-none text-[color:var(--board-ink)]">
								Saved versions
							</h3>
							<p class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]">
								Use versions like editorial drafts: select a concept to inspect it or duplicate it into the next round.
							</p>
						</div>

						<span class="board-studio-pill">
							{{ visibleConcepts.length }} saved
						</span>
					</div>

					<div v-if="visibleConcepts.length" class="board-studio-timeline space-y-4">
						<article
							v-for="concept in visibleConcepts"
							:key="concept.id"
							class="board-studio-card board-studio-timeline-card px-4 py-4"
						>
							<div class="flex items-start justify-between gap-3">
								<div>
									<p class="board-studio-kicker">
										Version {{ concept.version }}
									</p>
									<h4 class="mt-2 text-lg font-semibold text-[color:var(--board-ink)]">
										{{ concept.title }}
									</h4>
									<p class="mt-2 text-sm text-[color:var(--board-muted)]">
										{{ conceptItemCounts[concept.id] || 0 }} cards
									</p>
								</div>

								<button
									type="button"
									class="board-studio-button board-studio-button-secondary shrink-0"
									@click="emit('select-concept', concept.id)"
								>
									Select
								</button>
							</div>

							<p v-if="concept.notes" class="mt-3 text-sm leading-6 text-[color:var(--board-muted)]">
								{{ concept.notes }}
							</p>

							<button
								type="button"
								class="board-studio-button board-studio-button-primary mt-4 w-full justify-center"
								:disabled="conceptBusyId === concept.id"
								@click="emit('duplicate-concept', concept)"
							>
								{{ conceptBusyId === concept.id ? 'Duplicating...' : 'Duplicate as next version' }}
							</button>
						</article>
					</div>

					<div v-else class="board-studio-empty">
						No concepts yet. Select cards on the canvas and turn them into a saved version here.
					</div>
				</section>
			</Transition>
		</div>
	</aside>

	<button
		v-else
		type="button"
		class="board-studio-panel board-studio-panel-collapsed flex w-full items-center justify-between gap-3 px-4 py-4 lg:min-h-[32rem] lg:w-[5.5rem] lg:min-w-[5.5rem] lg:flex-col lg:justify-start"
		aria-label="Expand board workspace"
		@click="emit('toggle-open')"
	>
		<span class="board-studio-kicker lg:[writing-mode:vertical-rl]">
			Board Studio
		</span>
		<span class="board-studio-display text-lg text-[color:var(--board-ink)] lg:text-center">
			{{ activeSectionLabel }}
		</span>
		<span class="board-studio-pill">
			Open
		</span>
	</button>
</template>
