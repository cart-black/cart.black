import { createMiddleware } from 'hono/factory'
import { RefillingTokenBucket } from "../lib/rate-limit";
import { IS_PROD } from '../constants';

const bucket = new RefillingTokenBucket<string>(100, 1);

export const rateLimitMiddleware = createMiddleware(async (context, next) => {
    // TODO: Assumes X-Forwarded-For is always included.
    const clientIP = IS_PROD ? context.req.header("X-Forwarded-For") : "127.0.0.1";
    if (clientIP === null) {
        await next();
    } else {
        let cost: number;
        if (context.req.method === "GET" || context.req.method === "OPTIONS") {
            cost = 1;
        } else {
            cost = 3;
        }
        if (!bucket.consume(clientIP!, cost)) {
            return new Response("Too many requests", {
                status: 429
            });
        }
        await next();
    }
});