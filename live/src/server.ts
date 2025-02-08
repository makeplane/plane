import "@/core/config/sentry-config";
import express from "express";
import type { Application, Request, Response, Router } from "express";
import expressWs from "express-ws";
import type * as ws from "ws";
import * as Sentry from "@sentry/node";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import type { Hocuspocus } from "@hocuspocus/server";

// core hocuspocus server
import { getHocusPocusServer } from "@/core/hocuspocus-server";

// helpers
import { logger, manualLogger } from "@/core/helpers/logger";
import { errorHandler } from "@/core/helpers/error-handler";

// controllers
import { registerControllers } from "./lib/controller";
import { HealthController } from "./controllers/health.controller";
import { CollaborationController } from "./controllers/collaboration.controller";
import { DocumentController } from "./controllers/document.controller";

interface WebSocketRouter extends Router {
  ws: (_path: string, _handler: (ws: ws.WebSocket, req: Request) => void) => void;
}

export class Server {
  private app: Application;
  private port: number;
  private hocusPocusServer!: Hocuspocus;

  constructor() {
    this.app = express();
    expressWs(this.app as any);
    this.port = Number(process.env.PORT || 3000);

    this.setupMiddleware();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(compression({ level: 6, threshold: 5 * 1000 }));
    this.app.use(logger);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors());
  }

  async initialize() {
    try {
      this.hocusPocusServer = await getHocusPocusServer();
      await this.setupControllers();
      this.setupErrorHandlers();
      return this;
    } catch (err) {
      manualLogger.error("Failed to initialize server:", err);
      throw err;
    }
  }

  private async setupControllers() {
    const router = express.Router() as WebSocketRouter;
    const collaborationController = new CollaborationController(this.hocusPocusServer);

    registerControllers(router, [HealthController, DocumentController]);

    router.ws("/collaboration", (ws: ws.WebSocket, req: Request) => {
      collaborationController.handleConnection(ws, req);
    });

    this.app.use(process.env.LIVE_BASE_PATH || "/live", router);
    this.app.use((_req: Request, res: Response) => res.status(404).send("Not Found"));
  }

  private setupErrorHandlers() {
    Sentry.setupExpressErrorHandler(this.app);
    this.app.use(errorHandler);
  }

  async start() {
    const server = this.app.listen(this.port, () => {
      manualLogger.info(`Plane Live server has started at port ${this.port}`);
    });

    this.setupGracefulShutdown(server);
  }

  private setupGracefulShutdown(server: ReturnType<typeof this.app.listen>) {
    const gracefulShutdown = async () => {
      manualLogger.info("Starting graceful shutdown...");
      try {
        await this.hocusPocusServer.destroy();
        manualLogger.info("HocusPocus server WebSocket connections closed gracefully.");

        server.close(() => {
          manualLogger.info("Express server closed gracefully.");
          process.exit(1);
        });
      } catch (err) {
        manualLogger.error("Error during shutdown:", err);
        process.exit(1);
      }

      setTimeout(() => {
        manualLogger.error("Forcing shutdown...");
        process.exit(1);
      }, 10000);
    };

    process.on("unhandledRejection", (reason: unknown) => {
      manualLogger.info("Unhandled Rejection: ", reason);
      manualLogger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
      gracefulShutdown();
    });

    process.on("uncaughtException", (error: Error) => {
      manualLogger.info("Uncaught Exception: ", error);
      manualLogger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
      gracefulShutdown();
    });
  }
}
