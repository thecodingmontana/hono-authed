import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { z } from "zod";
import { formSchema } from "@/form-schema/auth";
import { createRouter } from "@/lib/create-app";
import { sendEmailVerificationMail } from "@/lib/mails/email-verification";
import {
	createEmailVerificationCode,
	getEmailVerificationCode,
	getUserByEmail,
	updateEmailVerificationCode,
} from "@/use-cases/user";
import {
	createDate,
	generateUniqueCode,
	TimeSpan,
	verifyHashedPassword,
} from "@/utils/auth";

const router = createRouter();

const errorResponseSchema = z.object({
	error: z.string(),
});

const successResponseSchema = z.object({
	message: z.string(),
});

/*
 * Signin Send Verification Code Route
 */

router.openapi(
	createRoute({
		method: "post",
		tags: ["Auth"],
		path: "/",
		request: {
			body: jsonContent(formSchema, "Sign in credentials"),
		},
		responses: {
			[HttpStatusCodes.OK]: jsonContent(
				successResponseSchema,
				"Verification code sent successfully"
			),
			[HttpStatusCodes.BAD_REQUEST]: jsonContent(
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
			const { email, password } = c.req.valid("json");

			const [user, existingCode] = await Promise.all([
				getUserByEmail(email),
				getEmailVerificationCode(email),
			]);

			if (!user) {
				return c.json(
					{
						error: "Invalid email provided, not found!",
					},
					HttpStatusCodes.BAD_REQUEST
				);
			}

			if (!user.password) {
				return c.json(
					{
						error: "User account has no password set!",
					},
					HttpStatusCodes.BAD_REQUEST
				);
			}

			const isPasswordValid = await verifyHashedPassword(
				user.password,
				password
			);

			if (!isPasswordValid) {
				return c.json(
					{
						error: "Invalid password provided!",
					},
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

			try {
				if (existingCode) {
					await Promise.all([
						updateEmailVerificationCode(email, code, expiresAt),
						sendEmailVerificationMail(emailData),
					]);
				} else {
					await Promise.all([
						createEmailVerificationCode(email, code, expiresAt),
						sendEmailVerificationMail(emailData),
					]);
				}
			} catch (error) {
				if (error instanceof Error) {
					return c.json(
						{
							error: `Database or email operation failed: ${error.message}`,
						},
						HttpStatusCodes.INTERNAL_SERVER_ERROR
					);
				}

				return c.json(
					{
						error:
							"Failed to process verification request. Please try again later",
					},
					HttpStatusCodes.INTERNAL_SERVER_ERROR
				);
			}

			return c.json(
				{
					message: "Check your email for the verification code!",
				},
				HttpStatusCodes.OK
			);
		} catch {
			return c.json(
				{
					error: "Failed to signin and send verification code",
				},
				HttpStatusCodes.INTERNAL_SERVER_ERROR
			);
		}
	}
);

export default router;
