import type { SupabaseClient } from '@supabase/supabase-js';
import { IMAGES_BUCKET } from '#lib/images.ts';

// The bucket is private, so every image is served through a short-lived signed URL.
// Signing goes through Storage RLS: a visitor only gets URLs for photos of entries they can see.
const SIGNED_URL_SECONDS = 60 * 60;

export async function signImagePaths(
	supabase: SupabaseClient,
	paths: string[]
): Promise<Record<string, string>> {
	if (paths.length === 0) return {};

	const { data, error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.createSignedUrls(paths, SIGNED_URL_SECONDS);

	if (error) {
		console.error('[images] signing failed', error.message);
		return {};
	}

	const urls: Record<string, string> = {};
	for (const item of data) {
		if (item.path && item.signedUrl) urls[item.path] = item.signedUrl;
	}
	return urls;
}
