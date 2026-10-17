import { redirect, type Actions } from '@sveltejs/kit';

export const load = () => redirect(303, '/');

export const actions: Actions = {
	default: async ({ locals }) => {
		await locals.supabase.auth.signOut();
		redirect(303, '/login');
	}
};
