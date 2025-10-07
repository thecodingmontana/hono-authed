import type { Config } from "drizzle-kit";
import { env } from "@/env";

export default {
	out: "./src/database/migrations",
	schema: "./src/database/schema/index.ts",
	breakpoints: true,
	verbose: true,
	strict: true,
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: env.DATABASE_URL,
	},
} satisfies Config;
