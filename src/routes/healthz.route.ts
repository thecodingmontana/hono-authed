import { createRoute, z } from "@hono/zod-openapi";
import { createRouter } from "@/lib/create-app";
import { driver as pool } from "../database/db";
import { redis } from "../lib/redis";

const router = createRouter();

/*
 * Healthz Check Route
 */
router.openapi(
	createRoute({
		method: "get",
		path: "/healthz",
		responses: {
			200: {
				content: {
					"application/json": {
						schema: z.object({
							status: z.string(),
							redis: z.string(),
							database: z.string(),
						}),
					},
				},
				description: "Hono Authed Healthz (Healthy)",
			},
			503: {
				content: {
					"application/json": {
						schema: z.object({
							status: z.string(),
							redis: z.string(),
							database: z.string(),
						}),
					},
				},
				description: "Hono Authed Healthz (Unhealthy)",
			},
		},
	}),
	async (c) => {
		try {
			await redis.ping();
			await pool`SELECT 1`;

			return c.json({
				status: "healthy",
				redis: "connected",
				database: "connected",
			});
		} catch (error) {
			return c.json(
				{
					status: "unhealthy",
					redis: error instanceof Error ? "disconnected" : "unknown",
					database: error instanceof Error ? "disconnected" : "unknown",
				},
				503
			);
		}
	}
);

export default router;
