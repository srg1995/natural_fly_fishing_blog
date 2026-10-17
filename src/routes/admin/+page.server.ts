import { error, type Actions } from '@sveltejs/kit';
import type { Entry } from '#lib/entries.ts';
import { changeEntryPublication } from '#lib/server/entry-status.ts';

export const load = async ({ locals }) => {
	// Superadmins see drafts too (RLS: es_admin()).
	const { data: entries, error: err } = await locals.supabase
		.from('entries')
		.select('id, slug, title, type, status, visibility, published_at, created_at')
		.order('created_at', { ascending: false });

	if (err) error(500, err.message);

	return {
		entries: entries as Pick<
			Entry,
			'id' | 'slug' | 'title' | 'type' | 'status' | 'visibility' | 'published_at' | 'created_at'
		>[]
	};
};

export const actions = {
	cambiarPublicacion: changeEntryPublication
} satisfies Actions;
