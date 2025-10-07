import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createRouter } from "@/lib/create-app";
import { sendEmailVerificationMail } from "@/lib/mails/email-verification";
import {
	createEmailVerificationCode,
	getEmailVerificationCode,
	getUserByEmail,
	updateEmailVerificationCode,
} from "@/use-cases/user";
import { createDate, generateUniqueCode, TimeSpan } from "@/utils/auth";
import { errorResponseSchema, successResponseSchema } from "@/zod-schema";
import { formSchema } from "@/zod-schema/auth";

const router = createRouter();

/*
 * Signup Send Verification Code Route
 */

router.openapi(
	createRoute({
		method: "post",
		tags: ["Auth"],
		path: "/",
		request: {
			body: jsonContent(
				formSchema,
				"Sign up send verification code credentials"
			),
		},
		responses: {
			[HttpStatusCodes.OK]: jsonContent(
				successResponseSchema,
				"Verification code sent successfully"
			),
			[HttpStatusCodes.BAD_REQUEST]: jsonContent(
				errorResponseSchema,
				"Bad request"
			),
			[HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonContent(
				errorResponseSchema,
				"Server error"
			),
		},
	}),
	async (c) => {
		try {
			const { email } = c.req.valid("json");

			const [userResult, codeResult] = await Promise.allSettled([
				getUserByEmail(email),
				getEmailVerificationCode(email),
			]);

			const user = userResult.status === "fulfilled" ? userResult.value : null;
			const existingCode =
				codeResult.status === "fulfilled" ? codeResult.value : null;

			if (user) {
				return c.json(
					{ error: "Email already in use!" },
					HttpStatusCodes.BAD_REQUEST
				);
			}

			const code = generateUniqueCode(6);
			const expiresAt = createDate(new TimeSpan(10, "m"));

			const emailData = {
				email,
				subject: `Your unique Hono Authed verification code is ${code}`,
				code,
				expiryTimestamp: expiresAt,
			};

			if (existingCode) {
				await updateEmailVerificationCode(email, code, expiresAt);
			} else {
				await createEmailVerificationCode(email, code, expiresAt);
			}

			await sendEmailVerificationMail(emailData);

			return c.json(
				{ message: "Check your email for the verification code!" },
				HttpStatusCodes.OK
			);
		} catch {
			return c.json(
				{ error: "Failed to send verification code. Please try again." },
				HttpStatusCodes.INTERNAL_SERVER_ERROR
			);
		}
	}
);

export default router;
