import { defineConfig } from "drizzle-kit";

export default defineConfig({
	out: "./src/db/migrations",
	schema: "./src/db/schema/*",
	dialect: "turso",
	dbCredentials: {
		url: process.env.TURSO_AUTH_DATABASE_URL!,
		authToken: process.env.TURSO_AUTH_DATABASE_AUTH_TOKEN!
	}
});
