import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import path from "path";
import { Hocuspocus } from "@hocuspocus/server";
// controllers
import { HealthController } from "@/core/controllers/health.controller";
import { DocumentController } from "@/core/controllers/document.controller";
import { CollaborationController } from "@/core/controllers/collaboration.controller";
import { registerControllers } from "./lib/controller.utils";
import { initializeRedis } from "./core/lib/redis-manager";
import { logger } from "@plane/logger";
import { createHocusPocus } from "./hocuspocus";
import { handleError } from "./core/helpers/error-handling/error-factory";

export default class Server {
  app: Application;
  PORT: number;
  BASE_PATH: string;
  CORS_ALLOWED_ORIGINS: string;
  hocuspocusServer: Hocuspocus | null = null;
  private httpServer: any;

  constructor() {
    this.PORT = parseInt(process.env.PORT || "3000");
    this.BASE_PATH = process.env.LIVE_BASE_PATH || "/";
    this.CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || "*";
    // Initialize express app
    this.app = express();
    expressWs(this.app as any);
    // Security middleware
    this.app.use(helmet());
    // cors
    this.setupCors();
    // Cookie parsing
    this.app.use(cookieParser());
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // static files
    this.app.use(express.static(path.join(__dirname, "public")));
    // setup redis
    initializeRedis();
    // setup hocuspocus server
    this.hocuspocusServer = createHocusPocus();
    // setup controllers
    this.setupControllers();
  }

  private setupCors() {
    const origins = this.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
    this.app.use(
      cors({
        origin: origins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      })
    );
  }

  private setupControllers() {
    const router = express.Router();
    registerControllers(
      router,
      [HealthController, DocumentController, CollaborationController],
      [this.hocuspocusServer]
    );
    this.app.use(this.BASE_PATH, router);
  }

  start() {
    this.httpServer = this.app.listen(this.PORT, () => {
      console.log(`Plane Live server has started at port ${this.PORT}`);
    });

    // Setup graceful shutdown
    process.on("SIGTERM", () => this.shutdown("Received SIGTERM"));
    process.on("SIGINT", () => this.shutdown("Received SIGINT"));

    process.on("uncaughtException", (error) => {
      logger.error("Uncaught exception:", error);
      // Create AppError to track the issue but don't terminate
      handleError(error, {
        errorType: "internal",
        component: "process",
        operation: "uncaughtException",
        extraContext: { source: "uncaughtException" },
      });
    });

    // Handle unhandled promise rejections - create AppError but DON'T terminate
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled rejection:", reason);
      // Create AppError to track the issue but don't terminate
      handleError(reason, {
        errorType: "internal",
        component: "process",
        operation: "unhandledRejection",
        extraContext: { source: "unhandledRejection" },
      });
    });
  }

  private async shutdown(reason: string): Promise<void> {
    logger.info(`Initiating graceful shutdown: ${reason}`);

    if (!this.httpServer) {
      logger.info("No HTTP server to close");
      return;
    }

    // Close all existing connections
    this.httpServer.closeAllConnections?.();

    // Close the server
    return new Promise<void>((resolve) => {
      this.httpServer.close((error: Error | undefined) => {
        if (error) {
          logger.error("Error closing HTTP server:", error);
        } else {
          logger.info("HTTP server closed successfully");
        }
        resolve();
      });
    });
  }
}
