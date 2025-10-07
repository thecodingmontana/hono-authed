import heathz from "@/routes/healthz.route";
import configureOpenAPI from "./lib/configure-open-api";
import createApp from "./lib/create-app";
import authRouter from "./routes/auth/index.route";

const app = createApp();

const routes = [
	{ path: "/healthz", router: heathz },
	{ path: "/auth", router: authRouter },
];

configureOpenAPI(app);

for (const route of routes) {
	app.route(`/api/v1${route.path}`, route.router);
}

export default app;
