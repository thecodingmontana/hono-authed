import { createRouter } from "@/lib/create-app";
import { requireAuth } from "@/middlewares/auth";
import all from "./all.index";

const usersRouter = createRouter();

const routes = [
	{
		path: "/all",
		router: all,
	},
];

usersRouter.use("*", requireAuth);

for (const route of routes) {
	usersRouter.route(`${route.path}`, route.router);
}

export default usersRouter;
