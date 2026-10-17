import { fail } from '@sveltejs/kit';
import {
	ENTRY_STATUSES,
	ENTRY_VISIBILITIES,
	type EntryStatus,
	type EntryVisibility
} from '#lib/entries.ts';

/**
 * Form action body shared by /admin and the entry page: changes an entry's status and/or visibility.
 * Expects `id` plus `status` and/or `visibility`. The first publication stamps published_at; later ones keep it.
 */
export async function changeEntryPublication({
	request,
	locals
}: {
	request: Request;
	locals: App.Locals;
}) {
	const form = await request.formData();
	const id = String(form.get('id') ?? '');
	const status = form.get('status');
	const visibility = form.get('visibility');

	// /admin is guarded in hooks, but this also runs from /entries/[slug], which anyone can reach.
	if (locals.role !== 'superadmin') {
		return fail(403, { id, message: 'No tienes permiso para cambiarla' });
	}

	const changes: { status?: EntryStatus; visibility?: EntryVisibility; published_at?: string } = {};
	if (typeof status === 'string' && status in ENTRY_STATUSES) {
		changes.status = status as EntryStatus;
	}
	if (typeof visibility === 'string' && visibility in ENTRY_VISIBILITIES) {
		changes.visibility = visibility as EntryVisibility;
	}
	if (!id || Object.keys(changes).length === 0) {
		return fail(400, { id, message: 'Petición no válida' });
	}

	if (changes.status === 'published') {
		const { data: current, error: readError } = await locals.supabase
			.from('entries')
			.select('published_at')
			.eq('id', id)
			.maybeSingle();

		if (readError) return fail(500, { id, message: readError.message });
		if (!current) return fail(404, { id, message: 'La entrada no existe' });
		if (!current.published_at) changes.published_at = new Date().toISOString();
	}

	const { data: updated, error: updateError } = await locals.supabase
		.from('entries')
		.update(changes)
		.eq('id', id)
		.select('id');

	if (updateError) return fail(500, { id, message: updateError.message });
	// RLS silently filters the update to zero rows when the database doesn't see the user as superadmin.
	if (!updated?.length) return fail(403, { id, message: 'No tienes permiso para cambiarla' });

	return { id, message: null };
}
