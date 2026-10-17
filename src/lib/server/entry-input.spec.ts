import { describe, expect, it } from 'vitest';
import { parseEntryInput, slugify, toFormValues } from './entry-input.ts';

describe('slugify', () => {
	it('strips accents and punctuation', () => {
		expect(slugify('  Pardón en CDC: ¡mayo!  ')).toBe('pardon-en-cdc-mayo');
	});
});

describe('parseEntryInput', () => {
	const flyTying = {
		type: 'montaje_moscas',
		title: 'Pardón en CDC',
		fly_name: 'Pardón CDC',
		hook_size: 16,
		materials: 'hilo 8/0,  CDC , '
	};

	it('builds the entry and its detail row', () => {
		const result = parseEntryInput({ ...flyTying, body: '# Hola\n' });
		expect(result.ok).toBe(true);
		if (!result.ok) return;

		expect(result.value.entry).toMatchObject({
			type: 'montaje_moscas',
			slug: 'pardon-en-cdc',
			status: 'draft',
			visibility: 'private',
			published_at: null,
			body: '# Hola\n'
		});
		expect(result.value.detailTable).toBe('fly_tyings');
		expect(result.value.detail).toEqual({
			fly_name: 'Pardón CDC',
			fly_pattern: null,
			hook_size: '16',
			target_species: null,
			materials: ['hilo 8/0', 'CDC']
		});
	});

	it('sets published_at when publishing without a date', () => {
		const result = parseEntryInput({ ...flyTying, status: 'published' });
		expect(result.ok && result.value.entry.published_at).toBeTruthy();
	});

	it('reports missing and invalid fields', () => {
		const result = parseEntryInput({
			type: 'campeonato',
			title: '',
			event_date: '2026-13-45',
			position: '0',
			participants: 'muchos'
		});
		expect(result).toEqual({
			ok: false,
			errors: {
				title: 'Obligatorio',
				slug: expect.any(String),
				competition_name: 'Obligatorio',
				event_date: 'Fecha no válida (AAAA-MM-DD)',
				position: 'Debe ser 1 o más',
				participants: 'Debe ser un número entero'
			}
		});
	});

	it('rejects unknown types, statuses and visibilities', () => {
		const result = parseEntryInput({
			type: 'pesca_nocturna',
			title: 'x',
			status: 'archived',
			visibility: 'secreta'
		});
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(Object.keys(result.errors)).toEqual(['type', 'status', 'visibility']);
	});

	it('accepts public entries', () => {
		const result = parseEntryInput({ ...flyTying, status: 'published', visibility: 'public' });
		expect(result.ok && result.value.entry.visibility).toBe('public');
	});

	it('converts integers and keeps fish_count 0', () => {
		const result = parseEntryInput({
			type: 'pesca_libre',
			title: 'Tarde en el Tormes',
			fishing_date: '2026-05-01',
			fish_count: '0',
			species: ['trucha', 'barbo']
		});
		expect(result.ok && result.value.detail).toMatchObject({
			fishing_date: '2026-05-01',
			fish_count: 0,
			species: ['trucha', 'barbo']
		});
	});
});

describe('toFormValues', () => {
	it('flattens lists and dates into strings', () => {
		expect(
			toFormValues({ materials: ['a', 'b'], hook_size: 14, date: new Date('2026-05-12'), x: null })
		).toEqual({ materials: 'a, b', hook_size: '14', date: '2026-05-12' });
	});
});
