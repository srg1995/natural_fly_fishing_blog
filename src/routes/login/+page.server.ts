import { fail, redirect, type Actions } from '@sveltejs/kit';

// Only allow same-origin relative paths, to avoid open redirects via ?redirectTo=
function safeRedirectTarget(value: string | null) {
	return value && value.startsWith('/') && !value.startsWith('//') ? value : '/';
}

export const actions: Actions = {
	default: async ({ request, url, locals }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, message: 'Introduce tu email y contraseña.' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email, password });

		if (error) {
			console.error('[login]', error.status, error.code, error.message);
			return fail(400, { email, message: 'Email o contraseña incorrectos.' });
		}

		redirect(303, safeRedirectTarget(url.searchParams.get('redirectTo')));
	}
};
