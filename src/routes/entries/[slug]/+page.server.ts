import { error } from '@sveltejs/kit';
import type { Entry } from '#lib/types.ts';

export const load = async ({ params, locals }) => {
	const { data: entry, error: err } = await locals.supabase
		.from('entries')
		.select('*, fly_tyings(*)')
		.eq('slug', params.slug)
		.maybeSingle();

	if (err) error(500, err.message);
	if (!entry) error(404, 'Entrada no encontrada');

	return { entry: entry as Entry };
};
