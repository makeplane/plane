import { env } from "@/env";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import { logger } from "@plane/logger";
import { logger as loggerMiddleware } from "@/core/helpers/logger";

/**
 * Configure server middleware
 * @param app Express application
 */
export function configureServerMiddleware(app: express.Application): void {
  // Security middleware
  app.use(helmet());

  // CORS configuration
  configureCors(app);

  // Compression middleware
  app.use(
    compression({
      level: env.COMPRESSION_LEVEL,
      threshold: env.COMPRESSION_THRESHOLD,
    }) as unknown as express.RequestHandler
  );

  // Cookie parsing
  app.use(cookieParser());

  // Logging middleware
  app.use(loggerMiddleware);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
}

/**
 * Configure CORS
 * @param app Express application
 */
function configureCors(app: express.Application): void {
  const origins = env.CORS_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || [];
  for (const origin of origins) {
    logger.info(`Adding CORS allowed origin: ${origin}`);
    app.use(
      cors({
        origin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      })
    );
  }
}

/**
 * Server configuration
 */
export const serverConfig = {
  port: env.PORT,
  basePath: env.LIVE_BASE_PATH,
  terminationTimeout: env.SHUTDOWN_TIMEOUT,
}; 