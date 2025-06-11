import { ref } from 'vue';
import { createClient } from '@supabase/supabase-js';

export function useComments(postId: string) {
	const config = useRuntimeConfig();

	const supabase = createClient(config.public.supabaseUrl, config.public.supabaseAnonKey);

	const comments = ref<any[]>([]);
	const loading = ref(false);
	const error = ref<null | string>(null);

	async function fetchComments() {
		loading.value = true;
		error.value = null;

		try {
			const { data, error: fetchError } = await supabase.from('comments').select().eq('post_id', postId).order('created_at', { ascending: false });

			if (fetchError) throw fetchError;

			const flatComments = (data ?? []).filter((c) => c.text?.trim() || c.author_name?.trim());

            console.log('Fetched Comments:', flatComments);

			comments.value = nestComments(flatComments);

            console.log('Nested Comments:', comments.value);
		} catch (err: any) {
			error.value = err.message || 'Failed to fetch comments';
		} finally {
			loading.value = false;
		}
	}


    async function addComment(text: string, author_name: string, parentId: number | null = null) {
		error.value = null;
        console.log('Adding comment:', { text, author_name, postId, parentId });

		try {
			const { data, error: insertError } = await supabase
				.from('comments')
				.insert([{ text, author_name, post_id: postId, parent_id: parentId }])
				.select();

			if (insertError) throw insertError;

			// Optional: prepend new comment to the local list
			if (data && data.length > 0) {
				const newComment = { ...data[0], replies: [] };

				if (parentId === null) {
					// Top-level comment: add to root
					comments.value.unshift(newComment);
				} else {
					// Reply: find the parent and push into its replies
					insertReply(comments.value, parentId, newComment);
				}
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to add comment';
		}
	}

    function nestComments(flatComments: any[]) {
		const map: Record<number, any> = {};
		const roots: any[] = [];

		// Initialize and create a map
		for (const comment of flatComments) {
			comment.replies = [];
			map[comment.id] = comment;
		}

		// Build tree
		for (const comment of flatComments) {
			if (comment.parent_id) {
				const parent = map[comment.parent_id];
				if (parent) {
					parent.replies.push(comment);
				}
			} else {
				roots.push(comment);
			}
		}

		return roots;
	}

    function insertReply(commentTree: any[], parentId: number, newReply: any): boolean {
		for (const comment of commentTree) {
			if (comment.id === parentId) {
				comment.replies.unshift(newReply);
				return true;
			}

			// Recurse through children if they exist
			if (comment.replies?.length) {
				const inserted = insertReply(comment.replies, parentId, newReply);
				if (inserted) return true;
			}
		}

		return false; // Not found
	}

	return {
		comments,
		loading,
		error,
		fetchComments,
        addComment
	};
}
