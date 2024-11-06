import { serve, type HttpBindings } from "@hono/node-server";
// import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { userRoute } from "./routes/userRoute.js";
import { type Session } from "./lib/session";
import { type User } from "./lib/user";
import { mainRouter } from "./routes/index/index.js";
import { checkOriginMiddleware } from "./middlewares/check-origin.js";
import { rateLimitMiddleware } from "./middlewares/rate-limit.js";
import { sessionMiddleware } from "./middlewares/session.js";

export type HonoVariables = {
	session: Session | null,
	user: User | null,
};

type Bindings = HttpBindings & {
	/* ... */
};

export type honoTypes = { Bindings: Bindings; Variables: HonoVariables };

const app = new Hono<honoTypes>();
// app.use("/*", serveStatic({ root: "./static" }));
app.use("*", checkOriginMiddleware);
app.use("*", rateLimitMiddleware);
app.use("*", sessionMiddleware);


app.get("/hello", (c) => {
	return c.text("Hello Hono!");
});

const renderRoutes = app.basePath("/")
	.route("/", mainRouter);

const apiRoutes = app.basePath("/api")
	.route("/user", userRoute);

export type AppType = typeof apiRoutes;

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port
});
