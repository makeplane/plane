import { pinoHttp } from "pino-http";

const transport =
  process.env.NODE_ENV !== "production"
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      }
    : undefined;

export const logger = pinoHttp({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport: transport,
});

export const manualLogger = logger.logger;
