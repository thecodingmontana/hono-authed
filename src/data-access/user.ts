import { desc } from "drizzle-orm";
import { db } from "../database/db";
import type { User } from "../database/schema";

export const getAllUsers = async (): Promise<User[]> =>
	db.query.user.findMany({
		orderBy: (table) => desc(table.created_at),
	});
