import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(
      ({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`,
    ),
  ),
  transports: [new transports.Console()],
});
