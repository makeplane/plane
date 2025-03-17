import express from "express";
import type { Application, Request, Response, Router, NextFunction } from "express";
import expressWs from "express-ws";
import type * as ws from "ws";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import type { Hocuspocus } from "@hocuspocus/server";

// core hocuspocus server
import { getHocusPocusServer } from "@/core/hocuspocus-server";

// environment configuration
import { env } from "./env";

// helpers
import { setupGlobalErrorHandlers, NotFoundError, errorHandler, AppError } from "@/core/helpers/error-handler";
import { initializeSentry } from "./sentry-config";

// controllers and interfaces
import { ControllerConstructor, IWebSocketController } from "./lib/controller.interface";
import { registerControllers } from "./lib/controller.utils";

// Import controllers
import { HealthController } from "./controllers/health.controller";
import { CollaborationController } from "./controllers/collaboration.controller";
import { DocumentController } from "./controllers/document.controller";
import { logger as loggerMiddleware } from "@/core/helpers/logger";
import { logger } from "@plane/logger";

interface WebSocketRouter extends Router {
  ws: (_path: string, _handler: (ws: ws.WebSocket, req: Request) => void) => void;
}

export class Server {
  private readonly app: Application;
  private readonly port: number;
  private hocusPocusServer!: Hocuspocus;
  private webSocketControllers: IWebSocketController[] = [];
  private restControllers: ControllerConstructor[] = [];

  // Define controller groups for better organization
  private static readonly CONTROLLERS = {
    CORE: [HealthController], // Core system controllers
    DOCUMENT: [DocumentController], // Document management controllers
    WEBSOCKET: [] as IWebSocketController[], // WebSocket controllers
  };

  /**
   * Creates an instance of the server class.
   * @param port Optional port number, defaults to environment configuration
   */
  constructor(port?: number) {
    this.app = express();

    // Initialize express-ws after Express setup
    expressWs(this.app as any);
    this.port = port || env.PORT;

    // Initialize Sentry properly
    this.setupSentry();
    this.setupMiddleware();
  }

  /**
   * Get the Express application instance
   * Useful for testing
   */
  getApp(): Application {
    return this.app;
  }

  /**
   * Set up Sentry for error tracking
   */
  private setupSentry(): void {
    initializeSentry();
  }

  /**
   * Set up Express middleware
   */
  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration with better logging
    const origins = env.CORS_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || [];
    for (const origin of origins) {
      logger.info(`Adding CORS allowed origin: ${origin}`);
      this.app.use(
        cors({
          origin,
          credentials: true,
          methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
          allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
        })
      );
    }

    // Compression middleware
    this.app.use(
      compression({
        level: env.COMPRESSION_LEVEL,
        threshold: env.COMPRESSION_THRESHOLD,
      }) as unknown as express.RequestHandler
    );

    // Cookie parsing
    this.app.use(cookieParser());

    // Logging middleware
    this.app.use(loggerMiddleware);

    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Initialize the server with all required components
   * @returns The server instance for chaining
   */
  async initialize() {
    try {
      // Initialize the Hocuspocus server
      this.hocusPocusServer = await getHocusPocusServer();

      // Initialize controllers
      await this.initializeControllers();

      // Set up routes
      await this.setupRoutes();

      logger.info("Setting up error handlers");
      // Set up error handlers
      this.setupErrorHandlers();

      return this;
    } catch (error) {
      logger.error("Failed to initialize server:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Server initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize controllers
   */
  private async initializeControllers() {
    try {
      // Create WebSocket controllers
      const collaborationController = new CollaborationController(this.hocusPocusServer);
      this.webSocketControllers = [collaborationController];

      // Add to the static CONTROLLERS group for organization
      Server.CONTROLLERS.WEBSOCKET = this.webSocketControllers;

      // Set REST controllers
      this.restControllers = [...Server.CONTROLLERS.CORE, ...Server.CONTROLLERS.DOCUMENT];
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to initialize controllers: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set up API routes and WebSocket endpoints
   */
  private async setupRoutes() {
    try {
      const router = express.Router() as WebSocketRouter;

      // Register REST controllers
      registerControllers(router, this.restControllers);

      // Register WebSocket controllers
      this.setupWebSocketRoutes(router);

      // Mount the router on the base path
      this.app.use(env.LIVE_BASE_PATH, router);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to setup routes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Set up WebSocket routes
   * @param router The WebSocket-enabled router
   */
  private setupWebSocketRoutes(router: WebSocketRouter) {
    for (const wsController of this.webSocketControllers) {
      if (wsController instanceof CollaborationController) {
        router.ws("/collaboration", (ws: ws.WebSocket, req: Request) => {
          wsController.handleConnection(ws, req);
        });
      }
    }
  }

  private setupErrorHandlers(): void {
    // Global error handling middleware
    this.app.use(errorHandler);

    // 404 handler must be last
    this.app.use((_req: Request, _res: Response, next: NextFunction) => {
      next(new NotFoundError("Resource not found"));
    });
  }

  async start() {
    const server = this.app.listen(this.port, () => {
      logger.info(`Plane Live server has started at port ${this.port}`);
    });

    // Setup graceful shutdown
    const gracefulShutdown = this.getGracefulShutdown(server);

    // Register global error handlers using the shared utility
    setupGlobalErrorHandlers(gracefulShutdown);

    return server;
  }

  /**
   * Get graceful shutdown handler
   * @param server HTTP server instance
   * @returns Graceful shutdown function
   */
  private getGracefulShutdown(server: ReturnType<typeof this.app.listen>) {
    return async () => {
      logger.info("Starting graceful shutdown...");
      try {
        // Destroy Hocuspocus server
        await this.hocusPocusServer.destroy();
        logger.info("HocusPocus server WebSocket connections closed gracefully.");

        // Close Express server
        server.close(() => {
          logger.info("Express server closed gracefully.");
          process.exit(0);
        });
      } catch (error) {
        logger.error("Error during shutdown:", error);
        if (error instanceof AppError) throw error;
        throw new AppError(`Graceful shutdown failed: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Safety timeout to force exit if graceful shutdown takes too long
      setTimeout(() => {
        logger.error("Forcing shutdown after timeout...");
        process.exit(1);
      }, env.SHUTDOWN_TIMEOUT);
    };
  }
}
