import { Hono } from "hono";
import { driver as pool } from "../database/db";
import { redis } from "../lib/redis";
import authRoute from "./auth";
import usersRoute from "./users";

const routes = new Hono();

/*
 * Healthz Check Route
 */
routes.get("/healthz", async (c) => {
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
});

/*
 * Auth Routes
 */
routes.route("/auth", authRoute);

/*
 * Users Routes
 */
routes.route("/users", usersRoute);

export default routes;
