import type { InferSelectModel } from "drizzle-orm";
import { sqliteTable, integer, text, blob } from "drizzle-orm/sqlite-core";

export const userTable = sqliteTable("user", {
	id: integer("id").primaryKey(),
	email: text("email").notNull().unique(),
	username: text("username").notNull(),
	passwordHash: text("password_hash").notNull(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	recoveryCode: blob("recovery_code").notNull()
});

export const sessionTable = sqliteTable("session", {
	id: text("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	expiresAt: integer("expires_at").notNull(),
	twoFactorVerified: integer("two_factor_verified", { mode: "boolean" }).notNull().default(false)
});

export const emailVerificationRequestTable = sqliteTable("email_verification_request", {
	id: text("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	email: text("email").notNull(),
	code: text("code").notNull(),
	expiresAt: integer("expires_at").notNull()
});

export const passwordResetSessionTable = sqliteTable("password_reset_session", {
	id: text("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	email: text("email").notNull(),
	code: text("code").notNull(),
	expiresAt: integer("expires_at").notNull(),
	emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
	twoFactorVerified: integer("two_factor_verified", { mode: "boolean" }).notNull().default(false)
});

export const totpCredentialTable = sqliteTable("totp_credential", {
	id: integer("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.unique()
		.references(() => userTable.id),
	key: blob("key").notNull()
});

export const passkeyCredentialTable = sqliteTable("passkey_credential", {
	id: blob("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	name: text("name").notNull(),
	algorithm: integer("algorithm").notNull(),
	publicKey: blob("public_key").notNull()
});

export const securityKeyCredentialTable = sqliteTable("security_key_credential", {
	id: blob("id").primaryKey(),
	userId: integer("user_id")
		.notNull()
		.references(() => userTable.id),
	name: text("name").notNull(),
	algorithm: integer("algorithm").notNull(),
	publicKey: blob("public_key").notNull()
});

export type User = InferSelectModel<typeof userTable>;
export type Session = InferSelectModel<typeof sessionTable>;
export type EmailVerificationRequest = InferSelectModel<typeof emailVerificationRequestTable>;
export type PasswordResetSession = InferSelectModel<typeof passwordResetSessionTable>;
export type TOTPCredential = InferSelectModel<typeof totpCredentialTable>;
export type PasskeyCredential = InferSelectModel<typeof passkeyCredentialTable>;
export type SecurityKeyCredential = InferSelectModel<typeof securityKeyCredentialTable>;
