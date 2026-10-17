import { error } from '@sveltejs/kit';
import type { Entry } from '#lib/types.ts';

export const load = async ({ locals }) => {
	const { data: entries, error: err } = await locals.supabase
		.from('entries')
		.select('*')
		.order('created_at', { ascending: false });

	if (err) error(500, err.message);

	return { entries: entries as Omit<Entry, 'fly_tyings'>[] };
};
