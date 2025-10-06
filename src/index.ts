import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import routes from "./routes";

const app = new Hono();

app.use("*", logger());
app.route("/api/v1", routes);

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
			...(process.env.NODE_ENV === "development" && { stack: err.stack }),
		},
		500
	)
);

const PORT = process.env.SERVER_PORT || 4000;

const server = serve(
	{
		fetch: app.fetch,
		port: Number(PORT),
	},
	(info) => {
		// biome-ignore lint/suspicious/noConsole: ignore
		console.log(`🚀 Server running at http://localhost:${info.port}`);
	}
);

process.on("SIGINT", () => {
	server.close();
	process.exit(0);
});

process.on("SIGTERM", () => {
	server.close((err) => {
		if (err) {
			process.exit(1);
		}
		process.exit(0);
	});
});

export default app;
