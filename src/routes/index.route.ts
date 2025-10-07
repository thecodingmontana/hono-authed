import { createRouter } from "@/lib/create-app";
import usersRoute from "./users";

const routes = createRouter();

routes.route("/users", usersRoute);

export default routes;
