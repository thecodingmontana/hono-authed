import { Hono } from "hono";
import { formSchema, verifyCodeFormSchema } from "../form-schema/auth";
import { sendEmailVerificationMail } from "../lib/mails/email-verification";
import {
	createEmailVerificationCode,
	getEmailVerificationCode,
	getUserByEmail,
	updateEmailVerificationCode,
} from "../use-cases/user";
import {
	createDate,
	generateUniqueCode,
	TimeSpan,
	verifyHashedPassword,
} from "../utils/auth";
import { zValidator } from "../utils/validator";

const authRoute = new Hono();

/*
 * Signin Routes
 */

authRoute.post(
	"/signin/send-verification-code",
	zValidator("json", formSchema),
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
					400
				);
			}

			if (!user.password) {
				// Verify password
				return c.json(
					{
						error: "User account has no password set!",
					},
					400
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
					400
				);
			}

			// Generate code and expiry once
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
						500
					);
				}

				return c.json(
					{
						error:
							"Failed to process verification request. Please try again later",
					},
					500
				);
			}

			return c.json({
				email,
				password,
			});
		} catch {
			return c.json(
				{
					error: "Failed to signin and send verification code",
				},
				500
			);
		}
	}
);

authRoute.post("/signin", zValidator("json", verifyCodeFormSchema), (c) => {
	const { code, email, password } = c.req.valid("json");

	return c.json({
		code,
		email,
		password,
	});
});

/*
 * Signup Routes
 */

authRoute.post(
	"/signup/send-verification-code",
	zValidator("json", formSchema),
	(c) => {
		const { email, password } = c.req.valid("json");

		return c.json({
			email,
			password,
		});
	}
);

authRoute.post("/signup", zValidator("json", verifyCodeFormSchema), (c) => {
	const { code, email, password } = c.req.valid("json");

	return c.json({
		code,
		email,
		password,
	});
});

export default authRoute;
