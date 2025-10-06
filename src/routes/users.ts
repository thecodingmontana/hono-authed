import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { getAllUsersUseCase } from "../use-cases/user";

const usersRoute = new Hono();

usersRoute.get("/all", requireAuth, async (c) => {
	const users = await getAllUsersUseCase();

	return c.json({
		message: "Users retrieved successfully",
		data: {
			users,
		},
	});
});

export default usersRoute;
