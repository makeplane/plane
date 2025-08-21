import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: "DD/MMM/YYYY HH:mm:ss",
    }),
    format.json()
  ),
  transports: [new transports.Console()],
});
