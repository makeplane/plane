import { pinoHttp } from "pino-http";

const transport = {
  target: "pino-pretty",
  options: {
    colorize: true,
  },
};

export const logger = pinoHttp({
  level: "info",
  transport: transport,
});

export const manualLogger = logger.logger;
