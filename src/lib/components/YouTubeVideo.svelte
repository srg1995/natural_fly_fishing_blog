<script lang="ts">
	import { youTubeEmbedUrl } from '#lib/youtube.ts';

	let { id, title }: { id: string; title: string } = $props();
</script>

<div class="aspect-video w-full overflow-hidden rounded-xl bg-stone-900">
	<iframe
		src={youTubeEmbedUrl(id)}
		{title}
		loading="lazy"
		allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
		referrerpolicy="strict-origin-when-cross-origin"
		allowfullscreen
		class="h-full w-full"
	></iframe>
</div>
