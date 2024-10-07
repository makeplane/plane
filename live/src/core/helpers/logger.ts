import { pinoHttp } from "pino-http";

const transport = {
  target: "pino-pretty",
  options: {
    colorize: true,
  },
};

const hooks = {
  logMethod(inputArgs: any, method: any): any {
    if (inputArgs.length >= 2) {
      const arg1 = inputArgs.shift();
      const arg2 = inputArgs.shift();
      return method.apply(this, [arg2, arg1, ...inputArgs]);
    }
    return method.apply(this, inputArgs);
  },
};

export const logger = pinoHttp({
  level: "info",
  transport: transport,
  hooks: hooks,
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
