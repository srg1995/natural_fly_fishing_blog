<script lang="ts">
	import { resolve } from '$app/paths';
	import PublicationBadges from '#lib/components/PublicationBadges.svelte';
	import PublicationControls from '#lib/components/PublicationControls.svelte';
	import { ENTRY_TYPES } from '#lib/entries.ts';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' });
</script>

<svelte:head>
	<title>Admin · Natural Fly Fishing</title>
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-10">
	<div class="flex items-center justify-between gap-4">
		<h1 class="text-3xl font-bold tracking-tight text-stone-900">Entradas</h1>
		<a
			href={resolve('/admin/nueva')}
			class="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
		>
			Nueva entrada
		</a>
	</div>

	{#if data.entries.length === 0}
		<p class="mt-8 text-stone-500">Todavía no hay entradas.</p>
	{:else}
		<ul class="mt-8 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
			{#each data.entries as entry (entry.id)}
				<li class="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
					<div class="min-w-0">
						<a
							href={resolve('/entries/[slug]', { slug: entry.slug })}
							class="font-medium text-stone-900 hover:underline"
						>
							{entry.title}
						</a>
						<p class="text-sm text-stone-500">
							{ENTRY_TYPES[entry.type].label} ·
							{dateFormat.format(new Date(entry.published_at ?? entry.created_at))}
						</p>
					</div>
					<div class="flex flex-wrap items-center gap-3">
						<PublicationBadges {entry} />
						<PublicationControls {entry} />
					</div>
					{#if form?.message && form.id === entry.id}
						<p class="w-full text-sm text-red-700" role="alert">{form.message}</p>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</main>
