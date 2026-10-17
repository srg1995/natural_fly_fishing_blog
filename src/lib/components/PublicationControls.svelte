<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { Entry } from '#lib/entries.ts';

	// Posts to the page's own `cambiarPublicacion` action (see changeEntryPublication).
	let { entry }: { entry: Pick<Entry, 'id' | 'status' | 'visibility'> } = $props();

	let pending = $state(false);

	const submit: SubmitFunction = () => {
		pending = true;
		return async ({ update }) => {
			await update();
			pending = false;
		};
	};

	const buttonClass =
		'rounded-md border border-stone-300 px-3 py-1 text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-60';
</script>

<div class="flex flex-wrap items-center gap-2">
	<form method="POST" action="?/cambiarPublicacion" use:enhance={submit}>
		<input type="hidden" name="id" value={entry.id} />
		<input
			type="hidden"
			name="visibility"
			value={entry.visibility === 'public' ? 'private' : 'public'}
		/>
		<button type="submit" disabled={pending} class={buttonClass}>
			{entry.visibility === 'public' ? 'Hacer privada' : 'Hacer pública'}
		</button>
	</form>

	<form method="POST" action="?/cambiarPublicacion" use:enhance={submit}>
		<input type="hidden" name="id" value={entry.id} />
		<input
			type="hidden"
			name="status"
			value={entry.status === 'published' ? 'draft' : 'published'}
		/>
		<button
			type="submit"
			disabled={pending}
			class={entry.status === 'published'
				? buttonClass
				: 'rounded-md bg-stone-900 px-3 py-1 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60'}
		>
			{entry.status === 'published' ? 'Pasar a borrador' : 'Publicar'}
		</button>
	</form>
</div>
