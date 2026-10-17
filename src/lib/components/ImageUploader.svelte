<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { uploadEntryImages } from '#lib/images.ts';
	import { getBrowserSupabase } from '#lib/supabase.ts';

	let { entryId, nextPosition }: { entryId: string; nextPosition: number } = $props();

	let input: HTMLInputElement | undefined = $state();
	let files: File[] = $state([]);
	let progress: { done: number; total: number } | null = $state(null);
	let errorMessage: string | null = $state(null);

	async function upload() {
		if (files.length === 0) return;
		errorMessage = null;

		const { error } = await uploadEntryImages(
			getBrowserSupabase(),
			entryId,
			files,
			nextPosition,
			(done, total) => (progress = { done, total })
		);

		progress = null;
		if (error) {
			errorMessage = error;
			return;
		}

		files = [];
		if (input) input.value = '';
		await invalidateAll();
	}
</script>

<div class="rounded-xl border border-dashed border-stone-300 p-4">
	<label class="block">
		<span class="text-sm font-medium text-stone-700">Añadir fotos</span>
		<input
			bind:this={input}
			type="file"
			accept="image/*"
			multiple
			disabled={progress !== null}
			onchange={(e) => (files = Array.from(e.currentTarget.files ?? []))}
			class="mt-1 block w-full text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-stone-200"
		/>
	</label>

	{#if errorMessage}
		<p class="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
			{errorMessage}
		</p>
	{/if}

	<button
		type="button"
		onclick={upload}
		disabled={files.length === 0 || progress !== null}
		class="mt-3 rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
	>
		{#if progress}
			Subiendo {Math.min(progress.done + 1, progress.total)} de {progress.total}…
		{:else}
			Subir {files.length || ''} {files.length === 1 ? 'foto' : 'fotos'}
		{/if}
	</button>
</div>
