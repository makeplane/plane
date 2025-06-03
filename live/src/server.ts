import express from "express";
import type { Application, Request, Router } from "express";
import expressWs from "express-ws";
// server agent
import type * as ws from "ws";
import type { Hocuspocus } from "@hocuspocus/server";
import http from "http";
// Environment and configuration
import { serverConfig, configureServerMiddleware } from "./config/server-config";
// Core functionality
import { getHocusPocusServer } from "@/core/hocuspocus-server";
import { initializeSentry } from "./sentry-config";

import { registerControllers } from "./lib/controller.utils";

// Redis manager
import { RedisManager } from "@/core/lib/redis-manager";

// Logging
import { logger } from "@plane/logger";

// Error handling
import { configureErrorHandlers } from "@/core/helpers/error-handling/error-handler";
import { handleError } from "@/core/helpers/error-handling/error-factory";
import { getAllControllers } from "./core/controller-registry";
import { initializeDocumentHandlers } from "@/plane-live/document-types";
// Shutdown manager
import { shutdownManager } from "@/core/shutdown-manager";
import { serverAgentManager } from "./core/agents/server-agent";
import { serverAgentHandler } from "./core/document-types/server-agent-handlers";

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
  private httpServer: http.Server | null = null;
  private hocusPocusServer!: Hocuspocus;
  private redisManager: RedisManager;

  /**
   * Creates an instance of the server class.
   * @param port Optional port number, defaults to environment configuration
   */
  constructor(port?: number) {
    this.app = express();
    this.port = port || serverConfig.port;
    this.redisManager = RedisManager.getInstance();

    // Initialize express-ws after Express setup
    expressWs(this.app as any);

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
   * Initialize the server with all required components
   * @returns The server instance for chaining
   */
  async initialize() {
    try {
      // Initialize core services
      await this.initializeServices();

      // Set up routes
      await this.setupRoutes();

      // sentry
      initializeSentry();

      // Set up error handlers
      logger.info("Setting up error handlers");
      configureErrorHandlers(this.app);

      return this;
    } catch (error) {
      logger.error("Failed to initialize server:", error);

      // This will always throw (never returns) - TypeScript correctly infers this
      handleError(error, {
        errorType: "internal",
        component: "server",
        operation: "initialize",
        throw: true,
      });
    }
  }

  /**
   * Initialize core services
   */
  private async initializeServices() {
    logger.info("Initializing Redis connection...");
    await this.redisManager.connect();

    // Initialize the Hocuspocus server
    this.hocusPocusServer = await getHocusPocusServer();

    // Initialize the server agent manager with the Hocuspocus server
    serverAgentManager.initialize(this.hocusPocusServer);
    serverAgentHandler.register();

    // initialize all document handlers
    initializeDocumentHandlers();
  }

  /**
   * Set up API routes and WebSocket endpoints
   */
  private async setupRoutes() {
    try {
      const router = express.Router() as WebSocketRouter;

      // Get all controller classes
      const controllers = getAllControllers();

      // Register controllers with our simplified approach
      // Pass the hocuspocus server as a dependency to the controllers that need it
      registerControllers(router, controllers, [this.hocusPocusServer]);

      // Mount the router on the base path
      this.app.use(serverConfig.basePath, router);
    } catch (error) {
      handleError(error, {
        errorType: "internal",
        component: "server",
        operation: "setupRoutes",
        throw: true,
      });
    }
  }

  /**
   * Start the server
   * @returns HTTP Server instance
   */
  async start() {
    try {
      this.httpServer = this.app.listen(this.port, () => {
        logger.info(`Plane Live server has started at port ${this.port}`);
      });

      if (this.httpServer) {
        shutdownManager.register({ httpServer: this.httpServer });
        shutdownManager.registerTerminationHandlers();
      }
    } catch (error) {
      handleError(error, {
        errorType: "service-unavailable",
        component: "server",
        operation: "start",
        extraContext: { port: this.port },
        throw: true,
      });
    }
  }
}
