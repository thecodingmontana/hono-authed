import heathz from "@/routes/healthz.route";
import configureOpenAPI from "./lib/configure-open-api";
import createApp from "./lib/create-app";

const app = createApp();

const routes = [heathz];

configureOpenAPI(app);

for (const route of routes) {
	app.route("/api/v1", route);
}

export default app;
