import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import path from "path";
import { Hocuspocus } from "@hocuspocus/server";
// controllers

import { initializeRedis } from "./core/lib/redis-manager";
import { logger } from "@plane/logger";
import { createHocusPocus } from "./hocuspocus";

import { registerWebSocketController, registerController } from "@plane/decorators";
import { REST_CONTROLLERS, WEBSOCKET_CONTROLLERS } from "./controllers";

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

    REST_CONTROLLERS.forEach((controller: any) => {
      registerController(router, controller, [this.hocuspocusServer]);
    });

    WEBSOCKET_CONTROLLERS.forEach((controller: any) => {
      registerWebSocketController(router, controller, [this.hocuspocusServer]);
    });

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
    });

    // Handle unhandled promise rejections - create AppError but DON'T terminate
    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled rejection:", error);
    });
  }

  private async shutdown(error: string): Promise<void> {
    logger.info(`Initiating graceful shutdown: ${error}`);

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
