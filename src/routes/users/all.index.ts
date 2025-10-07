import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createRouter } from "@/lib/create-app";
import { getAllUsersUseCase } from "@/use-cases/user";
import { errorResponseSchema, UserSchema } from "@/zod-schema";

const router = createRouter();

/*
 * Retrieve all users Route
 */

router.openapi(
	createRoute({
		method: "get",
		path: "",
		tags: ["Users"],
		responses: {
			[HttpStatusCodes.OK]: jsonContent(
				z.object({
					message: z.string(),
					data: z.array(UserSchema),
				}),
				"Successfully retrieved all users"
			),
			[HttpStatusCodes.UNAUTHORIZED]: jsonContent(
				errorResponseSchema,
				"Unauthorized"
			),
			[HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
				errorResponseSchema,
				"Server error"
			),
		},
	}),
	async (c) => {
		try {
			const users = await getAllUsersUseCase();

			return c.json(
				{
					message: "Users retrieved successfully",
					data: users,
				},
				HttpStatusCodes.OK
			);
		} catch {
			return c.json(
				{
					error: "Failed to retrieve all users",
				},
				HttpStatusCodes.INTERNAL_SERVER_ERROR
			);
		}
	}
);

export default router;
