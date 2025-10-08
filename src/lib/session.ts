/** biome-ignore-all lint/style/noParameterProperties: ingore all */
/** biome-ignore-all lint/complexity/noVoid: ingore all */

import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { eq, sql } from "drizzle-orm";
import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import { env } from "@/env";
import { db, tables } from "../database/db";
import type { SessionMetadata, User, UserId } from "../use-cases/types";
import { redis } from "./redis";

const SESSION_REFRESH_INTERVAL_MS = 1000 * 60 * 60 * 24 * 15; // 15 days
const SESSION_MAX_DURATION_MS = SESSION_REFRESH_INTERVAL_MS * 2; // 30 days
const REDIS_SESSION_TTL = 86_400; // 24 hours
const REDIS_USER_TTL = 3600; // 1 hour
const SESSION_COOKIE_NAME = "session";

export type Session = {
	id: string;
	user_id: string;
	expires_at: Date;
};

type CachedSessionData = {
	session: Session;
	user: User;
};

class LRUCache<T> {
	private readonly cache = new Map<string, { value: T; timestamp: number }>();

	constructor(
		private readonly maxSize = 1000,
		private readonly ttl = 60_000
	) {}

	get(key: string): T | null {
		const item = this.cache.get(key);
		if (!item) {
			return null;
		}
		if (Date.now() - item.timestamp > this.ttl) {
			this.cache.delete(key);
			return null;
		}
		this.cache.delete(key);
		this.cache.set(key, item);
		return item.value;
	}

	set(key: string, value: T): void {
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value as string | undefined;
			if (firstKey) {
				this.cache.delete(firstKey);
			}
		}
		this.cache.set(key, { value, timestamp: Date.now() });
	}

	delete(key: string): void {
		this.cache.delete(key);
	}

	clear(): void {
		this.cache.clear();
	}
}

const memoryCache = new LRUCache<CachedSessionData>(1000, 60_000);

function packSession(session: Session, user: User): string {
	return JSON.stringify({
		s: {
			i: session.id,
			u: session.user_id,
			e: session.expires_at.getTime(),
		},
		u: {
			i: user.id,
			e: user.email,
			n: user.username,
			a: user.avatar,
			v: user.email_verified,
			f: user.registered_2fa,
			c: user.created_at,
			p: user.updated_at,
		},
	});
}

function unpackSession(data: string): CachedSessionData {
	const parsed = JSON.parse(data) as {
		s: { i: string; u: string; e: number };
		u: {
			i: string;
			e: string;
			n: string;
			a: string;
			v: boolean;
			f: boolean;
			c: string;
			p: string;
		};
	};
	return {
		session: {
			id: parsed.s.i,
			user_id: parsed.s.u,
			expires_at: new Date(parsed.s.e),
		},
		user: {
			id: parsed.u.i,
			email: parsed.u.e,
			username: parsed.u.n,
			avatar: parsed.u.a,
			email_verified: parsed.u.v,
			registered_2fa: parsed.u.f,
			created_at: new Date(parsed.u.c),
			updated_at: new Date(parsed.u.p),
		},
	};
}

// Helper function to check if value is a valid Redis string response
// Upstash Redis returns null for missing keys, but can also return other types
function isValidRedisString(value: unknown): value is string {
	return (
		value !== null &&
		value !== undefined &&
		typeof value === "string" &&
		value.length > 0
	);
}

async function cleanupExpiredSession(sessionId: string): Promise<void> {
	try {
		await Promise.all([
			redis.del(`s:${sessionId}`),
			db.delete(tables.session).where(eq(tables.session.id, sessionId)),
		]);
	} catch {
		// intentionally ignored
	}
}

async function refreshSessionAsync(
	sessionId: string,
	session: Session,
	user: User,
	now: number
): Promise<void> {
	try {
		const newExpiresAt = new Date(now + SESSION_MAX_DURATION_MS);
		const updatedSession: Session = { ...session, expires_at: newExpiresAt };
		await Promise.all([
			db
				.update(tables.session)
				.set({ expires_at: sql`${Math.floor(newExpiresAt.getTime() / 1000)}` })
				.where(eq(tables.session.id, sessionId)),
			redis.setex(
				`s:${sessionId}`,
				REDIS_SESSION_TTL,
				packSession(updatedSession, user)
			),
		]);
		memoryCache.set(sessionId, { session: updatedSession, user });
	} catch {
		// intentionally ignored
	}
}

