import type { SupabaseClient } from '@supabase/supabase-js';

export const IMAGES_BUCKET = 'entry-images';

// Photos are shrunk in the browser before upload: keeps Storage (1 GB on the free plan) and egress small.
const MAX_SIDE = 2000;
const JPEG_QUALITY = 0.82;

export interface EntryImage {
	id: string;
	path: string;
	position: number;
}

/** Resizes to at most MAX_SIDE px on the longest side and re-encodes as JPEG (also drops EXIF/GPS data). */
async function resizeImage(file: File): Promise<Blob> {
	const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
	const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));

	const canvas = document.createElement('canvas');
	canvas.width = Math.round(bitmap.width * scale);
	canvas.height = Math.round(bitmap.height * scale);
	canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
	bitmap.close();

	return new Promise((resolve, reject) =>
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('No se pudo convertir la imagen'))),
			'image/jpeg',
			JPEG_QUALITY
		)
	);
}

/**
 * Uploads photos for an entry straight to Storage and records them in entry_images, after `startPosition`.
 * Stops at the first failure and removes what it had already uploaded. RLS restricts all of it to superadmins.
 */
export async function uploadEntryImages(
	supabase: SupabaseClient,
	entryId: string,
	files: File[],
	startPosition: number,
	onProgress?: (done: number, total: number) => void
): Promise<{ error: string | null }> {
	const uploaded: string[] = [];

	const undo = async () => {
		if (uploaded.length) await supabase.storage.from(IMAGES_BUCKET).remove(uploaded);
	};

	for (const [i, file] of files.entries()) {
		onProgress?.(i, files.length);

		let blob: Blob;
		try {
			blob = await resizeImage(file);
		} catch {
			await undo();
			return {
				error: `No se pudo leer «${file.name}». Usa JPG, PNG o WebP (HEIC solo funciona en Safari).`
			};
		}

		const path = `${entryId}/${crypto.randomUUID()}.jpg`;
		const { error } = await supabase.storage
			.from(IMAGES_BUCKET)
			.upload(path, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });

		if (error) {
			await undo();
			return { error: `Error subiendo «${file.name}»: ${error.message}` };
		}
		uploaded.push(path);
	}

	const { error } = await supabase
		.from('entry_images')
		.insert(uploaded.map((path, i) => ({ entry_id: entryId, path, position: startPosition + i })));
	if (error) {
		await undo();
		return { error: `Error guardando las fotos: ${error.message}` };
	}

	onProgress?.(files.length, files.length);
	return { error: null };
}
