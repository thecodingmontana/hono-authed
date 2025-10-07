import { serve } from "@hono/node-server";
import app from "./app";
import { env } from "./env";

const PORT = env.SERVER_PORT;

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