async function fetchFromDatabase(
	sessionId: string,
	now: number
): Promise<{ session: Session | null; user: User | null }> {
	const result = await db
		.select({
			sessionId: tables.session.id,
			user_id: tables.session.user_id,
			expires_at: tables.session.expires_at,
			email: tables.user.email,
			username: tables.user.username,
			avatar: tables.user.avatar,
			registered_2fa: tables.user.registered_2fa,
			email_verified: tables.user.email_verified,
			created_at: tables.user.created_at,
			updated_at: tables.user.updated_at,
		})
		.from(tables.session)
		.innerJoin(tables.user, eq(tables.session.user_id, tables.user.id))
		.where(eq(tables.session.id, sessionId));

	const row = result?.[0];
	if (!row) {
		return { session: null, user: null };
	}

	const session: Session = {
		id: row.sessionId,
		user_id: row.user_id,
		expires_at: new Date(Number(row.expires_at) * 1000),
	};

	const user: User = {
		id: row.user_id,
		email: row.email,
		username: row.username,
		avatar: row.avatar,
		email_verified: row.email_verified,
		registered_2fa: row.registered_2fa,
		created_at: new Date(row.created_at),
		updated_at: new Date(row.updated_at),
	};

	if (now >= session.expires_at.getTime()) {
		await db.delete(tables.session).where(eq(tables.session.id, sessionId));
		return { session: null, user: null };
	}

	if (now >= session.expires_at.getTime() - SESSION_REFRESH_INTERVAL_MS) {
		const newExpiresAt = new Date(now + SESSION_MAX_DURATION_MS);
		session.expires_at = newExpiresAt;
		void db
			.update(tables.session)
			.set({ expires_at: sql`${Math.floor(newExpiresAt.getTime() / 1000)}` })
			.where(eq(tables.session.id, sessionId))
			.catch(() => null);
	}

	const packed = packSession(session, user);
	void Promise.all([
		redis.setex(`s:${sessionId}`, REDIS_SESSION_TTL, packed),
		redis.setex(`u:${user.id}`, REDIS_USER_TTL, JSON.stringify(user)),
	]).catch(() => null);

	memoryCache.set(sessionId, { session, user });
	return { session, user };
}

export async function validateSessionToken(
	token: string
): Promise<{ session: Session | null; user: User | null }> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const now = Date.now();
	const cached = memoryCache.get(sessionId);
	if (cached) {
		const { session, user } = cached;
		if (now >= session.expires_at.getTime()) {
			memoryCache.delete(sessionId);
			void cleanupExpiredSession(sessionId);
			return { session: null, user: null };
		}
		if (now >= session.expires_at.getTime() - SESSION_REFRESH_INTERVAL_MS) {
			void refreshSessionAsync(sessionId, session, user, now);
		}
		return { session, user };
	}

	try {
		const redisData = await redis.get(`s:${sessionId}`);
		if (isValidRedisString(redisData)) {
			const { session, user } = unpackSession(redisData);
			if (now >= session.expires_at.getTime()) {
				memoryCache.delete(sessionId);
				void cleanupExpiredSession(sessionId);
				return { session: null, user: null };
			}
			memoryCache.set(sessionId, { session, user });
			if (now >= session.expires_at.getTime() - SESSION_REFRESH_INTERVAL_MS) {
				void refreshSessionAsync(sessionId, session, user, now);
			}
			return { session, user };
		}
	} catch {
		// ignored
	}
	return fetchFromDatabase(sessionId, now);
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	globalThis.crypto.getRandomValues(tokenBytes);
	return encodeBase32(tokenBytes).toLowerCase();
}

export async function createSession(
	token: string,
	userId: string,
	metadata: SessionMetadata
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const expiresAt = new Date(Date.now() + SESSION_MAX_DURATION_MS);
	const session: Session = {
		id: sessionId,
		user_id: userId,
		expires_at: expiresAt,
	};

	await db.insert(tables.session).values({
		id: sessionId,
		user_id: userId,
		expires_at: expiresAt,
		location: metadata.location,
		browser: metadata.browser,
		device: metadata.device,
		os: metadata.os,
	});
	return session;
}

export function setSessionTokenCookie(
	c: Context,
	token: string,
	expiresAt: Date
): void {
	setCookie(c, SESSION_COOKIE_NAME, token, {
		httpOnly: true,
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		expires: expiresAt,
		path: "/",
	});
}

export function deleteSessionTokenCookie(c: Context): void {
	setCookie(c, SESSION_COOKIE_NAME, "", {
		httpOnly: true,
		sameSite: "lax",
		secure: env.NODE_ENV === "production",
		maxAge: 0,
		path: "/",
	});
}

export async function setSession(
	c: Context,
	userId: UserId,
	metadata: SessionMetadata,
	user: User
): Promise<void> {
	const token = generateSessionToken();
	const session = await createSession(token, userId, metadata);
	const packed = packSession(session, user);
	await Promise.all([
		redis.setex(`s:${session.id}`, REDIS_SESSION_TTL, packed),
		redis.setex(`u:${userId}`, REDIS_USER_TTL, JSON.stringify(user)),
	]);
	memoryCache.set(session.id, { session, user });
	setSessionTokenCookie(c, token, session.expires_at);
}

export async function invalidateSession(sessionId: string): Promise<void> {
	memoryCache.delete(sessionId);
	await Promise.all([
		db.delete(tables.session).where(eq(tables.session.id, sessionId)),
		redis.del(`s:${sessionId}`),
	]);
}

export async function invalidateUserSessions(userId: string): Promise<void> {
	const sessions = await db
		.select({ id: tables.session.id })
		.from(tables.session)
		.where(eq(tables.session.user_id, userId));
	for (const { id } of sessions) {
		memoryCache.delete(id);
	}
	await Promise.all([
		db.delete(tables.session).where(eq(tables.session.user_id, userId)),
		...sessions.map(({ id }) => redis.del(`s:${id}`)),
		redis.del(`u:${userId}`),
	]);
}

export function warmSessionCache(
	sessionId: string,
	session: Session,
	user: User
): void {
	memoryCache.set(sessionId, { session, user });
}
