import { drizzle } from "drizzle-orm/libsql";

const db = drizzle({
	connection: {
		url: process.env.TURSO_AUTH_DATABASE_URL!,
		authToken: process.env.TURSO_AUTH_DATABASE_AUTH_TOKEN!
	}
});
