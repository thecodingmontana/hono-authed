// signin-route.ts - Optimized with Redis caching
/** biome-ignore-all lint/suspicious/noConsole: ingore all */
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createRouter } from "@/lib/create-app";
import { redis } from "@/lib/redis";
import { setSession } from "@/lib/session";
import {
	checkUniqueCode,
	createSessionMetadata,
	deleteUniqueCode,
	getUserByEmail,
} from "@/use-cases/user";
import { isWithinExpirationDate, verifyHashedPassword } from "@/utils/auth";
import { errorResponseSchema, successResponseSchema } from "@/zod-schema";
import { verifyCodeFormSchema } from "@/zod-schema/auth";

const router = createRouter();

const INVALID_CREDENTIALS = "Invalid credentials provided";
const UNIQUE_CODE_TTL = 600; // 10 minutes

// Cache unique codes in Redis to reduce DB lookups
async function getCachedUniqueCode(email: string, code: string) {
	const cacheKey = `unique_code:${email}:${code}`;

	try {
		const cached = await redis.get(cacheKey);
		if (cached) {
			return JSON.parse(cached);
		}
	} catch (error) {
		console.error("Redis error fetching unique code:", error);
	}

	// Cache miss - fetch from DB
	const uniqueCode = await checkUniqueCode(email, code.trim());

	if (uniqueCode) {
		try {
			// Cache for 10 minutes or until expiration, whichever is shorter
			const ttl = Math.min(
				UNIQUE_CODE_TTL,
				Math.floor((uniqueCode.expires_at.getTime() - Date.now()) / 1000)
			);
			if (ttl > 0) {
				await redis.setex(cacheKey, ttl, JSON.stringify(uniqueCode));
			}
		} catch (error) {
			console.error("Failed to cache unique code:", error);
		}
	}

	return uniqueCode;
}

// Clear unique code from cache
async function clearUniqueCodeCache(email: string, code: string) {
	const cacheKey = `unique_code:${email}:${code}`;
	try {
		await redis.del(cacheKey);
	} catch (error) {
		console.error("Failed to clear unique code cache:", error);
	}
}

router.openapi(
	createRoute({
		method: "post",
		path: "",
		tags: ["Auth"],
		request: {
			body: jsonContent(verifyCodeFormSchema, "Sign in credentials"),
		},
		responses: {
			[HttpStatusCodes.OK]: jsonContent(
				successResponseSchema,
				"Sign in successful"
			),
			[HttpStatusCodes.BAD_REQUEST]: jsonContent(
				errorResponseSchema,
				"Bad request"
			),
			[HttpStatusCodes.UNAUTHORIZED]: jsonContent(
				errorResponseSchema,
				"Invalid credentials"
			),
			[HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
				errorResponseSchema,
				"Server error"
			),
		},
	}),
	async (c) => {
		try {
			const { code, email, password } = c.req.valid("json");

			// Fetch user and code in parallel
			const [userResult, codeResult] = await Promise.allSettled([
				getUserByEmail(email),
				getCachedUniqueCode(email, code),
			]);

			const user = userResult.status === "fulfilled" ? userResult.value : null;
			const uniqueCode =
				codeResult.status === "fulfilled" ? codeResult.value : null;

			if (!(user?.password && uniqueCode)) {
				return c.json(
					{ error: INVALID_CREDENTIALS },
					HttpStatusCodes.UNAUTHORIZED
				);
			}

			// Check code expiration
			if (!isWithinExpirationDate(uniqueCode.expires_at)) {
				try {
					await Promise.all([
						deleteUniqueCode(uniqueCode.id),
						clearUniqueCodeCache(email, code),
					]);
				} catch {
					return c.json(
						{ error: "Failed to process expired code. Please try again." },
						HttpStatusCodes.INTERNAL_SERVER_ERROR
					);
				}
				return c.json({ error: "Code expired" }, HttpStatusCodes.BAD_REQUEST);
			}

			// Verify password
			const isPasswordValid = await verifyHashedPassword(
				user.password,
				password
			);
			if (!isPasswordValid) {
				return c.json(
					{ error: INVALID_CREDENTIALS },
					HttpStatusCodes.UNAUTHORIZED
				);
			}

			// Clean up code and create session in parallel
			const headers = Object.fromEntries(c.req.raw.headers.entries());
			const metadata = await createSessionMetadata(headers);

			await Promise.all([
				deleteUniqueCode(uniqueCode.id),
				clearUniqueCodeCache(email, code),
			]);

			// Create session and cache user data
			await setSession(c, user.id, metadata, user);

			return c.json(
				{ message: "Successfully signed in! Welcome back." },
				HttpStatusCodes.OK
			);
		} catch {
			return c.json(
				{ error: "Authentication failed. Please try again." },
				HttpStatusCodes.INTERNAL_SERVER_ERROR
			);
		}
	}
);

export default router;
