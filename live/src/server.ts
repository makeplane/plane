import "@/core/config/sentry-config.js";
import express, { Express } from "express";
import expressWs, { Application as WsApplication } from "express-ws";
import * as Sentry from "@sentry/node";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import { Server as HTTPServer } from "http";

// core hocuspocus server
import { getHocusPocusServer } from "@/core/hocuspocus-server.js";
import { logger, manualLogger } from "@/core/helpers/logger.js";
import { errorHandler } from "@/core/helpers/error-handler.js";
import { HealthController } from "@/core/controllers/health.controller.js";
import { CollaborationController } from "@/core/controllers/collaboration.controller.js";
import type { Hocuspocus as HocusPocusServer } from "@hocuspocus/server";

// Types
type WebSocketServerType = Express & WsApplication;

const Controllers = [HealthController, CollaborationController];
export class Server {
  private app: WebSocketServerType;
  private port: number;
  private hocusPocusServer: HocusPocusServer | null;
  private httpServer: HTTPServer | null;

  constructor() {
    const expressApp = express();
    const wsInstance = expressWs(expressApp);
    this.app = wsInstance.app as WebSocketServerType;
    this.port = Number(process.env.PORT || 3000);
    this.hocusPocusServer = null;
    this.httpServer = null;

    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // Compression middleware
    this.app.use(
      compression({
        level: 6,
        threshold: 5 * 1000,
      }),
    );

    // Logging middleware
    this.app.use(logger);

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // CORS middleware
    this.app.use(cors());
  }

  private async setupWebSocketServer(): Promise<void> {
    try {
      this.hocusPocusServer = await getHocusPocusServer();
    } catch (err) {
      manualLogger.error("Failed to initialize HocusPocusServer:", err);
      process.exit(1);
    }
  }

  private setupControllers(): void {
    if (!this.hocusPocusServer) {
      throw new Error("HocusPocus server not initialized");
    }

    const router = express.Router();

    Controllers.forEach((Controller) => {
      const instance = new Controller(this.hocusPocusServer);
      instance.registerRoutes(router);
    });

    this.app.use(process.env.LIVE_BASE_PATH || "/live", router);

    // 404 handler
    this.app.use((_req: express.Request, res: express.Response) => {
      res.status(404).send("Not Found");
    });
  }

  private setupErrorHandling(): void {
    Sentry.setupExpressErrorHandler(this.app);
    this.app.use(errorHandler);
  }

  private setupShutdownHandlers(): void {
    const handleShutdown = async (signal: string) => {
      manualLogger.info(`${signal} received. Starting graceful shutdown...`);
      await this.gracefulShutdown();
    };

    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("unhandledRejection", (err: Error | null) => {
      manualLogger.info("Unhandled Rejection: ", err);
      manualLogger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
      this.gracefulShutdown();
    });

    process.on("uncaughtException", (err: Error) => {
      manualLogger.info("Uncaught Exception: ", err);
      manualLogger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
      this.gracefulShutdown();
    });
  }

  public async gracefulShutdown(): Promise<void> {
    manualLogger.info("Starting graceful shutdown...");

    try {
      if (this.hocusPocusServer) {
        await this.hocusPocusServer.destroy();
        manualLogger.info(
          "HocusPocus server WebSocket connections closed gracefully.",
        );
      }

      if (this.httpServer) {
        await new Promise<void>((resolve) => {
          this.httpServer?.close(() => {
            manualLogger.info("Express server closed gracefully.");
            resolve();
          });
        });
      }
    } catch (err) {
      manualLogger.error("Error during shutdown:", err);
    } finally {
      process.exit(1);
    }
  }

  public async start(): Promise<void> {
    try {
      // Initialize WebSocket server first
      await this.setupWebSocketServer();

      // Then setup controllers with the initialized hocusPocusServer
      this.setupControllers();

      // Setup error handling
      this.setupErrorHandling();

      // Start the server
      this.httpServer = this.app.listen(this.port, () => {
        manualLogger.info(`Plane Live server has started at port ${this.port}`);
      });

      // Setup graceful shutdown handlers
      this.setupShutdownHandlers();
    } catch (error) {
      manualLogger.error("Failed to start server:", error);
      process.exit(1);
    }
  }
}
