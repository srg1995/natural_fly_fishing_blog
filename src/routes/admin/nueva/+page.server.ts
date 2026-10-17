import { fail, type Actions } from '@sveltejs/kit';
import { parseEntryInput, toFormValues } from '#lib/server/entry-input.ts';
import { parseMarkdownEntry } from '#lib/server/markdown-import.ts';

const MAX_FILE_BYTES = 1024 * 1024;

export const actions = {
	// Parses an uploaded .md file and sends its fields back to prefill the form for review; nothing is saved yet.
	importar: async ({ request }) => {
		const form = await request.formData();
		const file = form.get('file');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { mode: 'archivo' as const, importError: 'Selecciona un archivo .md.' });
		}
		if (file.size > MAX_FILE_BYTES) {
			return fail(400, { mode: 'archivo' as const, importError: 'El archivo supera 1 MB.' });
		}

		const result = parseMarkdownEntry(await file.text());
		if (!result.ok) return fail(400, { mode: 'archivo' as const, importError: result.error });

		const parsed = parseEntryInput(result.data);

		return {
			mode: 'formulario' as const,
			importedFrom: file.name,
			values: toFormValues(result.data),
			errors: parsed.ok ? {} : parsed.errors
		};
	},

	crear: async ({ request, locals }) => {
		const raw = Object.fromEntries(await request.formData());
		const values = toFormValues(raw);
		const parsed = parseEntryInput(raw);

		if (!parsed.ok) {
			return fail(400, { mode: 'formulario' as const, values, errors: parsed.errors });
		}

		const { entry, detailTable, detail } = parsed.value;

		const { data: created, error: entryError } = await locals.supabase
			.from('entries')
			.insert(entry)
			.select('id, slug')
			.single();

		if (entryError) {
			if (entryError.code === '23505') {
				return fail(400, {
					mode: 'formulario' as const,
					values,
					errors: { slug: 'Ya existe una entrada con este slug' }
				});
			}
			return fail(500, { mode: 'formulario' as const, values, message: entryError.message });
		}

		const { error: detailError } = await locals.supabase
			.from(detailTable)
			.insert({ entry_id: created.id, ...detail });

		if (detailError) {
			// No transaction across two PostgREST calls: undo the entry so it isn't left without details.
			await locals.supabase.from('entries').delete().eq('id', created.id);
			return fail(500, { mode: 'formulario' as const, values, message: detailError.message });
		}

		// No redirect: the page uploads the photos for this entry from the browser, then navigates to it.
		return {
			mode: 'formulario' as const,
			created: { id: created.id as string, slug: created.slug as string }
		};
	}
} satisfies Actions;
