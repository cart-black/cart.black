import { drizzleDb } from "../db/drizzle";
import { userTable } from "../db/schema/userSchema";
import { count, eq } from "drizzle-orm";

export async function checkEmailAvailability(email: string): Promise<boolean> {
    const result = await drizzleDb
        .select({ count: count() })
        .from(userTable)
        .where(eq(userTable.email, email))
        .get();

    if (result === undefined) {
        throw new Error("Failed to check email availability");
    }

    return result.count === 0;
}
