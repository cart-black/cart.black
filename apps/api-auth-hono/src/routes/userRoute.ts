import { Hono } from "hono";
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import type { honoTypes } from "../index";
import { verifyPasswordStrength } from "../lib/password";
import { createUser, verifyUsernameInput } from "../lib/user";
import { checkEmailAvailability } from "../lib/email";
// import { createEmailVerificationRequest, sendVerificationEmail, setEmailVerificationRequestCookie } from "../lib/email-verification";
// import { createSession, generateSessionToken, setSessionTokenCookie } from "../lib/session";

export const userRoute = new Hono<honoTypes>()
    .post(
        "/signup",
        zValidator('form', z.object({
            email: z.string().email().min(1, { message: "email is required" }),
            username: z.string().min(1, { message: "username is required" }),
            password: z.string().min(1, { message: "password is required" }),
        })),
        async (c) => {
            const { email, username, password } = c.req.valid('form');
            const lowercaseEmail = email.toLowerCase();

            const emailAvailable = await checkEmailAvailability(lowercaseEmail);
            if (!emailAvailable) {
                return c.text("Email is already used", 400);
            }

            if (!verifyUsernameInput(username)) {
                return c.text("Invalid username", 400);
            }

            const strongPassword = await verifyPasswordStrength(password);
            if (!strongPassword) {
                return c.text("Weak password", 400);
            }

            // const user = await createUser(lowercaseEmail, username, password);
            // const emailVerificationRequest = createEmailVerificationRequest(user.id, user.email);
            // sendVerificationEmail(emailVerificationRequest.email, emailVerificationRequest.code);
            // setEmailVerificationRequestCookie(c, emailVerificationRequest);

            // const sessionFlags = {
            //     twoFactorVerified: false
            // };
            // const sessionToken = generateSessionToken();
            // const session = createSession(sessionToken, user.id, sessionFlags);
            // setSessionTokenCookie(c, sessionToken, session.expiresAt);

            return c.newResponse(null, 204);
        });
