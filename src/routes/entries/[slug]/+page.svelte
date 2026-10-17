<script lang="ts">
	import { resolve } from '$app/paths';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let entry = $derived(data.entry);

	const dateFormat = new Intl.DateTimeFormat('es-ES', { dateStyle: 'long' });

	let date = $derived(dateFormat.format(new Date(entry.published_at ?? entry.created_at)));

	// Plain text split into paragraphs on blank lines; avoids {@html} until there's a sanitized markdown pipeline.
	let paragraphs = $derived(
		(entry.content ?? '')
			.split(/\n\s*\n/)
			.map((p) => p.trim())
			.filter(Boolean)
	);
</script>

<svelte:head>
	<title>{entry.title} · Natural Fly Fishing</title>
	{#if entry.excerpt}
		<meta name="description" content={entry.excerpt} />
	{/if}
</svelte:head>

<article class="mx-auto max-w-3xl px-4 py-10 sm:py-16">
	<a href={resolve('/')} class="text-sm text-stone-500 hover:text-stone-800">← Volver al blog</a>

	<header class="mt-6">
		<p class="text-sm text-stone-500">
			<time datetime={entry.published_at ?? entry.created_at}>{date}</time>
			{#if entry.location}
				<span aria-hidden="true">·</span> {entry.location}
			{/if}
		</p>
		<h1 class="mt-2 text-4xl font-bold tracking-tight text-stone-900 sm:text-5xl">
			{entry.title}
		</h1>
		{#if entry.excerpt}
			<p class="mt-4 text-lg text-stone-600">{entry.excerpt}</p>
		{/if}
	</header>

	{#if entry.cover_image_url}
		<img
			src={entry.cover_image_url}
			alt={entry.title}
			class="mt-8 aspect-[16/9] w-full rounded-xl object-cover"
		/>
	{/if}

	<div class="prose prose-lg mt-10 max-w-none prose-stone">
		{#each paragraphs as paragraph, i (i)}
			<p class="whitespace-pre-line">{paragraph}</p>
		{/each}
	</div>

	{#if entry.fly_tyings?.length}
		<section class="mt-16 border-t border-stone-200 pt-10">
			<h2 class="text-2xl font-semibold text-stone-900">Moscas montadas</h2>

			<ul class="mt-6 grid gap-6 sm:grid-cols-2">
				{#each entry.fly_tyings as fly (fly.id)}
					<li class="overflow-hidden rounded-xl border border-stone-200 bg-white">
						{#if fly.image_url}
							<img
								src={fly.image_url}
								alt={fly.name}
								class="aspect-[4/3] w-full object-cover"
								loading="lazy"
							/>
						{/if}
						<div class="p-5">
							<h3 class="text-lg font-semibold text-stone-900">{fly.name}</h3>

							<dl class="mt-3 space-y-1 text-sm text-stone-600">
								{#if fly.hook}
									<div class="flex gap-2">
										<dt class="font-medium text-stone-800">Anzuelo:</dt>
										<dd>{fly.hook}</dd>
									</div>
								{/if}
								{#if fly.thread}
									<div class="flex gap-2">
										<dt class="font-medium text-stone-800">Hilo:</dt>
										<dd>{fly.thread}</dd>
									</div>
								{/if}
							</dl>

							{#if fly.materials?.length}
								<ul class="mt-3 flex flex-wrap gap-2">
									{#each fly.materials as material (material)}
										<li class="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-700">
											{material}
										</li>
									{/each}
								</ul>
							{/if}

							{#if fly.notes}
								<p class="mt-3 text-sm text-stone-600">{fly.notes}</p>
							{/if}
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</article>
