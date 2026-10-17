<script lang="ts">
	import { ENTRY_STATUSES, ENTRY_VISIBILITIES, type Entry } from '#lib/entries.ts';

	let { entry }: { entry: Pick<Entry, 'status' | 'visibility'> } = $props();

	const badge = 'rounded-full px-2.5 py-0.5 text-xs font-medium';
</script>

{#if entry.status === 'draft'}
	<span class={[badge, 'bg-amber-50 text-amber-700']}>{ENTRY_STATUSES.draft}</span>
{:else}
	<span
		class={[
			badge,
			entry.visibility === 'public' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
		]}
	>
		{ENTRY_VISIBILITIES[entry.visibility]}
	</span>
{/if}
