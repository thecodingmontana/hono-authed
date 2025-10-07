import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { tables } from "@/database/db";

export const errorResponseSchema = z.object({
	error: z.string(),
});

export const successResponseSchema = z.object({
	message: z.string(),
});

export const UserSchema = createSelectSchema(tables.user);
