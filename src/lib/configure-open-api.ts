import { Scalar } from "@scalar/hono-api-reference";
import packageJSON from "../../package.json" with { type: "json" };
import type { AppOpenAPI } from "./types";

export default function configureOpenAPI(app: AppOpenAPI) {
	app.doc("/api/v1/open-api.json", {
		openapi: "3.0.0",
		info: {
			version: packageJSON.version,
			title: "Hono Authed API",
		},
	});

	app.get(
		"/api/v1/docs",
		Scalar({
			url: "/api/v1/open-api.json",
			theme: "deepSpace",
			pageTitle: "Hono Authed API Reference",
		})
	);
}
