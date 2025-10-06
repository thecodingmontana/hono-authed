import type { InferSelectModel } from "drizzle-orm";
import type { session, user } from "./user";

/* ------------------- TYPES ------------------- */
export type User = InferSelectModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
