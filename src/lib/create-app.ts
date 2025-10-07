import { OpenAPIHono } from "@hono/zod-openapi";
import { serveEmojiFavicon } from "stoker/middlewares";
import { env } from "@/env";
import { authMiddleware } from "@/middlewares/auth";
import { pino_logger } from "@/middlewares/pino-logger";
import type { AppBindings } from "./types";

export function createRouter() {
	return new OpenAPIHono<AppBindings>({
		strict: false,
		defaultHook: (result, c) => {
			if (!result.success) {
				const firstError = result.error.issues[0];
				return c.json(
					{
						error: `Validation failed: ${firstError.message}`,
					},
					400
				);
			}
		},
	});
}

export default function createApp() {
	const app = createRouter();

	app.use(serveEmojiFavicon("🐼"));
	app.use("*", authMiddleware);
	app.use(pino_logger());

	/*
	 * 404 Handler
	 */
	app.notFound((c) =>
		c.json(
			{
				error: "Not Found",
				message: "The requested endpoint does not exist",
				path: c.req.path,
			},
			404
		)
	);

	/*
	 * Global error handler
	 */
	app.onError((err, c) =>
		c.json(
			{
				error: "Internal Server Error",
				message: err.message || "An unexpected error occurred",
				...(env.NODE_ENV === "development" && { stack: err.stack }),
			},
			500
		)
	);

	return app;
}
