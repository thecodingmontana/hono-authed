/** biome-ignore-all lint/suspicious/noConsole: ignore all*/

import { createMiddleware } from "hono/factory";
import { redis } from "../lib/redis";

export const rateLimiter = (options: {
	windowMs: number;
	max: number;
	keyPrefix?: string;
}) =>
	createMiddleware(async (c, next) => {
		const ip =
			c.req.header("x-forwarded-for") || c.req.header("x-real-ip") || "unknown";
		const key = `${options.keyPrefix || "ratelimit"}:${ip}`;

		try {
			const current = await redis.incr(key);

			if (current === 1) {
				await redis.expire(key, Math.ceil(options.windowMs / 1000));
			}

			if (current > options.max) {
				const ttl = await redis.ttl(key);
				return c.json({ error: "Too many requests", retryAfter: ttl }, 429);
			}

			c.header("X-RateLimit-Limit", options.max.toString());
			c.header(
				"X-RateLimit-Remaining",
				Math.max(0, options.max - current).toString()
			);

			await next();
		} catch (error) {
			console.error("Rate limiter error:", error);
			await next();
		}
	});
