import express from "express";
import type { Application, Request, Router } from "express";
import expressWs from "express-ws";
import type * as ws from "ws";
import type { Hocuspocus } from "@hocuspocus/server";

// Environment and configuration
import { serverConfig, configureServerMiddleware } from "./config/server-config";
import { initializeSentry } from "./sentry-config";

// Core functionality
import { getHocusPocusServer } from "@/core/hocuspocus-server";
import { controllerRegistry } from "@/core/controller-registry";
import { ShutdownManager } from "@/core/shutdown-manager";

// Service and controller related
import { IControllerRegistry, IServiceContainer } from "./lib/controller.interface";
import { registerControllers } from "./lib/controller.utils";
import { ServiceContainer } from "./lib/service-container";

// Logging
import { logger } from "@plane/logger";

// Error handling
import { configureErrorHandlers, AppError } from "@/core/helpers/error-handler";

// WebSocket router type definition
interface WebSocketRouter extends Router {
  ws: (_path: string, _handler: (ws: ws.WebSocket, req: Request) => void) => void;
}

/**
 * Main server class for the application
 */
export class Server {
  private readonly app: Application;
  private readonly port: number;
  private hocusPocusServer!: Hocuspocus;
  private controllerRegistry!: IControllerRegistry;
  private serviceContainer: IServiceContainer;

  /**
   * Creates an instance of the server class.
   * @param port Optional port number, defaults to environment configuration
   */
  constructor(port?: number) {
    this.app = express();
    this.serviceContainer = new ServiceContainer();
    this.port = port || serverConfig.port;

    // Initialize express-ws after Express setup
    expressWs(this.app as any);

    // Configure server
    this.setupSentry();
    configureServerMiddleware(this.app);
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
   * Initialize the server with all required components
   * @returns The server instance for chaining
   */
  async initialize() {
    try {
      // Initialize core services
      await this.initializeServices();

      // Initialize controllers
      await this.initializeControllers();

      // Set up routes
      await this.setupRoutes();

      // Set up error handlers
      logger.info("Setting up error handlers");
      configureErrorHandlers(this.app);

      return this;
    } catch (error) {
      logger.error("Failed to initialize server:", error);
      if (error instanceof AppError) throw error;
      throw new AppError(`Server initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Initialize core services
   */
  private async initializeServices() {
    // Initialize the Hocuspocus server
    this.hocusPocusServer = await getHocusPocusServer();

    // Register services in the container
    this.serviceContainer.register("hocuspocus", this.hocusPocusServer);
  }

  /**
   * Initialize controllers
   */
  private async initializeControllers() {
    // Create controller registry with all controllers
    this.controllerRegistry = controllerRegistry.createRegistry();
  }

  /**
   * Set up API routes and WebSocket endpoints
   */
  private async setupRoutes() {
    try {
      const router = express.Router() as WebSocketRouter;

      // Register all controllers using the registry with the service container
      registerControllers(router, this.controllerRegistry, this.serviceContainer);

      // Mount the router on the base path
      this.app.use(serverConfig.basePath, router);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to setup routes: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Start the server
   * @returns HTTP Server instance
   */
  async start() {
    const server = this.app.listen(this.port, () => {
      logger.info(`Plane Live server has started at port ${this.port}`);
    });

    // Setup graceful shutdown
    const shutdownManager = new ShutdownManager(this.hocusPocusServer, server);
    shutdownManager.registerShutdownHandlers();

    return server;
  }
}
