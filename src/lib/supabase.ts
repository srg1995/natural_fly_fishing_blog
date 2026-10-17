import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$app/env/public';

let client: SupabaseClient | undefined;

/**
 * Browser-side client. It reads the same session cookies the server sets in hooks.server.ts,
 * so RLS sees the signed-in user. Used for photo uploads, which go straight to Storage
 * instead of through the app server (Vercel caps request bodies at 4.5 MB).
 */
export function getBrowserSupabase() {
	client ??= createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY);
	return client;
}
