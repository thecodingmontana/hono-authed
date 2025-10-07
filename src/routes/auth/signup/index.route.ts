import { createRouter } from "@/lib/create-app";
import send_verification_code from "./send-verification-code.route";
import signup from "./signup.route";

export const signupRouter = createRouter();

const routes = [
	{ path: "/send-verification-code", router: send_verification_code },
	{ path: "", router: signup },
];

for (const route of routes) {
	signupRouter.route(`${route.path}`, route.router);
}

export default signupRouter;
