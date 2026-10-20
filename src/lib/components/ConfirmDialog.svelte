<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import type { Snippet } from 'svelte';

	// Modal confirmation for a destructive form action. Built on <dialog>: showModal() traps focus,
	// Escape closes it and focus returns to the button that opened it. Cancel comes first, so it gets focus.
	let {
		open = $bindable(false),
		title,
		confirmLabel,
		pendingLabel = 'Borrando…',
		action,
		fields,
		children
	}: {
		open?: boolean;
		title: string;
		confirmLabel: string;
		pendingLabel?: string;
		/** Form action to post to, e.g. `?/borrarFoto`. */
		action: string;
		/** Sent as hidden inputs. */
		fields: Record<string, string>;
		children?: Snippet;
	} = $props();

	const titleId = $props.id();
	let dialog: HTMLDialogElement | undefined = $state();
	let pending = $state(false);

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		else if (!open && dialog.open) dialog.close();
	});

	const submit: SubmitFunction = () => {
		pending = true;
		return async ({ update }) => {
			await update();
			pending = false;
			open = false;
		};
	};

	// A click whose target is the <dialog> itself landed on the backdrop: the panel fills the dialog.
	function onClick(event: MouseEvent) {
		if (event.target === dialog && !pending) open = false;
	}
</script>

<dialog
	bind:this={dialog}
	aria-labelledby={titleId}
	onclose={() => (open = false)}
	oncancel={(event) => pending && event.preventDefault()}
	onclick={onClick}
	class="m-auto w-[calc(100%-2rem)] max-w-sm scale-95 rounded-2xl bg-white p-0 opacity-0 shadow-2xl ring-1 ring-black/5 transition-[opacity,scale,display,overlay] transition-discrete duration-200 ease-out backdrop:bg-stone-900/0 backdrop:backdrop-blur-none backdrop:transition-all backdrop:transition-discrete backdrop:duration-200 open:scale-100 open:opacity-100 open:backdrop:bg-stone-900/40 open:backdrop:backdrop-blur-sm starting:open:scale-95 starting:open:opacity-0 starting:open:backdrop:bg-stone-900/0 starting:open:backdrop:backdrop-blur-none"
>
	<div class="p-6">
		<h2 id={titleId} class="text-lg font-semibold text-stone-900">{title}</h2>
		<div class="mt-3 text-sm text-stone-600">
			{@render children?.()}
		</div>

		<form method="POST" {action} use:enhance={submit} class="mt-6 flex justify-end gap-2">
			{#each Object.entries(fields) as [name, value] (name)}
				<input type="hidden" {name} {value} />
			{/each}
			<button
				type="button"
				onclick={() => (open = false)}
				disabled={pending}
				class="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-60"
			>
				Cancelar
			</button>
			<button
				type="submit"
				disabled={pending}
				class="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
			>
				{pending ? pendingLabel : confirmLabel}
			</button>
		</form>
	</div>
</dialog>
