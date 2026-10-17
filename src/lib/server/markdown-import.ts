import { parse } from 'yaml';
import type { RawInput } from './entry-input.ts';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)([\s\S]*)$/;
const H1_RE = /^#[ \t]+(.+?)[ \t]*#*[ \t]*(?:\r?\n|$)/;

/**
 * Reads an entry from a Markdown file: YAML frontmatter holds the fields, the rest is the body.
 * If the frontmatter has no `title`, a leading `# Heading` is used as the title and removed from the body.
 */
export function parseMarkdownEntry(
	source: string
): { ok: true; data: RawInput } | { ok: false; error: string } {
	const content = source.replace(/^\uFEFF/, '');
	const match = FRONTMATTER_RE.exec(content);

	let data: RawInput = {};
	let body = content;

	if (match) {
		try {
			const parsed: unknown = parse(match[1]);
			if (parsed != null && (typeof parsed !== 'object' || Array.isArray(parsed))) {
				return { ok: false, error: 'El frontmatter debe ser una lista de campos clave: valor.' };
			}
			data = (parsed as RawInput | null) ?? {};
		} catch (err) {
			return {
				ok: false,
				error: `El frontmatter no es YAML válido: ${err instanceof Error ? err.message : err}`
			};
		}
		body = match[2];
	}

	body = body.replace(/^\s*\n/, '');

	if (data.title == null) {
		const heading = H1_RE.exec(body);
		if (heading) {
			data.title = heading[1];
			body = body.slice(heading[0].length).replace(/^\s*\n/, '');
		}
	}

	return { ok: true, data: { ...data, body: body.trimEnd() } };
}
