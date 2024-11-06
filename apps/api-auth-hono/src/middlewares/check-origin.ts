import { createMiddleware } from "hono/factory";
import { verifyRequestOrigin } from "../lib/request";

export const checkOriginMiddleware = createMiddleware(async (c, next) => {
    if (c.req.method === "GET") {
        return next();
    }
    const originHeader = c.req.header("Origin") ?? null;
    const hostHeader = c.req.header("Host") ?? null;
    if (!originHeader || !hostHeader || !verifyRequestOrigin(originHeader, [hostHeader])) {
        return c.body(null, 403);
    }
    return next();
});