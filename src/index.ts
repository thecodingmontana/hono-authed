import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));

serve(
	{
		fetch: app.fetch,
		port: 3000,
	},
	(info) => {
		// biome-ignore lint/suspicious/noConsole: ignore
		console.log(`Server is running on http://localhost:${info.port}`);
	}
);
