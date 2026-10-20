import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import { marked } from 'marked';
import { ENTRY_TYPES, type EntryWithDetails } from '#lib/entries.ts';
import { IMAGES_BUCKET, type EntryImage } from '#lib/images.ts';
import { changeEntryPublication } from '#lib/server/entry-status.ts';
import { signImagePaths } from '#lib/server/images.ts';
import { parseYouTubeId } from '#lib/youtube.ts';

export const load = async ({ params, locals, url }) => {
	const { data: entry, error: err } = await locals.supabase
		.from('entries')
		.select(
			'*, fly_tyings(*), training_sessions(*), championships(*), free_fishing_days(*), entry_images(id, path, position)'
		)
		.eq('slug', params.slug)
		.order('position', { referencedTable: 'entry_images' })
		.maybeSingle<EntryWithDetails & { entry_images: EntryImage[] }>();

	if (err) error(500, err.message);
	// Private entries are invisible to anonymous visitors (RLS), so offer to sign in before a 404.
	// The visibility check is defense in depth in case a policy is misconfigured again.
	if (!locals.user && (!entry || entry.visibility !== 'public' || entry.status !== 'published')) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`);
	}
	if (!entry) error(404, 'Entrada no encontrada');

	const urls = await signImagePaths(
		locals.supabase,
		entry.entry_images.map((image) => image.path)
	);
	const images = entry.entry_images
		.filter((image) => urls[image.path])
		.map((image) => ({ ...image, url: urls[image.path] }));

	return {
		entry,
		images,
		nextImagePosition: Math.max(-1, ...entry.entry_images.map((image) => image.position)) + 1,
		detail: entry[ENTRY_TYPES[entry.type].table] ?? null,
		// Only superadmins can write entries (RLS), so the Markdown is trusted author content.
		html: entry.body ? await marked.parse(entry.body) : ''
	};
};

export const actions = {
	cambiarPublicacion: changeEntryPublication,

	// Sets, replaces or (with an empty field) removes the entry's YouTube video.
	guardarVideo: async ({ request, locals }) => {
		if (locals.role !== 'superadmin') return fail(403, { message: 'No tienes permiso' });

		const form = await request.formData();
		const id = String(form.get('entryId') ?? '');
		const video = String(form.get('video') ?? '').trim();
		const youtubeId = video ? parseYouTubeId(video) : null;
		if (video && !youtubeId) {
			return fail(400, { videoError: 'No es un enlace de YouTube válido', video });
		}

		const { data, error: updateError } = await locals.supabase
			.from('entries')
			.update({ youtube_id: youtubeId })
			.eq('id', id)
			.select('id');
		if (updateError) return fail(500, { videoError: updateError.message, video });
		// RLS blocks without an error: it just updates no rows.
		if (!data?.length) return fail(404, { videoError: 'No se pudo guardar el vídeo', video });

		return { message: null };
	},

	borrarFoto: async ({ request, locals }) => {
		if (locals.role !== 'superadmin') return fail(403, { message: 'No tienes permiso' });

		const id = String((await request.formData()).get('imageId') ?? '');
		const { data: image, error: readError } = await locals.supabase
			.from('entry_images')
			.select('path')
			.eq('id', id)
			.maybeSingle();

		if (readError) return fail(500, { message: readError.message });
		if (!image) return fail(404, { message: 'La foto no existe' });

		const { error: storageError } = await locals.supabase.storage
			.from(IMAGES_BUCKET)
			.remove([image.path]);
		if (storageError) return fail(500, { message: storageError.message });

		const { error: deleteError } = await locals.supabase.from('entry_images').delete().eq('id', id);
		if (deleteError) return fail(500, { message: deleteError.message });

		return { message: null };
	}
} satisfies Actions;
