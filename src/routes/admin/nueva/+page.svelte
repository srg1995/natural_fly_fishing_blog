<script lang="ts">
	import { enhance, type SubmitFunction } from '$app/forms';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import {
		ENTRY_STATUSES,
		ENTRY_VISIBILITIES,
		ENTRY_TYPES,
		ENTRY_TYPE_KEYS,
		isEntryType,
		type DetailField,
		type EntryType
	} from '#lib/entries.ts';
	import { uploadEntryImages } from '#lib/images.ts';
	import { getBrowserSupabase } from '#lib/supabase.ts';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();

	let mode = $derived(form?.mode ?? 'formulario');
	let values: Record<string, string> = $derived(form?.values ?? {});
	let errors: Record<string, string> = $derived(form?.errors ?? {});
	let type: EntryType = $derived(isEntryType(values.type) ? values.type : 'montaje_moscas');
	let submitting = $state(false);
	let photoCount = $state(0);
	let uploadProgress: { done: number; total: number } | null = $state(null);

	const inputClass =
		'mt-1 block w-full rounded-md border-stone-300 text-sm focus:border-stone-500 focus:ring-stone-500';

	const example = `---
type: montaje_moscas
title: Pardón en CDC
slug: pardon-en-cdc            # opcional, se genera del título
excerpt: Una seca sencilla para las tardes de mayo.
status: draft                  # draft | published
visibility: private            # private (con sesión) | public (cualquiera)
published_at: 2026-05-12       # opcional
fly_name: Pardón CDC
fly_pattern: seca
hook_size: 16
target_species: trucha común
materials: [hilo 8/0 marrón, CDC natural, cola de gallo de León]
---

El cuerpo de la entrada en **Markdown**.`;

	function withPending() {
		submitting = true;
		return async ({ update }: { update: (opts?: { reset?: boolean }) => Promise<void> }) => {
			await update({ reset: false });
			submitting = false;
		};
	}

	// Photos aren't sent to the action: once the entry exists, they go from the browser straight to Storage.
	const submitEntry: SubmitFunction = ({ formData }) => {
		submitting = true;
		const photos = formData
			.getAll('images')
			.filter((file): file is File => file instanceof File && file.size > 0);
		formData.delete('images');

		return async ({ result, update }) => {
			const created = result.type === 'success' ? result.data?.created : undefined;
			if (!created) {
				await update({ reset: false });
				submitting = false;
				return;
			}

			const { id, slug } = created as { id: string; slug: string };
			if (photos.length > 0) {
				const { error } = await uploadEntryImages(
					getBrowserSupabase(),
					id,
					photos,
					0,
					(done, total) => (uploadProgress = { done, total })
				);
				if (error)
					alert(
						`La entrada se ha creado, pero las fotos no: ${error}\nPuedes subirlas desde la entrada.`
					);
			}
			await goto(resolve('/entries/[slug]', { slug }));
		};
	};
</script>

<svelte:head>
	<title>Nueva entrada · Admin</title>
</svelte:head>

