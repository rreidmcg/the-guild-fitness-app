import pino from "pino";
import { ENV } from "../config/env";

export const logger = pino({
  level: ENV.LOG_LEVEL,
  transport: ENV.NODE_ENV === "development" ? { target: "pino-pretty" } : undefined,
  base: { app: "the-guild-fitness-app" }
});