import "dotenv/config";
import { upstashCache } from "drizzle-orm/cache/upstash";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const tables = schema;

const connectionString = process.env.DATABASE_URL as string;

const queryClient = postgres(connectionString, {
	prepare: false,
	idle_timeout: 0,
});

const db = drizzle(queryClient, {
	schema,
	casing: "snake_case",
	cache: upstashCache({
		url: process.env.UPSTASH_URL as string,
		token: process.env.UPSTASH_TOKEN as string,
		global: true,
		config: { ex: 60 },
	}),
});
export { queryClient as driver, db, tables };
