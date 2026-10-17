export const load = ({ locals }) => ({
	user: locals.user ? { email: locals.user.email } : null
});
