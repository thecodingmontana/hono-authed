import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
	server: {
		DATABASE_URL: z.url(),
		NODE_ENV: z.string().default("development"),
		SERVER_PORT: z.coerce.number().default(4000),
		GOOGLE_CLIENT_ID: z.string(),
		GOOGLE_CLIENT_SECRET: z.string(),
		RESEND_API_KEY: z.string(),
		UPSTASH_URL: z.url(),
		UPSTASH_TOKEN: z.string(),
		REDIS_HOST: z.string().default("localhost"),
		REDIS_PORT: z.coerce.number().default(6379),
		REDIS_PASSWORD: z.string(),
		LOG_LEVEL: z.enum([
			"fatal",
			"error",
			"warn",
			"info",
			"debug",
			"trace",
			"silent",
		]),
	},
	runtimeEnv: process.env,
});
