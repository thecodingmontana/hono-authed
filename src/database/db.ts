import { upstashCache } from "drizzle-orm/cache/upstash";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

const tables = schema;

const connectionString = env.DATABASE_URL;

const queryClient = postgres(connectionString, {
	prepare: false,
	idle_timeout: 0,
});

const db = drizzle(queryClient, {
	schema,
	casing: "snake_case",
	cache: upstashCache({
		url: env.UPSTASH_URL,
		token: env.UPSTASH_TOKEN,
		global: true,
		config: { ex: 60 },
	}),
});
export { queryClient as driver, db, tables };
