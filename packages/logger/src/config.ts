import type { LoggerOptions } from "winston";
import { createLogger, format, transports } from "winston";

export const loggerConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || "info",
  format: format.combine(
    format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss:ms",
    }),
    format.json()
  ),
  transports: [new transports.Console()],
};

export const logger = createLogger(loggerConfig);
