import { zValidator as zv } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodType } from "zod";

export const zValidator = <
	T extends ZodType,
	Target extends keyof ValidationTargets,
>(
	target: Target,
	schema: T
) =>
	zv(target, schema, (result, c) => {
		if (!result.success) {
			const firstError = result.error.issues[0];
			return c.json(
				{
					error: `Validation failed: ${firstError.message}`,
				},
				400
			);
		}
	});
