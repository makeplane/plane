import type { RequestHandler } from "express";
import expressWinston from "express-winston";
import { transports } from "winston";
import { loggerConfig } from "./config";

export const loggerMiddleware: RequestHandler = expressWinston.logger({
  ...loggerConfig,
  transports: [new transports.Console()],
  msg: "{{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
  expressFormat: true,
});
