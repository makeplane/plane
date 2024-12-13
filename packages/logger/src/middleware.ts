import { Request, Response, NextFunction } from "express";
import { logger } from "./config";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Log when the request starts
  const startTime = Date.now();

  // Log request details
  logger.http(`Incoming ${req.method} request to ${req.url} from ${req.ip}`);

  // Log request body if present
  if (Object.keys(req.body).length > 0) {
    logger.debug("Request body:", req.body);
  }

  // Capture response
  res.on("finish", () => {
    const duration = Date.now() - startTime;
    logger.http(`Completed ${req.method} ${req.url} with status ${res.statusCode} in ${duration}ms`);
  });

  next();
};
