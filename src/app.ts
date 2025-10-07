import configureOpenAPI from "@/lib/configure-open-api";
import createApp from "@/lib/create-app";
import authRouter from "@/routes/auth/index.route";
import heathz from "@/routes/healthz.route";
import usersRouter from "@/routes/users/index.route";

const app = createApp();

const routes = [
	{ path: "/healthz", router: heathz },
	{ path: "/auth", router: authRouter },
	{ path: "/users", router: usersRouter },
];

configureOpenAPI(app);

for (const route of routes) {
	app.route(`/api/v1${route.path}`, route.router);
}

export default app;
