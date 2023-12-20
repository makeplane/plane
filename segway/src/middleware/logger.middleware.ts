import { RequestHandler } from "express";
import { logger } from "../utils/logger";

const loggerMiddleware: RequestHandler = (req, res, next) => {
  logger.info(`${req.method}: ${req.path}`);
  next();
};
export default loggerMiddleware;
