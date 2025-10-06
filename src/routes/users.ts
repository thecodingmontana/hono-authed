import { desc } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../database/db";
import { requireAuth } from "../middleware/auth";

const usersRoute = new Hono();

usersRoute.get("/all", requireAuth, async (c) => {
	const users = await db.query.user.findMany({
		orderBy: (table) => desc(table.created_at),
	});

	return c.json({
		message: "Users retrieved successfully",
		data: {
			users,
		},
	});
});

export default usersRoute;
