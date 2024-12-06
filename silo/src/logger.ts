import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)
  ),
  transports: [new transports.Console()],
});

export const expressLogger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: "DD/MMM/YYYY HH:mm:ss",
    }),
    format.printf(({ timestamp, level, message, ...metadata }) => {
      const msg = `[${timestamp}] "${level}" ${message}`;
      const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : "";
      return msg + metaString;
    })
  ),
  transports: [
    new transports.Console({
      handleExceptions: true,
    }),
  ],
});
