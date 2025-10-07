import { faker } from "@faker-js/faker";
import { createRoute } from "@hono/zod-openapi";
import * as HttpStatusCodes from "stoker/http-status-codes";
import { jsonContent } from "stoker/openapi/helpers";
import { createRouter } from "@/lib/create-app";
import { setSession } from "@/lib/session";
import type { User } from "@/use-cases/types";
import {
	createSessionMetadata,
	createUser,
	deleteUniqueCode,
	getUserByEmail,
} from "@/use-cases/user";
import { capitalize } from "@/utils";
import {
	clearUniqueCodeCache,
	getCachedUniqueCode,
	hashPassword,
	isWithinExpirationDate,
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
			body: jsonContent(verifyCodeFormSchema, "Sign up credentials"),
		},
		responses: {
			[HttpStatusCodes.OK]: jsonContent(
				successResponseSchema,
				"Sign up successful"
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

			const [existingUserResult, codeResult] = await Promise.allSettled([
				getUserByEmail(email),
				getCachedUniqueCode(email, code),
			]);

			const existingUser =
				existingUserResult.status === "fulfilled"
					? existingUserResult.value
					: null;
			const uniqueCode =
				codeResult.status === "fulfilled" ? codeResult.value : null;

			if (existingUser) {
				return c.json(
					{ error: "Email already in use!" },
					HttpStatusCodes.BAD_REQUEST
				);
			}

			if (!uniqueCode) {
				return c.json(
					{ error: "Invalid verification code" },
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

			const firstName = faker.person.firstName();
			const lastName = faker.person.lastName();
			const fullName = `${capitalize(firstName)} ${capitalize(lastName)}`;
			const firstInitial = capitalize(firstName.charAt(0));
			const lastInitial = capitalize(lastName.charAt(0));
			const imageText = `https://avatar.vercel.sh/vercel.svg?text=${firstInitial}${lastInitial}`;

			const [hashedPasswordResult, metadataResult] = await Promise.allSettled([
				hashPassword(password),
				createSessionMetadata(Object.fromEntries(c.req.raw.headers.entries())),
			]);

			if (hashedPasswordResult.status === "rejected") {
				return c.json(
					{ error: "Failed to process password. Please try again!" },
					HttpStatusCodes.INTERNAL_SERVER_ERROR
				);
			}

			const hashedPassword = hashedPasswordResult.value;
			const metadata =
				metadataResult.status === "fulfilled"
					? metadataResult.value
					: {
							location: "Unknown",
							browser: "Unknown Browser",
							device: "Unknown Device",
							os: "Unknown OS",
							ipAddress: "127.0.0.1",
						};

			let newUser: User;
			try {
				newUser = await createUser(email, fullName, hashedPassword, imageText);
			} catch (error) {
				if (
					error instanceof Error &&
					(error.message.includes("duplicate") ||
						error.message.includes("unique"))
				) {
					return c.json(
						{ error: "Email already in use!" },
						HttpStatusCodes.BAD_REQUEST
					);
				}

				return c.json(
					{ error: "Failed to create user account. Please try again!" },
					HttpStatusCodes.INTERNAL_SERVER_ERROR
				);
			}

			await Promise.all([
				deleteUniqueCode(uniqueCode.id),
				clearUniqueCodeCache(email, code),
				setSession(c, newUser.id, metadata, newUser),
			]);

			return c.json(
				{ message: "You've successfully signed up and verified your account!" },
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
