import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createRouter } from "@/lib/create-app";
import { setSession } from "@/lib/session";
import {
	createSessionMetadata,
	deleteUniqueCode,
	getUserByEmail,
} from "@/use-cases/user";
import {
	clearUniqueCodeCache,
	getCachedUniqueCode,
	INVALID_CREDENTIALS,
	isWithinExpirationDate,
	verifyHashedPassword,
} from "@/utils/auth";
import { errorResponseSchema, successResponseSchema } from "@/zod-schema";
import { verifyCodeFormSchema } from "@/zod-schema/auth";

const router = createRouter();

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

			const headers = Object.fromEntries(c.req.raw.headers.entries());
			const metadata = await createSessionMetadata(headers);

			await Promise.all([
				deleteUniqueCode(uniqueCode.id),
				clearUniqueCodeCache(email, code),
			]);

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
