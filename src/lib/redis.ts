import { Redis } from "ioredis";
import { env } from "@/env";

export const redis = new Redis({
	host: env.REDIS_HOST || "localhost",
	port: env.REDIS_PORT,
	password: env.REDIS_PASSWORD,
});
