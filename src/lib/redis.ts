import { Redis } from "@upstash/redis";
import { env } from "@/env";

// Uncomment to local redis
// import { Redis } from "ioredis";
// export const redis = new Redis({
// 	host: env.REDIS_HOST || "localhost",
// 	port: env.REDIS_PORT,
// 	password: env.REDIS_PASSWORD,
// });

// Comment and uncomment the above settings to use local redis
export const redis = new Redis({
	url: env.UPSTASH_URL,
	token: env.UPSTASH_TOKEN,
}) as Redis;
