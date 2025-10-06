/** biome-ignore-all lint/suspicious/noConsole: ignore all */

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import { db, driver as pool } from "./db";

async function main() {
	const tablesSchema = db._.schema;
	if (!tablesSchema) {
		throw new Error("Schema not loaded");
	}

	// Drop drizzle schema (if it exists)
	await db.execute(sql.raw(`DROP SCHEMA IF EXISTS "drizzle" CASCADE;`));

	// Drop and recreate public schema
	await db.execute(sql.raw("DROP SCHEMA IF EXISTS public CASCADE;"));
	await db.execute(sql.raw("CREATE SCHEMA public;"));

	// Grant privileges
	await db.execute(
		sql.raw(`
      GRANT USAGE ON SCHEMA public TO postgres;
      GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO postgres;
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT ALL ON TABLES    TO postgres;

      ALTER DEFAULT PRIVILEGES IN SCHEMA public
        GRANT ALL ON SEQUENCES TO postgres;
    `)
	);

	const migrationsDir = path.join(
		process.cwd(),
		"src",
		"database",
		"migrations"
	);

	console.log("migrationsDir", migrationsDir);

	if (fs.existsSync(migrationsDir)) {
		for (const entry of fs.readdirSync(migrationsDir)) {
			fs.rmSync(path.join(migrationsDir, entry), {
				recursive: true,
				force: true,
			});
		}
		console.log(`🗑️  Cleared all contents inside: ${migrationsDir}`);
	} else {
		console.log(`⚠️  No migrations directory found at: ${migrationsDir}`);
	}

	await pool.end();
	console.log("✅ Database schemas dropped and migrations folder cleared");
}

main().catch((err) => {
	console.error("❌ Error clearing database and migrations folder:", err);
	process.exit(1);
});
