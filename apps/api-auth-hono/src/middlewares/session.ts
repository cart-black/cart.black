import { createMiddleware } from 'hono/factory'
import { getCookie } from 'hono/cookie';
import { validateSessionToken } from "../lib/session";
import { SESSION_COOKIE_NAME } from "../constants";
import { deleteSessionTokenCookie, setSessionTokenCookie } from '../lib/cookie';

export const sessionMiddleware = createMiddleware(async (context, next) => {
    const token = getCookie(context, SESSION_COOKIE_NAME) ?? null;
    if (token === null) {
        context.set("user", null);
        context.set("session", null);
        return next();
    }
    const { user, session } = await validateSessionToken(token);
    if (session !== null) {
        setSessionTokenCookie(context, token, session.expiresAt);
    } else {
        deleteSessionTokenCookie(context);
    }
    context.set("session", session);
    context.set("user", user);
    return next();
});