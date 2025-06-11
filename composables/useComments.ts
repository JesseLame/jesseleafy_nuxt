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
			comments.value = data ?? [];
		} catch (err: any) {
			error.value = err.message || 'Failed to fetch comments';
		} finally {
			loading.value = false;
		}
	}

    async function addComment(text: string, author_name: string) {
		error.value = null;
        console.log('Adding comment:', { text, author_name, postId });
		try {
			const { data, error: insertError } = await supabase
				.from('comments')
				.insert([{ text, author_name, post_id: postId }])
				.select();

			if (insertError) throw insertError;

			// Optional: prepend new comment to the local list
			if (data && data.length > 0) {
				comments.value.unshift(data[0]);
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to add comment';
		}
	}

	return {
		comments,
		loading,
		error,
		fetchComments,
        addComment
	};
}
