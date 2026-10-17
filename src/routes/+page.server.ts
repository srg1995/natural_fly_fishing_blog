import { error } from '@sveltejs/kit';
import type { Entry } from '#lib/entries.ts';
import { signImagePaths } from '#lib/server/images.ts';

type ListedEntry = Pick<
	Entry,
	'id' | 'slug' | 'title' | 'type' | 'visibility' | 'excerpt' | 'published_at' | 'created_at'
> & { entry_images: { path: string }[] };

export const load = async ({ locals }) => {
	// Drafts live in /admin; the home page only lists published entries, even for superadmins.
	// RLS narrows it further: anonymous visitors only get the public ones.
	const { data: entries, error: err } = await locals.supabase
		.from('entries')
		.select(
			'id, slug, title, type, visibility, excerpt, published_at, created_at, entry_images(path)'
		)
		.eq('status', 'published')
		.order('published_at', { ascending: false })
		// Only the cover (lowest position) of each entry
		.order('position', { referencedTable: 'entry_images' })
		.limit(1, { referencedTable: 'entry_images' })
		.overrideTypes<ListedEntry[], { merge: false }>();

	if (err) error(500, err.message);

	const urls = await signImagePaths(
		locals.supabase,
		entries.flatMap((entry) => entry.entry_images.map((image) => image.path))
	);

	return {
		entries: entries.map(({ entry_images, ...entry }) => ({
			...entry,
			coverUrl: entry_images[0] ? (urls[entry_images[0].path] ?? null) : null
		}))
	};
};
