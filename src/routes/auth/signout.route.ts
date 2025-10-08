import { createRoute } from "@hono/zod-openapi";
import { getCookie } from "hono/cookie";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createRouter } from "@/lib/create-app";
import {
	deleteSessionTokenCookie,
	invalidateSession,
	validateSessionToken,
} from "@/lib/session";
import { errorResponseSchema, successResponseSchema } from "@/zod-schema";

const router = createRouter();

router.openapi(
	createRoute({
		method: "post",
		path: "",
		tags: ["Auth"],
		responses: {
			[HttpStatusCodes.OK]: jsonContent(
				successResponseSchema,
				"Signout successful"
			),
			[HttpStatusCodes.UNAUTHORIZED]: jsonContent(
				errorResponseSchema,
				"No active session"
			),
			[HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
				errorResponseSchema,
				"Server error"
			),
		},
	}),
	async (c) => {
		try {
			const token = getCookie(c, "session");

			if (!token) {
				return c.json(
					{ error: "No active session found" },
					HttpStatusCodes.UNAUTHORIZED
				);
			}

			const { session } = await validateSessionToken(token);

			if (!session) {
				deleteSessionTokenCookie(c);
				return c.json(
					{ error: "Invalid or expired session" },
					HttpStatusCodes.UNAUTHORIZED
				);
			}

			await invalidateSession(session.id);
			deleteSessionTokenCookie(c);

			return c.json({ message: "Successfully signed out" }, HttpStatusCodes.OK);
		} catch {
			return c.json(
				{ error: "Failed to sign out. Please try again." },
				HttpStatusCodes.INTERNAL_SERVER_ERROR
			);
		}
	}
);

export default router;
