import { createRouter } from "@/lib/create-app";
import { requireAuth } from "../middlewares/auth";
import { getAllUsersUseCase } from "../use-cases/user";

const usersRoute = createRouter();

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
