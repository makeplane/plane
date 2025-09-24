import { Hocuspocus } from "@hocuspocus/server";
import compression from "compression";
import cors from "cors";
import express, { Express, Request, Response, Router } from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import { Server as HttpServer } from "http";
// plane imports
import { registerController } from "@plane/decorators";
import { logger, loggerMiddleware } from "@plane/logger";
// controllers
import { CONTROLLERS } from "@/controllers";
// env
import { env } from "@/env";
// hocuspocus server
import { HocusPocusServerManager } from "@/hocuspocus";
// redis
import { redisManager } from "@/redis";

export class Server {
  private app: Express;
  private router: Router;
  private hocuspocusServer: Hocuspocus | null = null;
  private httpServer: HttpServer | null = null;

  constructor() {
    this.app = express();
    expressWs(this.app);
    this.setupMiddleware();
    this.router = express.Router();
    this.app.set("port", env.PORT || 3000);
    this.app.use(env.LIVE_BASE_PATH, this.router);
  }

  public async initialize(): Promise<void> {
    try {
      await redisManager.initialize();
      logger.info("Redis setup completed");
      const manager = HocusPocusServerManager.getInstance();
      this.hocuspocusServer = await manager.initialize();
      logger.info("HocusPocus setup completed");

      // Set up routes and handlers after hocuspocusServer is initialized
      this.setupRoutes();
      this.setupNotFoundHandler();
    } catch (error) {
      logger.error("Failed to initialize live server dependencies:", error);
      throw error;
    }
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    // Middleware for response compression
    this.app.use(compression({ level: 6, threshold: 5 * 1000 }));
    // Logging middleware
    this.app.use(loggerMiddleware);
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // cors middleware
    this.setupCors();
  }

  private setupCors() {
    const allowedOrigins =
      process.env.CORS_ALLOWED_ORIGINS === "*"
        ? "*"
        : process.env.CORS_ALLOWED_ORIGINS?.split(",")?.map((s) => s.trim()) || [];
    this.app.use(
      cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      })
    );
  }

  private setupNotFoundHandler() {
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        message: "Not Found",
      });
    });
  }

  private setupRoutes() {
    CONTROLLERS.forEach((controller) => registerController(this.router, controller, [this.hocuspocusServer]));
  }

  public listen() {
    this.httpServer = this.app.listen(this.app.get("port"), () => {
      logger.info(`Plane Live server has started at port ${this.app.get("port")}`);
    });
  }

  public async destroy() {
    // Close the HocusPocus server WebSocket connections
    if (this.hocuspocusServer) {
      await this.hocuspocusServer.destroy();
      logger.info("HocusPocus server WebSocket connections closed gracefully.");
    }

    // Disconnect Redis
    await redisManager.disconnect();
    logger.info("Redis connection closed gracefully.");

    if (this.httpServer) {
      // Close the Express server
      this.httpServer.close(() => {
        logger.info("Express server closed gracefully.");
      });
    } else {
      logger.warn("Express server not found");
      throw new Error("Express server not found");
    }
  }
}
