import { serve, type HttpBindings } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { userRoute } from "./routes/userRoute.js";

export type HonoVariables = {
	// SESSION: Session | null,
	// USER: User | null,
};

type Bindings = HttpBindings & {
	/* ... */
};

export type honoTypes = { Bindings: Bindings; Variables: HonoVariables };

const app = new Hono<honoTypes>();
app.use("/*", serveStatic({ root: "./static" }));

app.get("/hello", (c) => {
	return c.text("Hello Hono!");
});

const routes = app.basePath("/api").route("/user", userRoute);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port
});
