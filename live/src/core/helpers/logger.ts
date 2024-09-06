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
  serializers: {
    req(req) {
      return `${req.method} ${req.url}`;
    },
    res(res) {
      return `${res.statusCode} ${res?.statusMessage || ""}`;
    },
    responseTime(time) {
      return `${time}ms`;
    },
  },
});

export const manualLogger = logger.logger;
