<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import ImageCarousel from '#lib/components/ImageCarousel.svelte';
	import ImageUploader from '#lib/components/ImageUploader.svelte';
	import PublicationBadges from '#lib/components/PublicationBadges.svelte';
	import PublicationControls from '#lib/components/PublicationControls.svelte';
	import YouTubeVideo from '#lib/components/YouTubeVideo.svelte';
	import { ENTRY_TYPES } from '#lib/entries.ts';
	import { youTubeWatchUrl } from '#lib/youtube.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let entry = $derived(data.entry);
	let typeInfo = $derived(ENTRY_TYPES[entry.type]);

	const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' });
	// Plain dates (YYYY-MM-DD) are formatted in UTC so they don't shift a day in negative offsets.
	const dayFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long', timeZone: 'UTC' });

	let date = $derived(dateFormat.format(new Date(entry.published_at ?? entry.created_at)));

	let details = $derived(
		typeInfo.fields
			.map((field) => {
				const value = data.detail?.[field.name];
				if (value == null || (Array.isArray(value) && value.length === 0)) return null;
				const shown =
					field.kind === 'date'
						? dayFormat.format(new Date(String(value)))
						: Array.isArray(value)
							? value.join(', ')
							: String(value);
				return { label: field.label, value: shown };
			})
			.filter((detail) => detail !== null)
	);
</script>

<svelte:head>
	<title>{entry.title} · Natural Fly Fishing</title>
	{#if entry.excerpt}
		<meta name="description" content={entry.excerpt} />
	{/if}
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-10 sm:py-16">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<a href={resolve('/')} class="text-sm text-stone-500 hover:text-stone-800">← Volver al blog</a>

		{#if data.isSuperadmin}
			<PublicationControls {entry} />
		{/if}
	</div>
	{#if form?.message}
		<p class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
			{form.message}
		</p>
	{/if}

	<header class="mt-6">
		<p class="flex flex-wrap items-center gap-2 text-sm text-stone-500">
			<span class="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
				{typeInfo.label}
			</span>
			<time datetime={entry.published_at ?? entry.created_at}>{date}</time>
			{#if data.isSuperadmin || entry.visibility === 'private'}
				<PublicationBadges {entry} />
			{/if}
		</p>
		<h1 class="mt-3 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
			{entry.title}
		</h1>
		{#if entry.excerpt}
			<p class="mt-4 text-lg text-stone-600">{entry.excerpt}</p>
		{/if}
	</header>

	{#if data.images.length > 0}
		<div class="mt-8">
			<ImageCarousel images={data.images} alt={entry.title} />
		</div>
	{/if}

	{#if entry.youtube_id}
		<div class="mt-8">
			<YouTubeVideo id={entry.youtube_id} title="Vídeo: {entry.title}" />
		</div>
	{/if}

	{#if details.length > 0}
		<dl
			class="mt-8 grid gap-x-6 gap-y-3 rounded-xl border border-stone-200 bg-stone-50 p-5 sm:grid-cols-2"
		>
			{#each details as detail (detail.label)}
				<div>
					<dt class="text-xs font-medium tracking-wide text-stone-500 uppercase">{detail.label}</dt>
					<dd class="mt-0.5 text-stone-900">{detail.value}</dd>
				</div>
			{/each}
		</dl>
	{/if}

	{#if data.html}
		<div class="prose prose-lg mt-10 max-w-none prose-stone">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- Markdown written by superadmins only (RLS) -->
			{@html data.html}
		</div>
	{/if}

	{#if data.isSuperadmin}
		<section class="mt-12 space-y-4 border-t border-stone-200 pt-8">
			<h2 class="text-lg font-semibold text-stone-900">Fotos</h2>
			<p class="text-sm text-stone-500">La primera foto es la portada.</p>

			{#if data.images.length > 0}
				<ul class="grid grid-cols-3 gap-3 sm:grid-cols-4">
					{#each data.images as image, i (image.id)}
						<li class="relative">
							<img src={image.url} alt="" class="aspect-square w-full rounded-lg object-cover" />
							{#if i === 0}
								<span
									class="absolute top-1 left-1 rounded bg-stone-900/80 px-1.5 py-0.5 text-xs text-white"
								>
									Portada
								</span>
							{/if}
							<form
								method="POST"
								action="?/borrarFoto"
								use:enhance={({ cancel }) => {
									if (!confirm('¿Borrar esta foto?')) cancel();
								}}
								class="absolute top-1 right-1"
							>
								<input type="hidden" name="imageId" value={image.id} />
								<button
									type="submit"
									aria-label="Borrar foto"
									class="rounded bg-white/90 px-1.5 py-0.5 text-xs font-medium text-red-700 hover:bg-white"
								>
									Borrar
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{/if}

			<ImageUploader entryId={entry.id} nextPosition={data.nextImagePosition} />
		</section>

		<section class="mt-12 space-y-4 border-t border-stone-200 pt-8">
			<h2 class="text-lg font-semibold text-stone-900">Vídeo</h2>
			<form method="POST" action="?/guardarVideo" use:enhance class="space-y-2">
				<input type="hidden" name="entryId" value={entry.id} />
				<label class="block">
					<span class="text-sm text-stone-500">
						Enlace de YouTube. Déjalo vacío para quitar el vídeo.
					</span>
					<input
						name="video"
						type="url"
						value={form?.video ?? (entry.youtube_id ? youTubeWatchUrl(entry.youtube_id) : '')}
						placeholder="https://www.youtube.com/watch?v=…"
						class="mt-1 block w-full rounded-md border-stone-300 text-sm focus:border-stone-500 focus:ring-stone-500"
					/>
				</label>
				{#if form?.videoError}
					<p class="text-sm text-red-700" role="alert">{form.videoError}</p>
				{/if}
				<button
					type="submit"
					class="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
				>
					Guardar vídeo
				</button>
			</form>
		</section>
	{/if}
</article>
