import { describe, expect, it } from 'vitest';
import { parseYouTubeId } from './youtube.ts';

describe('parseYouTubeId', () => {
	it.each([
		'dQw4w9WgXcQ',
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ&t=42s',
		'youtube.com/watch?v=dQw4w9WgXcQ',
		'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
		'https://youtu.be/dQw4w9WgXcQ?si=abc',
		'https://www.youtube.com/shorts/dQw4w9WgXcQ',
		'https://www.youtube.com/embed/dQw4w9WgXcQ',
		'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
		'https://www.youtube.com/live/dQw4w9WgXcQ',
		'  https://youtu.be/dQw4w9WgXcQ  '
	])('reads %s', (value) => {
		expect(parseYouTubeId(value)).toBe('dQw4w9WgXcQ');
	});

	it.each([
		'',
		'no es un enlace',
		'https://vimeo.com/123456789',
		'https://www.youtube.com/watch?v=corto',
		'https://www.youtube.com/@canal',
		'https://evil.com/watch?v=dQw4w9WgXcQ',
		'https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ'
	])('rejects %s', (value) => {
		expect(parseYouTubeId(value)).toBeNull();
	});
});
