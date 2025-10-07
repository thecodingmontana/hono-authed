import type { InferSelectModel } from "drizzle-orm";
import type { session, unique_code, user } from "./user";

/* ------------------- TYPES ------------------- */
export type User = InferSelectModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type UniqueCode = InferSelectModel<typeof unique_code>;
