import { generateRandomString, type RandomReader } from "@oslojs/crypto/random";
import { encodeBase32UpperCaseNoPadding } from "@oslojs/encoding";
import { Google } from "arctic";
import argon2 from "argon2";
import type { Session, User } from "../use-cases/types";

export type TimeSpanUnit = "ms" | "s" | "m" | "h" | "d" | "w";

export class TimeSpan {
	value: number;
	unit: TimeSpanUnit;

	constructor(value: number, unit: TimeSpanUnit) {
		this.value = value;
		this.unit = unit;
	}

	milliseconds(): number {
		const unitMultipliers: Record<TimeSpanUnit, number> = {
			ms: 1,
			s: 1000,
			m: 60_000,
			h: 3_600_000,
			d: 86_400_000,
			w: 604_800_000,
		};
		return this.value * unitMultipliers[this.unit];
	}

	seconds(): number {
		return this.milliseconds() / 1000;
	}

	transform(x: number): TimeSpan {
		return new TimeSpan(this.value * x, this.unit);
	}
}

export function isWithinExpirationDate(date: Date): boolean {
	return date.getTime() > Date.now();
}

export function createDate(timeSpan: TimeSpan): Date {
	return new Date(Date.now() + timeSpan.milliseconds());
}

export function generateRandomOTP(): string {
	const bytes = new Uint8Array(5);
	crypto.getRandomValues(bytes);
	const code = encodeBase32UpperCaseNoPadding(bytes);
	return code;
}

export function generateUniqueCode(length: number): string {
	const random: RandomReader = {
		read(bytes) {
			crypto.getRandomValues(bytes);
		},
	};

	const alphabet =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";

	return generateRandomString(random, alphabet, length);
}

export const googleAuth = new Google(
	process.env.GOOGLE_CLIENT_ID as string,
	process.env.GOOGLE_CLIENT_SECRET as string,
	`http://localhost:${process.env.SERVER_PORt}/api/v1/auth/signin/oauth/google/callback`
);

export async function hashPassword(password: string) {
	const hash = await argon2.hash(password);
	return hash;
}

export async function verifyHashedPassword(
	hashedPassword: string,
	password: string
) {
	const isCorrectPassword = await argon2.verify(hashedPassword, password);
	return isCorrectPassword;
}

export type SessionValidationResult =
	| { session: Session; user: User }
	| { session: null; user: null };
