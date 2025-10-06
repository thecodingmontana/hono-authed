import type { Context, Next } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { type Session, validateSessionToken } from "../lib/session";
import type { User } from "../use-cases/user";

export type AuthContext = {
	Variables: {
		user: User | null;
		session: Session | null;
	};
};

export async function authMiddleware(c: Context<AuthContext>, next: Next) {
	const token = getCookie(c, "session");

	if (!token) {
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	const { session, user } = await validateSessionToken(token);

	if (session === null) {
		deleteCookie(c, "session");
		c.set("user", null);
		c.set("session", null);
		return next();
	}

	setCookie(c, "session", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		expires: session.expires_at,
	});

	c.set("user", user);
	c.set("session", session);
	return next();
}

export async function requireAuth(c: Context<AuthContext>, next: Next) {
	const user = c.get("user");

	if (!user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	await next();
}
