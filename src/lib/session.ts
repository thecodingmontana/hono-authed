import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase32, encodeHexLowerCase } from "@oslojs/encoding";
import { and, eq, sql } from "drizzle-orm";
import { db, tables } from "../database/db";
import type { User } from "../use-cases/types";

export async function validateSessionToken(
	token: string
): Promise<{ session: Session; user: User } | { session: null; user: null }> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));

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

	if (!result || result.length === 0) {
		return { session: null, user: null };
	}

	const row = result[0];

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
		created_at: row.created_at,
		updated_at: row.updated_at,
	};

	const now = Date.now();
	if (now >= session.expires_at.getTime()) {
		await db
			.delete(tables.session)
			.where(
				and(
					eq(tables.session.id, row.sessionId),
					eq(tables.session.user_id, row.user_id)
				)
			);
		return { session: null, user: null };
	}

	const fifteenDaysInMs = 1000 * 60 * 60 * 24 * 15;
	const thirtyDaysInMs = 1000 * 60 * 60 * 24 * 30;

	if (now >= session.expires_at.getTime() - fifteenDaysInMs) {
		const newExpiresAt = new Date(now + thirtyDaysInMs);
		await db
			.update(tables.session)
			.set({
				expires_at: sql`${Math.floor(newExpiresAt.getTime() / 1000)}`,
			})
			.where(eq(tables.session.id, row.sessionId));
		session.expires_at = newExpiresAt;
	}

	return { session, user };
}

export function generateSessionToken(): string {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	return encodeBase32(tokenBytes).toLowerCase();
}

export async function createSession(
	token: string,
	user_id: string
): Promise<Session> {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

	const session: Session = {
		id: sessionId,
		user_id,
		expires_at: expiresAt,
	};

	await db.insert(tables.session).values({
		id: sessionId,
		expires_at: sql`${Math.floor(expiresAt.getTime() / 1000)}`,
		user_id,
	});

	return session;
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(tables.session).where(eq(tables.session.id, sessionId));
}

export async function invalidateUserSessions(user_id: string): Promise<void> {
	await db.delete(tables.session).where(eq(tables.session.user_id, user_id));
}

export type Session = {
	id: string;
	expires_at: Date;
	user_id: string;
};
