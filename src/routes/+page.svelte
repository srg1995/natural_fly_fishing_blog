<script lang="ts">
	import { resolve } from '$app/paths';
	import { ENTRY_TYPES, ENTRY_VISIBILITIES } from '#lib/entries.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' });
</script>

<svelte:head>
	<title>Natural Fly Fishing</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-10 sm:py-16">
	<h1 class="text-4xl font-bold tracking-tight text-stone-900">Entradas</h1>

	{#if !data.user}
		<p class="mt-3 text-stone-500">
			Algunas entradas son privadas. <a
				href={resolve('/login')}
				class="font-medium text-stone-800 underline underline-offset-4">Entra</a
			> para verlas todas.
		</p>
	{/if}

	{#if data.entries.length === 0}
		<p class="mt-8 text-stone-500">Todavía no hay entradas.</p>
	{:else}
		<ul class="mt-10 space-y-10">
			{#each data.entries as entry (entry.id)}
				<li>
					<a href={resolve('/entries/[slug]', { slug: entry.slug })} class="group block">
						{#if entry.coverUrl}
							<img
								src={entry.coverUrl}
								alt=""
								loading="lazy"
								class="mb-4 aspect-[16/9] w-full rounded-xl object-cover"
							/>
						{/if}
						<p class="text-sm text-stone-500">
							<time datetime={entry.published_at ?? entry.created_at}>
								{dateFormat.format(new Date(entry.published_at ?? entry.created_at))}
							</time>
							<span aria-hidden="true">·</span>
							{ENTRY_TYPES[entry.type].label}
							{#if entry.visibility === 'private'}
								<span aria-hidden="true">·</span>
								{ENTRY_VISIBILITIES.private}
							{/if}
						</p>
						<h2
							class="mt-1 text-2xl font-semibold text-stone-900 group-hover:underline group-hover:underline-offset-4"
						>
							{entry.title}
						</h2>
						{#if entry.excerpt}
							<p class="mt-2 text-stone-600">{entry.excerpt}</p>
						{/if}
					</a>
				</li>
			{/each}
		</ul>
	{/if}
</main>
