import { pgTableCreator, timestamp } from "drizzle-orm/pg-core";
import { customAlphabet } from "nanoid";

export const PREFIX = "app";
export const pgTable = pgTableCreator((name) => `${PREFIX}_${name}`);

export const timestamps = {
	created_at: timestamp("created_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.defaultNow()
		.notNull(),
	updated_at: timestamp("updated_at", {
		mode: "date",
		precision: 3,
		withTimezone: true,
	})
		.defaultNow()
		.notNull()
		.$onUpdateFn(() => new Date()),
};

export const generateNanoId = customAlphabet(
	"0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-",
	16
);
