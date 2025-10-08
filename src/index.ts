/** biome-ignore-all lint/suspicious/noConsole: ignore all */
import { serve } from "@hono/node-server";
import chalk from "chalk";
import consola from "consola";
import app from "./app";
import { env } from "./env";

const PORT = env.SERVER_PORT;
consola.start("Starting Server...");

const server = serve(
	{
		fetch: app.fetch,
		port: Number(PORT),
	},
	(info) => {
		const baseUrl = `http://localhost:${info.port}/api/v1`;
		const docsUrl = `${baseUrl}/docs`;

		consola.success("🚀 Server Started");
		consola.success(
			`Server running at: ${chalk.green(`http://localhost:${info.port}`)}`
		);
		consola.info(`🌐 API Base URL: ${chalk.green(baseUrl)}`);
		consola.info(`📘 API Docs: ${chalk.green(docsUrl)}`);
	}
);

process.on("SIGINT", () => {
	consola.warn("🛑 Server shutting down (SIGINT)...");
	server.close();
	process.exit(0);
});

process.on("SIGTERM", () => {
	consola.warn("🛑 Server shutting down (SIGTERM)...");
	server.close((err) => {
		if (err) {
			consola.error(err);
			process.exit(1);
		}
		process.exit(0);
	});
});
