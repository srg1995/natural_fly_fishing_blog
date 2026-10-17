// Shared description of the blog's entry model (mirrors supabase/migrations).
// The detail field specs drive the admin form, the server-side validation and the entry page.

export type FieldKind = 'text' | 'textarea' | 'date' | 'int' | 'list';

export interface DetailField {
	name: string;
	label: string;
	kind: FieldKind;
	required?: boolean;
	min?: number;
	placeholder?: string;
}

export const ENTRY_TYPES = {
	montaje_moscas: {
		label: 'Montaje de moscas',
		table: 'fly_tyings',
		fields: [
			{ name: 'fly_name', label: 'Nombre de la mosca', kind: 'text', required: true },
			{
				name: 'fly_pattern',
				label: 'Patrón',
				kind: 'text',
				placeholder: 'seca, ninfa, streamer…'
			},
			{ name: 'hook_size', label: 'Tamaño de anzuelo', kind: 'text', placeholder: '14' },
			{ name: 'target_species', label: 'Especie objetivo', kind: 'text' },
			{
				name: 'materials',
				label: 'Materiales',
				kind: 'list',
				placeholder: 'hilo 8/0, CDC, cobre'
			}
		]
	},
	entrenamiento: {
		label: 'Entrenamiento',
		table: 'training_sessions',
		fields: [
			{ name: 'session_date', label: 'Fecha', kind: 'date', required: true },
			{ name: 'location', label: 'Lugar', kind: 'text' },
			{ name: 'duration_minutes', label: 'Duración (minutos)', kind: 'int', min: 1 },
			{
				name: 'focus',
				label: 'Enfoque',
				kind: 'text',
				placeholder: 'lanzado, lectura de agua, nudos…'
			}
		]
	},
	campeonato: {
		label: 'Campeonato',
		table: 'championships',
		fields: [
			{ name: 'competition_name', label: 'Competición', kind: 'text', required: true },
			{ name: 'event_date', label: 'Fecha', kind: 'date', required: true },
			{ name: 'location', label: 'Lugar', kind: 'text' },
			{ name: 'position', label: 'Puesto', kind: 'int', min: 1 },
			{ name: 'participants', label: 'Participantes', kind: 'int', min: 1 },
			{ name: 'notes', label: 'Notas', kind: 'textarea' }
		]
	},
	pesca_libre: {
		label: 'Pesca libre',
		table: 'free_fishing_days',
		fields: [
			{ name: 'fishing_date', label: 'Fecha', kind: 'date', required: true },
			{ name: 'location', label: 'Lugar', kind: 'text' },
			{ name: 'water_type', label: 'Tipo de agua', kind: 'text', placeholder: 'río, embalse…' },
			{ name: 'technique', label: 'Técnica', kind: 'text' },
			{ name: 'species', label: 'Especies', kind: 'list', placeholder: 'trucha común, barbo' },
			{ name: 'fish_count', label: 'Capturas', kind: 'int', min: 0 },
			{ name: 'weather', label: 'Tiempo', kind: 'text' }
		]
	}
} as const satisfies Record<
	string,
	{ label: string; table: string; fields: readonly DetailField[] }
>;

export type EntryType = keyof typeof ENTRY_TYPES;
export type DetailTable = (typeof ENTRY_TYPES)[EntryType]['table'];

export const ENTRY_TYPE_KEYS = Object.keys(ENTRY_TYPES) as EntryType[];

export const ENTRY_STATUSES = { draft: 'Borrador', published: 'Publicada' } as const;
export type EntryStatus = keyof typeof ENTRY_STATUSES;

// Only meaningful once published: public entries are readable without signing in.
export const ENTRY_VISIBILITIES = { public: 'Pública', private: 'Privada' } as const;
export type EntryVisibility = keyof typeof ENTRY_VISIBILITIES;

export type UserRole = 'reader' | 'superadmin';

export function isEntryType(value: unknown): value is EntryType {
	return typeof value === 'string' && value in ENTRY_TYPES;
}

export interface Entry {
	id: string;
	type: EntryType;
	slug: string;
	title: string;
	excerpt: string | null;
	body: string | null;
	status: EntryStatus;
	visibility: EntryVisibility;
	published_at: string | null;
	created_at: string;
	updated_at: string;
}

export type DetailRow = Record<string, string | number | string[] | null>;

// Detail tables are 1:1 with entries, so PostgREST embeds them as an object (or null).
export type EntryWithDetails = Entry & { [T in DetailTable]?: DetailRow | null };
