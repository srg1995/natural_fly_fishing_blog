<script lang="ts">
	// A single photo is shown as is; several become a swipeable carousel (CSS scroll snap, no library).
	// Neighbouring photos peek in from the sides (the track's 12% padding centres a full-width slide). While scrolling, each slide's distance from the
	// centre (--d) drives its scale, opacity and an inner parallax, so the motion follows the finger.
	let { images, alt }: { images: { id: string; url: string }[]; alt: string } = $props();

	let track: HTMLElement | undefined = $state();
	let slides: HTMLElement[] = $state([]);
	// Fractional index of the slide at the centre: 1.5 means halfway between the 2nd and 3rd photo.
	let progress = $state(0);
	let current = $derived(Math.min(images.length - 1, Math.max(0, Math.round(progress))));

	function update() {
		const [first, second] = slides;
		if (!track || !first || !second) return;
		const step = second.offsetLeft - first.offsetLeft;
		const firstCentre = first.offsetLeft + first.clientWidth / 2;
		progress = (track.scrollLeft + track.clientWidth / 2 - firstCentre) / step;
	}

	$effect(update);

	function goTo(index: number) {
		const slide = slides[(index + images.length) % images.length];
		if (!track || !slide) return;
		const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
		track.scrollTo({
			left: slide.offsetLeft - (track.clientWidth - slide.clientWidth) / 2,
			behavior: reduceMotion ? 'auto' : 'smooth'
		});
	}

	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
		event.preventDefault();
		goTo(current + (event.key === 'ArrowRight' ? 1 : -1));
	}

	const clamp = (value: number) => Math.min(1, Math.max(0, value));

	const arrowClass =
		'absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/70 text-stone-900 opacity-0 shadow-lg ring-1 ring-black/5 backdrop-blur-md transition duration-300 group-hover:opacity-100 hover:scale-105 hover:bg-white/90 focus-visible:opacity-100 sm:flex';
</script>

<svelte:window onresize={update} />

{#snippet chevron(path: string)}
	<svg viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.25">
		<path d={path} stroke-linecap="round" stroke-linejoin="round" />
	</svg>
{/snippet}

{#if images.length === 1}
	<a href={images[0].url} target="_blank" rel="noopener external" class="block">
		<img src={images[0].url} {alt} class="max-h-[32rem] w-full rounded-2xl object-cover" />
	</a>
{:else if images.length > 1}
	<div role="region" aria-roledescription="carrusel" aria-label="Fotos de {alt}" class="group">
		<div class="relative -mx-4 sm:mx-0">
			<!-- Focusable so arrow keys move between photos -->
			<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
			<ul
				bind:this={track}
				onscroll={update}
				onkeydown={onKeydown}
				tabindex="0"
				aria-label="Fotos (usa las flechas para cambiar)"
				class="track relative -my-4 flex snap-x snap-mandatory [scrollbar-width:none] gap-3 overflow-x-auto px-[12%] py-8 outline-none focus-visible:ring-2 focus-visible:ring-stone-900 sm:rounded-2xl [&::-webkit-scrollbar]:hidden"
			>
				{#each images as image, i (image.id)}
					{@const d = Math.max(-1, Math.min(1, i - progress))}
					<li
						bind:this={slides[i]}
						class="slide w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-stone-200"
						style:--d={d}
						style:--a={Math.abs(d)}
						aria-roledescription="foto"
						aria-label="{i + 1} de {images.length}"
					>
						<a href={image.url} target="_blank" rel="noopener external" tabindex="-1" class="block">
							<img
								src={image.url}
								alt={i === 0 ? alt : ''}
								loading={i === 0 ? 'eager' : 'lazy'}
								draggable="false"
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
				class={[arrowClass, 'left-[calc(12%+0.75rem)]']}
			>
				{@render chevron('M15 18l-6-6 6-6')}
			</button>
			<button
				type="button"
				onclick={() => goTo(current + 1)}
				aria-label="Foto siguiente"
				class={[arrowClass, 'right-[calc(12%+0.75rem)]']}
			>
				{@render chevron('M9 18l6-6-6-6')}
			</button>
		</div>

		<div class="mx-auto flex max-w-xs items-center gap-3 px-4">
			<div class="flex flex-1 gap-1.5">
				{#each images as image, i (image.id)}
					<button
						type="button"
						onclick={() => goTo(i)}
						aria-label="Ver foto {i + 1}"
						aria-current={i === current}
						class="group/dot h-6 flex-1"
					>
						<span
							class="block h-1 overflow-hidden rounded-full bg-stone-300 transition-colors group-hover/dot:bg-stone-400"
						>
							<span
								class="block h-full origin-left rounded-full bg-stone-900"
								style:transform="scaleX({clamp(progress - i + 1)})"
							></span>
						</span>
					</button>
				{/each}
			</div>
			<span class="text-xs text-stone-500 tabular-nums" aria-live="polite">
				{current + 1} / {images.length}
			</span>
		</div>
	</div>
{/if}

<style>
	/* Side photos fade out instead of being cut off at the column edge. */
	.track {
		mask-image: linear-gradient(to right, transparent, black 3%, black 97%, transparent);
	}

	.slide {
		transform: scale(calc(1 - 0.07 * var(--a)));
		opacity: calc(1 - 0.45 * var(--a));
		box-shadow: 0 18px 40px -18px rgb(28 25 23 / calc(0.45 * (1 - var(--a))));
		will-change: transform, opacity;
	}

	/* The photo drifts more slowly than its frame, which reads as depth. */
	.slide img {
		transform: translateX(calc(var(--d) * -9%)) scale(1.2);
		will-change: transform;
	}

	@media (prefers-reduced-motion: reduce) {
		.slide,
		.slide img {
			transform: none;
		}
	}
</style>
