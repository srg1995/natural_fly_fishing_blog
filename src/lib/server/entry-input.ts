// Validation shared by the admin form and the Markdown import, so both paths accept exactly the same data.
import {
	ENTRY_STATUSES,
	ENTRY_TYPES,
	ENTRY_VISIBILITIES,
	isEntryType,
	type DetailField,
	type DetailRow,
	type DetailTable,
	type EntryStatus,
	type EntryType,
	type EntryVisibility
} from '#lib/entries.ts';
import { parseYouTubeId } from '#lib/youtube.ts';

export type RawInput = Record<string, unknown>;
export type FieldErrors = Record<string, string>;

export interface ParsedEntry {
	entry: {
		type: EntryType;
		slug: string;
		title: string;
		excerpt: string | null;
		body: string | null;
		youtube_id: string | null;
		status: EntryStatus;
		visibility: EntryVisibility;
		published_at: string | null;
	};
	detailTable: DetailTable;
	detail: DetailRow;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function slugify(value: string) {
	return value
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

function text(value: unknown): string | null {
	if (value == null) return null;
	if (value instanceof Date) return value.toISOString().slice(0, 10);
	const trimmed = String(value).trim();
	return trimmed === '' ? null : trimmed;
}

function list(value: unknown): string[] {
	const items = Array.isArray(value) ? value : (text(value)?.split(',') ?? []);
	return items.map(text).filter((item): item is string => item !== null);
}

function isValidDate(value: string) {
	return DATE_RE.test(value) && !Number.isNaN(new Date(value).getTime());
}

function parseDetailField(field: DetailField, raw: unknown, errors: FieldErrors) {
	if (field.kind === 'list') return list(raw);

	const value = text(raw);
	if (value === null) {
		if (field.required) errors[field.name] = 'Obligatorio';
		return null;
	}

	if (field.kind === 'date' && !isValidDate(value)) {
		errors[field.name] = 'Fecha no válida (AAAA-MM-DD)';
	}

	if (field.kind === 'int') {
		const number = Number(value);
		if (!Number.isInteger(number)) {
			errors[field.name] = 'Debe ser un número entero';
		} else if (field.min !== undefined && number < field.min) {
			errors[field.name] = `Debe ser ${field.min} o más`;
		} else {
			return number;
		}
	}

	return value;
}

export function parseEntryInput(
	raw: RawInput
): { ok: true; value: ParsedEntry } | { ok: false; errors: FieldErrors } {
	const errors: FieldErrors = {};

	const type = text(raw.type);
	if (!isEntryType(type)) errors.type = 'Elige un tipo de entrada';

	const title = text(raw.title);
	if (!title) errors.title = 'Obligatorio';

	const slug = text(raw.slug) ?? (title ? slugify(title) : null);
	if (!slug || !SLUG_RE.test(slug)) {
		errors.slug = 'Solo minúsculas, números y guiones (ej. mi-primera-salida)';
	}

	const status = text(raw.status) ?? 'draft';
	if (!(status in ENTRY_STATUSES)) errors.status = 'Debe ser draft o published';

	const visibility = text(raw.visibility) ?? 'private';
	if (!(visibility in ENTRY_VISIBILITIES)) errors.visibility = 'Debe ser public o private';

	let publishedAt = text(raw.published_at);
	if (publishedAt && !isValidDate(publishedAt.slice(0, 10))) {
		errors.published_at = 'Fecha no válida (AAAA-MM-DD)';
	}
	if (!publishedAt && status === 'published') publishedAt = new Date().toISOString();

	// Input key is `video` (any YouTube link); only the id is stored.
	const video = text(raw.video);
	const youtubeId = video ? parseYouTubeId(video) : null;
	if (video && !youtubeId) errors.video = 'No es un enlace de YouTube válido';

	const detail: DetailRow = {};
	if (isEntryType(type)) {
		for (const field of ENTRY_TYPES[type].fields) {
			detail[field.name] = parseDetailField(field, raw[field.name], errors);
		}
	}

	if (Object.keys(errors).length > 0 || !isEntryType(type)) return { ok: false, errors };

	return {
		ok: true,
		value: {
			entry: {
				type,
				slug: slug!,
				title: title!,
				excerpt: text(raw.excerpt),
				body: typeof raw.body === 'string' && raw.body.trim() ? raw.body : null,
				youtube_id: youtubeId,
				status: status as EntryStatus,
				visibility: visibility as EntryVisibility,
				published_at: publishedAt
			},
			detailTable: ENTRY_TYPES[type].table,
			detail
		}
	};
}

// Flattens raw input (FormData entries or Markdown frontmatter) into strings to refill the form.
export function toFormValues(raw: RawInput): Record<string, string> {
	const values: Record<string, string> = {};
	for (const [key, value] of Object.entries(raw)) {
		if (value == null || value instanceof File) continue;
		if (Array.isArray(value)) values[key] = list(value).join(', ');
		else if (value instanceof Date) values[key] = value.toISOString().slice(0, 10);
		else values[key] = String(value);
	}
	return values;
}
