import { createLogger, format, transports } from "winston";

const formatLogMessage = (info: any) => {
  const { timestamp, level, message, ...metadata } = info;
  const msg = `[${timestamp}] "${level}" ${message}`;
  const metaString = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : "";
  return msg + metaString;
};

export const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({
      format: "DD/MMM/YYYY HH:mm:ss",
    }),
    format.printf(formatLogMessage)
  ),
  transports: [new transports.Console()],
});
