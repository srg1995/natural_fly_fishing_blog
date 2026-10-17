<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let submitting = $state(false);
</script>

<svelte:head>
	<title>Entrar · Natural Fly Fishing</title>
</svelte:head>

<main class="flex min-h-screen items-center justify-center bg-stone-50 px-4">
	<div class="w-full max-w-sm">
		<h1 class="text-center text-3xl font-bold tracking-tight text-stone-900">
			Natural Fly Fishing
		</h1>
		<p class="mt-2 text-center text-sm text-stone-500">Accede para leer el blog</p>

		<form
			method="POST"
			class="mt-8 space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
			use:enhance={() => {
				submitting = true;
				return async ({ update }) => {
					await update({ reset: false });
					submitting = false;
				};
			}}
		>
			<label class="block">
				<span class="text-sm font-medium text-stone-700">Email</span>
				<input
					type="email"
					name="email"
					autocomplete="email"
					required
					value={form?.email ?? ''}
					class="mt-1 block w-full rounded-md border-stone-300 focus:border-stone-500 focus:ring-stone-500"
				/>
			</label>

			<label class="block">
				<span class="text-sm font-medium text-stone-700">Contraseña</span>
				<input
					type="password"
					name="password"
					autocomplete="current-password"
					required
					class="mt-1 block w-full rounded-md border-stone-300 focus:border-stone-500 focus:ring-stone-500"
				/>
			</label>

			{#if form?.message}
				<p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
					{form.message}
				</p>
			{/if}

			<button
				type="submit"
				disabled={submitting}
				class="w-full rounded-md bg-stone-900 px-4 py-2 font-medium text-white hover:bg-stone-700 disabled:opacity-60"
			>
				{submitting ? 'Entrando…' : 'Entrar'}
			</button>
		</form>
	</div>
</main>
