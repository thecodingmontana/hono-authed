import { Hono } from "hono";
import authRoute from "./auth";

const routes = new Hono();

/*
 * Auth Routes
 */
routes.route("/auth", authRoute);

export default routes;