{#snippet fieldError(name: string)}
	{#if errors[name]}
		<p class="mt-1 text-sm text-red-700">{errors[name]}</p>
	{/if}
{/snippet}

{#snippet detailInput(field: DetailField)}
	<label class={['block', field.kind === 'textarea' && 'sm:col-span-2']}>
		<span class="text-sm font-medium text-stone-700">
			{field.label}{#if field.required}<span class="text-red-700"> *</span>{/if}
		</span>
		{#if field.kind === 'textarea'}
			<textarea name={field.name} rows="3" value={values[field.name] ?? ''} class={inputClass}
			></textarea>
		{:else}
			<input
				name={field.name}
				type={field.kind === 'date' ? 'date' : field.kind === 'int' ? 'number' : 'text'}
				min={field.min}
				step={field.kind === 'int' ? 1 : undefined}
				required={field.required}
				placeholder={field.kind === 'list'
					? `${field.placeholder ?? ''} (separados por comas)`
					: field.placeholder}
				value={values[field.name] ?? ''}
				class={inputClass}
			/>
		{/if}
		{@render fieldError(field.name)}
	</label>
{/snippet}

<main class="mx-auto max-w-3xl px-4 py-10">
	<h1 class="text-3xl font-bold tracking-tight text-stone-900">Nueva entrada</h1>

	<div class="mt-6 flex gap-1 border-b border-stone-200" role="tablist">
		{#each [['formulario', 'Formulario'], ['archivo', 'Archivo Markdown']] as const as [key, label] (key)}
			<button
				type="button"
				role="tab"
				aria-selected={mode === key}
				onclick={() => (mode = key)}
				class={[
					'-mb-px border-b-2 px-4 py-2 text-sm font-medium',
					mode === key
						? 'border-stone-900 text-stone-900'
						: 'border-transparent text-stone-500 hover:text-stone-800'
				]}
			>
				{label}
			</button>
		{/each}
	</div>

	<section class={['mt-6 space-y-6', mode !== 'archivo' && 'hidden']}>
		<form
			method="POST"
			action="?/importar"
			enctype="multipart/form-data"
			use:enhance={withPending}
			class="space-y-4 rounded-xl border border-stone-200 bg-white p-6"
		>
			<label class="block">
				<span class="text-sm font-medium text-stone-700">Archivo .md</span>
				<input
					type="file"
					name="file"
					accept=".md,.markdown,text/markdown"
					required
					class="mt-1 block w-full text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-stone-200"
				/>
			</label>
			{#if form?.importError}
				<p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
					{form.importError}
				</p>
			{/if}
			<p class="text-sm text-stone-500">
				Se cargará en el formulario para que lo revises antes de guardar.
			</p>
			<button
				type="submit"
				disabled={submitting}
				class="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
			>
				{submitting ? 'Importando…' : 'Importar'}
			</button>
		</form>

		<div class="prose prose-sm max-w-none prose-stone">
			<h2>Formato del archivo</h2>
			<p>
				Los campos van en un bloque <em>frontmatter</em> YAML al principio y el resto del archivo es
				el cuerpo. Si no hay <code>title</code>, se usa el primer <code># Título</code>.
			</p>
			<pre><code>{example}</code></pre>
			<h3>Campos de cada tipo</h3>
			<ul>
				{#each ENTRY_TYPE_KEYS as key (key)}
					<li>
						<code>{key}</code> ({ENTRY_TYPES[key].label}):
						{#each ENTRY_TYPES[key].fields as field, i (field.name)}
							<code>{field.name}</code>{#if 'required' in field && field.required}*{/if}{i <
							ENTRY_TYPES[key].fields.length - 1
								? ', '
								: ''}
						{/each}
					</li>
				{/each}
			</ul>
			<p>* obligatorio. Las listas pueden ir como <code>[a, b]</code> o separadas por comas.</p>
		</div>
	</section>

	<div class={[mode !== 'formulario' && 'hidden']}>
		{#key form}
			<form
				method="POST"
				action="?/crear"
				enctype="multipart/form-data"
				use:enhance={submitEntry}
				class="mt-6 space-y-6 rounded-xl border border-stone-200 bg-white p-6"
			>
				{#if form?.created}
					<p class="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
						Entrada creada.
						<a
							href={resolve('/entries/[slug]', { slug: form.created.slug })}
							class="font-medium underline">Verla</a
						>
					</p>
				{/if}
				{#if form?.importedFrom}
					<p class="rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800">
						Importado de <strong>{form.importedFrom}</strong>. Revisa los campos y guarda.
					</p>
				{/if}
				{#if form?.message}
					<p class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
						{form.message}
					</p>
				{/if}

				<div class="grid gap-4 sm:grid-cols-2">
					<label class="block">
						<span class="text-sm font-medium text-stone-700"
							>Tipo <span class="text-red-700">*</span></span
						>
						<select
							name="type"
							value={type}
							onchange={(e) => (type = e.currentTarget.value as EntryType)}
							class={inputClass}
						>
							{#each ENTRY_TYPE_KEYS as key (key)}
								<option value={key}>{ENTRY_TYPES[key].label}</option>
							{/each}
						</select>
						{@render fieldError('type')}
					</label>

					<div class="grid grid-cols-2 gap-4">
						<label class="block">
							<span class="text-sm font-medium text-stone-700">Estado</span>
							<select name="status" value={values.status ?? 'draft'} class={inputClass}>
								{#each Object.entries(ENTRY_STATUSES) as [key, label] (key)}
									<option value={key}>{label}</option>
								{/each}
							</select>
							{@render fieldError('status')}
						</label>

						<label class="block">
							<span class="text-sm font-medium text-stone-700">Visibilidad</span>
							<select name="visibility" value={values.visibility ?? 'private'} class={inputClass}>
								{#each Object.entries(ENTRY_VISIBILITIES) as [key, label] (key)}
									<option value={key}>{label}</option>
								{/each}
							</select>
							{@render fieldError('visibility')}
						</label>
					</div>

					<label class="block sm:col-span-2">
						<span class="text-sm font-medium text-stone-700"
							>Título <span class="text-red-700">*</span></span
						>
						<input name="title" required value={values.title ?? ''} class={inputClass} />
						{@render fieldError('title')}
					</label>

					<label class="block">
						<span class="text-sm font-medium text-stone-700">Slug</span>
						<input
							name="slug"
							value={values.slug ?? ''}
							placeholder="se genera del título"
							class={inputClass}
						/>
						{@render fieldError('slug')}
					</label>

					<label class="block">
						<span class="text-sm font-medium text-stone-700">Fecha de publicación</span>
						<input
							name="published_at"
							type="date"
							value={values.published_at?.slice(0, 10) ?? ''}
							class={inputClass}
						/>
						{@render fieldError('published_at')}
					</label>

					<label class="block sm:col-span-2">
						<span class="text-sm font-medium text-stone-700">Entradilla</span>
						<input name="excerpt" value={values.excerpt ?? ''} class={inputClass} />
					</label>
				</div>

				<fieldset class="rounded-lg border border-stone-200 p-4">
					<legend class="px-1 text-sm font-semibold text-stone-900"
						>{ENTRY_TYPES[type].label}</legend
					>
					<div class="grid gap-4 sm:grid-cols-2">
						{#each ENTRY_TYPES[type].fields as field (field.name)}
							{@render detailInput(field)}
						{/each}
					</div>
				</fieldset>

				<label class="block">
					<span class="text-sm font-medium text-stone-700">Cuerpo (Markdown)</span>
					<textarea
						name="body"
						rows="16"
						value={values.body ?? ''}
						class={[inputClass, 'font-mono']}></textarea>
				</label>

				<label class="block">
					<span class="text-sm font-medium text-stone-700">Fotos</span>
					<input
						type="file"
						name="images"
						accept="image/*"
						multiple
						onchange={(e) => (photoCount = e.currentTarget.files?.length ?? 0)}
						class="mt-1 block w-full text-sm text-stone-700 file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-stone-200"
					/>
					<span class="mt-1 block text-sm text-stone-500">
						{photoCount > 0
							? `${photoCount} ${photoCount === 1 ? 'foto' : 'fotos'}. La primera será la portada.`
							: 'Opcional. La primera será la portada; luego puedes añadir más desde la entrada.'}
					</span>
				</label>

				<div class="flex justify-end">
					<button
						type="submit"
						disabled={submitting}
						class="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
					>
						{#if uploadProgress}
							Subiendo foto {Math.min(uploadProgress.done + 1, uploadProgress.total)} de {uploadProgress.total}…
						{:else}
							{submitting ? 'Guardando…' : 'Guardar entrada'}
						{/if}
					</button>
				</div>
			</form>
		{/key}
	</div>
</main>
