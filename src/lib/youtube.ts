// Entries store only the YouTube video id; any common link format is accepted on input.

const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
	'youtube.com',
	'www.youtube.com',
	'm.youtube.com',
	'music.youtube.com',
	'youtube-nocookie.com',
	'www.youtube-nocookie.com'
]);
const ID_PATH_PREFIXES = new Set(['embed', 'shorts', 'live', 'v']);

/** Extracts the video id from a bare id or a youtube.com / youtu.be link. Returns null if it isn't one. */
export function parseYouTubeId(value: string): string | null {
	const input = value.trim();
	if (ID_RE.test(input)) return input;

	let url: URL;
	try {
		url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
	} catch {
		return null;
	}

	const host = url.hostname.toLowerCase();
	const [first, second] = url.pathname.split('/').filter(Boolean);
	let id: string | null | undefined = null;

	if (host === 'youtu.be' || host === 'www.youtu.be') id = first;
	else if (YOUTUBE_HOSTS.has(host)) {
		if (first === 'watch') id = url.searchParams.get('v');
		else if (ID_PATH_PREFIXES.has(first)) id = second;
	}

	return id && ID_RE.test(id) ? id : null;
}

/** Privacy-enhanced player: YouTube sets no cookies until the visitor presses play. */
export function youTubeEmbedUrl(id: string) {
	return `https://www.youtube-nocookie.com/embed/${id}?rel=0`;
}

export function youTubeWatchUrl(id: string) {
	return `https://youtu.be/${id}`;
}
