import { drizzleDb } from "../db/drizzle";
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from "@oslojs/encoding";
import { userTable, sessionTable, totpCredentialTable, passkeyCredentialTable, securityKeyCredentialTable } from "../db/schema/userSchema";
import { sha256 } from "@oslojs/crypto/sha2";
import { eq, sql } from "drizzle-orm";

import type { User } from "./user";

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

	const result = await drizzleDb
		.select({
			sessionId: sessionTable.id,
			userId: sessionTable.userId,
			expiresAt: sessionTable.expiresAt,
			twoFactorVerified: sessionTable.twoFactorVerified,
			userId2: userTable.id,
			email: userTable.email,
			username: userTable.username,
			emailVerified: userTable.emailVerified,
			hasTOTP: sql<number>`IIF(${totpCredentialTable.id} IS NOT NULL, 1, 0)`,
			hasPasskey: sql<number>`IIF(${passkeyCredentialTable.id} IS NOT NULL, 1, 0)`,
			hasSecurityKey: sql<number>`IIF(${securityKeyCredentialTable.id} IS NOT NULL, 1, 0)`
		})
		.from(sessionTable)
		.innerJoin(userTable, eq(sessionTable.userId, userTable.id))
		.leftJoin(totpCredentialTable, eq(sessionTable.userId, totpCredentialTable.userId))
		.leftJoin(passkeyCredentialTable, eq(userTable.id, passkeyCredentialTable.userId))
		.leftJoin(securityKeyCredentialTable, eq(userTable.id, securityKeyCredentialTable.userId))
		.where(eq(sessionTable.id, sessionId))
		.get();

	if (!result) {
		return { session: null, user: null };
	}

	const session: Session = {
		id: result.sessionId,
		userId: result.userId,
		expiresAt: new Date(result.expiresAt * 1000),
		twoFactorVerified: result.twoFactorVerified
	};

	const user: User = {
		id: result.userId2,
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

	if (Date.now() >= session.expiresAt.getTime()) {
		drizzleDb.delete(sessionTable).where(eq(sessionTable.id, sessionId)).run();
		return { session: null, user: null };
	}

	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		drizzleDb.update(sessionTable)
			.set({ expiresAt: Math.floor(session.expiresAt.getTime() / 1000) })
			.where(eq(sessionTable.id, sessionId))
			.run();
	}

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await drizzleDb.delete(sessionTable).where(eq(sessionTable.id, sessionId)).run();
}

export async function invalidateUserSessions(userId: number): Promise<void> {
	await drizzleDb.delete(sessionTable).where(eq(sessionTable.userId, userId)).run();
}


export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = encodeBase32LowerCaseNoPadding(tokenBytes);
	return token;
}

export function createSession(token: string, userId: number, flags: SessionFlags): Session {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
		twoFactorVerified: flags.twoFactorVerified
	};

	drizzleDb.insert(sessionTable).values({
		id: session.id,
		userId: session.userId,
		expiresAt: Math.floor(session.expiresAt.getTime() / 1000),
		twoFactorVerified: session.twoFactorVerified
	}).run();

	return session;
}

export function setSessionAs2FAVerified(sessionId: string): void {
	drizzleDb.update(sessionTable)
		.set({ twoFactorVerified: true })
		.where(eq(sessionTable.id, sessionId))
		.run();
}

export interface SessionFlags {
	twoFactorVerified: boolean;
}

export interface Session extends SessionFlags {
	id: string;
	expiresAt: Date;
	userId: number;
}

type SessionValidationResult = { session: Session; user: User } | { session: null; user: null };
