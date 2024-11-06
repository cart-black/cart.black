import { getUserRecoverCode } from "@lib/server/user";

import type { APIContext } from "astro";

export async function GET(context: APIContext): Promise<Response> {
	if (context.locals.session === null || context.locals.user === null) {
		return new Response("Not authenticated", {
			status: 401
		});
	}
	if (!context.locals.user.emailVerified) {
		return new Response("Forbidden", {
			status: 403
		});
	}
	if (!context.locals.session.twoFactorVerified) {
		return new Response("Forbidden", {
			status: 403
		});
	}
	const code = getUserRecoverCode(context.locals.session.userId);
	return new Response(code);
}