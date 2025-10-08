import { createRouter } from "@/lib/create-app";
import { rateLimiter } from "@/middlewares/rate-limiter";
import signinRouter from "./signin/index.route";
import signoutRouter from "./signout.route";
import signupRouter from "./signup/index.route";

export const authRouter = createRouter();

const routes = [
	{ path: "/signin", router: signinRouter },
	{ path: "/signup", router: signupRouter },
	{ path: "/signout", router: signoutRouter },
];

authRouter.use(
	"*",
	rateLimiter({ windowMs: 60_000, max: 5, keyPrefix: "rl-auth" })
);

for (const route of routes) {
	authRouter.route(`${route.path}`, route.router);
}

export default authRouter;
