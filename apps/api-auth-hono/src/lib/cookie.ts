import { IS_PROD, SESSION_COOKIE_NAME } from "../constants";
import type { Context } from "hono";

export function setSessionTokenCookie(context: Context, token: string, expiresAt: Date): void {
    context.header("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        path: "/",
        secure: IS_PROD,
        // WARNING: use sameSite:strict unless it is redirect from oauth provider
        sameSite: "strict",
        expires: expiresAt
    }));
}

export function deleteSessionTokenCookie(context: Context): void {
    context.header("Set-Cookie", serializeCookie(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        path: "/",
        secure: IS_PROD,
        // WARNING: use sameSite:strict unless it is redirect from oauth provider
        sameSite: "strict",
        maxAge: 0
    }));
}


export interface CookieAttributes {
    secure?: boolean;
    path?: string;
    domain?: string;
    sameSite?: "lax" | "strict" | "none";
    httpOnly?: boolean;
    maxAge?: number;
    expires?: Date;
}

export function serializeCookie(name: string, value: string, attributes: CookieAttributes): string {
    const keyValueEntries: Array<[string, string] | [string]> = [];
    keyValueEntries.push([encodeURIComponent(name), encodeURIComponent(value)]);
    if (attributes?.domain !== undefined) {
        keyValueEntries.push(["Domain", attributes.domain]);
    }
    if (attributes?.expires !== undefined) {
        keyValueEntries.push(["Expires", attributes.expires.toUTCString()]);
    }
    if (attributes?.httpOnly) {
        keyValueEntries.push(["HttpOnly"]);
    }
    if (attributes?.maxAge !== undefined) {
        keyValueEntries.push(["Max-Age", attributes.maxAge.toString()]);
    }
    if (attributes?.path !== undefined) {
        keyValueEntries.push(["Path", attributes.path]);
    }
    if (attributes?.sameSite === "lax") {
        keyValueEntries.push(["SameSite", "Lax"]);
    }
    if (attributes?.sameSite === "none") {
        keyValueEntries.push(["SameSite", "None"]);
    }
    if (attributes?.sameSite === "strict") {
        keyValueEntries.push(["SameSite", "Strict"]);
    }
    if (attributes?.secure) {
        keyValueEntries.push(["Secure"]);
    }
    return keyValueEntries.map((pair) => pair.join("=")).join("; ");
}