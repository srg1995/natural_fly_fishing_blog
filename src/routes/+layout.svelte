<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { resolve } from '$app/paths';
	import type { LayoutProps } from './$types';

	let { children, data }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if data.user}
	<header class="border-b border-stone-200">
		<div class="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
			<a href={resolve('/')} class="font-semibold text-stone-900">Natural Fly Fishing</a>
			<div class="flex items-center gap-4 text-sm text-stone-500">
				<span class="hidden sm:inline">{data.user.email}</span>
				<form method="POST" action="/logout">
					<button type="submit" class="hover:text-stone-900">Salir</button>
				</form>
			</div>
		</div>
	</header>
{/if}

{@render children()}
