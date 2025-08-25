import compression from "compression";
import cors from "cors";
import expressWs from "express-ws";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { logger, loggerMiddleware } from "@plane/logger";
import { registerControllers } from "@plane/decorators";
// controllers
import { CONTROLLERS } from "@/controllers";
// hocuspocus server
import { HocusPocusServerManager } from "@/hocuspocus";
// redis
import { redisManager } from "@/redis";

export class Server {
  private app: any;
  private router: any;
  private hocuspocusServer: any;
  private serverInstance: any;
  private basePath: string;

  constructor() {
    this.app = express();
    this.router = express.Router();
    expressWs(this.app);
    this.app.set("port", process.env.PORT || 3000);
    this.setupMiddleware();
    this.setupRoutes();
    this.basePath = process.env.LIVE_BASE_PATH || "/live";
  }

  public async initialize(): Promise<void> {
    try {
      await redisManager.initialize();
      logger.info("Redis setup completed");
      const manager = HocusPocusServerManager.getInstance();
      await manager.initialize();
      logger.info("HocusPocus setup completed");
    } catch (error) {
      logger.error("Failed to setup Redis:", error);
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
    this.app.use(cors());
    this.app.use(this.basePath, this.router);
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        message: "Not Found",
      });
    });
  }

  private setupRoutes() {
    CONTROLLERS.forEach((controller) => registerControllers(this.router, controller as any)); // TODO: fix this
  }

  public listen() {
    this.serverInstance = this.app.listen(this.app.get("port"), () => {
      logger.info(`Plane Live server has started at port ${this.app.get("port")}`);
    });
  }

  public async destroy() {
    // Close the HocusPocus server WebSocket connections
    await this.hocuspocusServer.destroy();
    logger.info("HocusPocus server WebSocket connections closed gracefully.");

    // Disconnect Redis
    await redisManager.disconnect();
    logger.info("Redis connection closed gracefully.");

    // Close the Express server
    this.serverInstance.close(() => {
      logger.info("Express server closed gracefully.");
    });
  }
}
