<script lang="ts">
	// A single photo is shown as is; several become a swipeable carousel (CSS scroll snap, no library).
	let { images, alt }: { images: { id: string; url: string }[]; alt: string } = $props();

	let track: HTMLElement | undefined = $state();
	let current = $state(0);

	function onScroll() {
		if (track) current = Math.round(track.scrollLeft / track.clientWidth);
	}

	function goTo(index: number) {
		if (!track) return;
		const target = (index + images.length) % images.length;
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		track.scrollTo({
			left: target * track.clientWidth,
			behavior: reduceMotion ? 'auto' : 'smooth'
		});
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
	}

	const arrowClass =
		'absolute top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-xl text-stone-900 shadow hover:bg-white focus-visible:outline-2 focus-visible:outline-white';
</script>

{#if images.length === 1}
	<a href={images[0].url} target="_blank" rel="noopener external" class="block">
		<img src={images[0].url} {alt} class="max-h-[32rem] w-full rounded-xl object-cover" />
	</a>
{:else if images.length > 1}
	<div role="region" aria-roledescription="carrusel" aria-label="Fotos de {alt}">
		<div class="relative">
			<!-- Focusable so arrow keys move between photos -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
			<ul
				bind:this={track}
				onscroll={onScroll}
				onkeydown={onKeydown}
				tabindex="0"
				aria-label="Fotos (usa las flechas para cambiar)"
				class="flex snap-x snap-mandatory [scrollbar-width:none] overflow-x-auto rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 [&::-webkit-scrollbar]:hidden"
			>
				{#each images as image, i (image.id)}
					<li
						class="w-full shrink-0 snap-center"
						aria-roledescription="foto"
						aria-label="{i + 1} de {images.length}"
					>
						<a href={image.url} target="_blank" rel="noopener external" tabindex="-1" class="block">
							<img
								src={image.url}
								alt={i === 0 ? alt : ''}
								loading={i === 0 ? 'eager' : 'lazy'}
								class="aspect-[3/2] w-full object-cover"
							/>
						</a>
					</li>
				{/each}
			</ul>

			<button
				type="button"
				onclick={() => goTo(current - 1)}
				aria-label="Foto anterior"
				class={[arrowClass, 'left-3']}>‹</button
			>
			<button
				type="button"
				onclick={() => goTo(current + 1)}
				aria-label="Foto siguiente"
				class={[arrowClass, 'right-3']}>›</button
			>
			<span
				class="absolute right-3 bottom-3 rounded-full bg-stone-900/70 px-2.5 py-0.5 text-xs text-white tabular-nums"
				aria-live="polite"
			>
				{current + 1} / {images.length}
			</span>
		</div>

		<div class="mt-3 flex flex-wrap justify-center gap-2">
			{#each images as image, i (image.id)}
				<button
					type="button"
					onclick={() => goTo(i)}
					aria-label="Ver foto {i + 1}"
					aria-current={i === current}
					class={[
						'size-2.5 rounded-full transition-colors',
						i === current ? 'bg-stone-900' : 'bg-stone-300 hover:bg-stone-500'
					]}
				></button>
			{/each}
		</div>
	</div>
{/if}
