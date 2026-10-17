import { describe, expect, it } from 'vitest';
import { parseMarkdownEntry } from './markdown-import.ts';

describe('parseMarkdownEntry', () => {
	it('reads frontmatter fields and the body', () => {
		const result = parseMarkdownEntry(
			'﻿---\ntype: montaje_moscas\ntitle: Pardón\npublished_at: 2026-05-12\nmaterials: [hilo, CDC]\n---\n\nTexto **en negrita**.\n'
		);
		expect(result).toEqual({
			ok: true,
			data: {
				type: 'montaje_moscas',
				title: 'Pardón',
				published_at: '2026-05-12',
				materials: ['hilo', 'CDC'],
				body: 'Texto **en negrita**.'
			}
		});
	});

	it('uses the first heading as title when there is none in the frontmatter', () => {
		const result = parseMarkdownEntry(
			'---\ntype: entrenamiento\n---\n# Lanzado en el río\n\nCuerpo'
		);
		expect(result).toEqual({
			ok: true,
			data: { type: 'entrenamiento', title: 'Lanzado en el río', body: 'Cuerpo' }
		});
	});

	it('accepts a file without frontmatter', () => {
		expect(parseMarkdownEntry('Solo texto')).toEqual({ ok: true, data: { body: 'Solo texto' } });
	});

	it('reports invalid YAML', () => {
		const result = parseMarkdownEntry('---\ntitle: [sin cerrar\n---\ncuerpo');
		expect(result.ok).toBe(false);
	});

	it('rejects frontmatter that is not a map', () => {
		expect(parseMarkdownEntry('---\n- a\n- b\n---\n').ok).toBe(false);
	});
});
