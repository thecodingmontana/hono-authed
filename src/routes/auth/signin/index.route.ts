import { createRouter } from "@/lib/create-app";
import send_verification_code from "./send-verification-code.route";
import signin from "./signin.route";

export const signinRouter = createRouter();

const routes = [
	{ path: "/send-verification-code", router: send_verification_code },
	{ path: "", router: signin },
];

for (const route of routes) {
	signinRouter.route(`${route.path}`, route.router);
}

export default signinRouter;
