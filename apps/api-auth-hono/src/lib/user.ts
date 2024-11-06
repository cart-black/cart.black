// import { db } from "./db";
import { and, eq, sql } from "drizzle-orm";
import { drizzleDb } from "../db/drizzle";
import { passkeyCredentialTable, securityKeyCredentialTable, totpCredentialTable, userTable } from "../db/schema/userSchema";
import { decryptToString, encryptString } from "./encryption";
import { hashPassword } from "./password";
import { generateRandomRecoveryCode } from "./utils";

export function verifyUsernameInput(username: string): boolean {
	return username.length > 3 && username.length < 32 && username.trim() === username;
}

export async function createUser(email: string, username: string, password: string): Promise<User> {
	const passwordHash = await hashPassword(password);
	const recoveryCode = generateRandomRecoveryCode();
	const encryptedRecoveryCode = encryptString(recoveryCode);
	const row = await drizzleDb.insert(userTable).values({
		email,
		username,
		passwordHash,
		recoveryCode: encryptedRecoveryCode
	}).returning({ id: userTable.id });
	if (row === null) {
		throw new Error("Unexpected error");
	}
	const user: User = {
		id: row[0].id,
		username,
		email,
		emailVerified: false,
		registeredTOTP: false,
		registeredPasskey: false,
		registeredSecurityKey: false,
		registered2FA: false
	};
	return user;
}

export async function updateUserPassword(userId: number, password: string): Promise<void> {
	const passwordHash = await hashPassword(password);
	await drizzleDb.update(userTable).set({ passwordHash }).where(eq(userTable.id, userId));
}

export async function updateUserEmailAndSetEmailAsVerified(userId: number, email: string): Promise<void> {
	await drizzleDb.update(userTable).set({ email, emailVerified: true }).where(eq(userTable.id, userId));
}

export async function setUserAsEmailVerifiedIfEmailMatches(userId: number, email: string): Promise<boolean> {
	const result = await drizzleDb.update(userTable).set({ emailVerified: true }).where(and(eq(userTable.id, userId), eq(userTable.email, email)));
	return result.rowsAffected > 0;
}

export async function getUserPasswordHash(userId: number): Promise<string> {
	const row = await drizzleDb.select({ passwordHash: userTable.passwordHash }).from(userTable).where(eq(userTable.id, userId));
	if (row.length === 0) {
		throw new Error("Invalid user ID");
	}
	return row[0].passwordHash;
}

export async function getUserRecoverCode(userId: number): Promise<string> {
	// const row = db.queryOne("SELECT recovery_code FROM user WHERE id = ?", [userId]);
	// if (row === null) {
	// 	throw new Error("Invalid user ID");
	// }
	// return decryptToString(row.bytes(0));
	const row = await drizzleDb.select({ recoveryCode: userTable.recoveryCode }).from(userTable).where(eq(userTable.id, userId));
	if (row.length === 0) {
		throw new Error("Invalid user ID");
	}
	return decryptToString(row[0].recoveryCode as Uint8Array);
}

export async function resetUserRecoveryCode(userId: number): Promise<string> {
	// const recoveryCode = generateRandomRecoveryCode();
	// const encrypted = encryptString(recoveryCode);
	// db.execute("UPDATE user SET recovery_code = ? WHERE id = ?", [encrypted, userId]);
	// return recoveryCode;
	const recoveryCode = generateRandomRecoveryCode();
	const encrypted = encryptString(recoveryCode);
	await drizzleDb.update(userTable).set({ recoveryCode: encrypted }).where(eq(userTable.id, userId));
	return recoveryCode;
}

export async function getUserFromEmail(email: string): Promise<User | null> {
	// const row = db.queryOne(
	//  `SELECT user.id, user.email, user.username, user.email_verified, IIF(totp_credential.id IS NOT NULL, 1, 0), IIF(passkey_credential.id IS NOT NULL, 1, 0), IIF(security_key_credential.id IS NOT NULL, 1, 0) FROM user
	//     LEFT JOIN totp_credential ON user.id = totp_credential.user_id
	//     LEFT JOIN passkey_credential ON user.id = passkey_credential.user_id
	//     LEFT JOIN security_key_credential ON user.id = security_key_credential.user_id
	//     WHERE user.email = ?`,
	//  [email]
	// );

	const result = await drizzleDb
		.select({
			id: userTable.id,
			email: userTable.email,
			username: userTable.username,
			emailVerified: userTable.emailVerified,
			hasTOTP: sql<number>`IIF(${totpCredentialTable.id} IS NOT NULL, 1, 0)`,
			hasPasskey: sql<number>`IIF(${passkeyCredentialTable.id} IS NOT NULL, 1, 0)`,
			hasSecurityKey: sql<number>`IIF(${securityKeyCredentialTable.id} IS NOT NULL, 1, 0)`
		})
		.from(userTable)
		.leftJoin(totpCredentialTable, eq(userTable.id, totpCredentialTable.userId))
		.leftJoin(passkeyCredentialTable, eq(userTable.id, passkeyCredentialTable.userId))
		.leftJoin(securityKeyCredentialTable, eq(userTable.id, securityKeyCredentialTable.userId))
		.where(eq(userTable.email, email))
		.get();

	if (!result) {
		return null;
	}
	const user: User = {
		id: result.id,
		email: result.email,
		username: result.username,
		emailVerified: result.emailVerified,
		registeredTOTP: result.hasTOTP === 1,
		registeredPasskey: result.hasPasskey === 1,
		registeredSecurityKey: result.hasSecurityKey === 1,
		registered2FA: false
	};
	if (user.registeredPasskey || user.registeredSecurityKey || user.registeredTOTP) {
		user.registered2FA = true;
	}
	return user;
}

export interface User {
	id: number;
	email: string;
	username: string;
	emailVerified: boolean;
	registeredTOTP: boolean;
	registeredSecurityKey: boolean;
	registeredPasskey: boolean;
	registered2FA: boolean;
}
