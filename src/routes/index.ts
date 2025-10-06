import { Hono } from "hono";
import authRoute from "./auth";
import usersRoute from "./users";

const routes = new Hono();

/*
 * Auth Routes
 */
routes.route("/auth", authRoute);

/*
 * Users Routes
 */
routes.route("/users", usersRoute);

export default routes;
