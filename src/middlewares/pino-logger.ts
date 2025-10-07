import { pinoLogger } from "hono-pino";
import pino from "pino";
import pretty from "pino-pretty";
import { generateNanoId } from "@/database/schema";
import { env } from "@/env";

export function pino_logger() {
	return pinoLogger({
		pino: pino(
			{
				level: env.LOG_LEVEL || "info",
			},
			env.NODE_ENV === "production" ? undefined : pretty()
		),
		http: {
			reqId: () => generateNanoId(),
		},
	});
}
