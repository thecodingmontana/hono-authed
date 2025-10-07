import { createRouter } from "@/lib/create-app";
import { rateLimiter } from "@/middlewares/rate-limiter";
import signin_send_verification_code from "@/routes/auth/signin-send-verification-code.route";

export const authRouter = createRouter();

const routes = [
	{ path: "/send-verification-code", router: signin_send_verification_code },
];

authRouter.use(
	"/signin/*",
	rateLimiter({ windowMs: 60_000, max: 5, keyPrefix: "signin" })
);

for (const route of routes) {
	authRouter.route(`/signin${route.path}`, route.router);
}

export default authRouter;
