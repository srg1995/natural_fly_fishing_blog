import { defineEnvVars } from '@sveltejs/kit/env';

export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		static: true,
		description: 'Supabase project URL (Project Settings → API)'
	},
	PUBLIC_SUPABASE_PUBLISHABLE_KEY: {
		public: true,
		static: true,
		description:
			'Supabase publishable (or legacy anon) key — safe to expose, access is enforced by RLS'
	}
});
