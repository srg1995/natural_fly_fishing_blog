import { createServerClient } from '@supabase/ssr';
import { redirect } from '@sveltejs/kit';
import { sequence, type Handle } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';
import type { UserRole } from '#lib/entries.ts';

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				for (const { name, value, options } of cookiesToSet) {
					event.cookies.set(name, value, { ...options, path: '/' });
				}
			}
		}
	});

	// getSession() alone reads the cookie without verifying it; getUser() validates the JWT with Supabase Auth.
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();
		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

// Reading is open: which entries each visitor sees is decided by RLS (public / private / draft).
// Only /admin needs a session here, and a superadmin one.
const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;
	event.locals.role = null;

	if (user) {
		const { data: profile } = await event.locals.supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.maybeSingle();
		event.locals.role = (profile?.role as UserRole | undefined) ?? 'reader';
	}

	const { pathname } = event.url;

	if (user && pathname === '/login') {
		redirect(303, '/');
	}

	// Covers both page loads and form actions under /admin. RLS enforces the same rule in the database.
	const isAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
	if (isAdminRoute && !user) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(pathname + event.url.search)}`);
	}
	if (isAdminRoute && event.locals.role !== 'superadmin') {
		redirect(303, '/');
	}

	return resolve(event);
};

export const handle = sequence(supabase, authGuard);
