import { drizzle } from "drizzle-orm/libsql";
import * as userSchema from "./schema/userSchema";

export const drizzleDb = drizzle({
	connection: {
		url: process.env.TURSO_AUTH_DATABASE_URL!,
		authToken: process.env.TURSO_AUTH_DATABASE_AUTH_TOKEN!
	},
	schema: {
		...userSchema
	}
});
