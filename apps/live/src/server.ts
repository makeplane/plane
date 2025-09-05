import { Hocuspocus } from "@hocuspocus/server";
import compression from "compression";
import cors from "cors";
import express, { Express, Request, Response, Router } from "express";
import expressWs from "express-ws";
import helmet from "helmet";
// plane imports
import { registerController } from "@plane/decorators";
import { logger, loggerMiddleware } from "@plane/logger";
// controllers
import { CONTROLLERS } from "@/controllers";
// hocuspocus server
import { HocusPocusServerManager } from "@/hocuspocus";
// redis
import { redisManager } from "@/redis";

export class Server {
  private app: Express;
  private router: Router;
  private hocuspocusServer: Hocuspocus | null = null;
  private serverInstance: any;

  constructor() {
    this.app = express();
    expressWs(this.app);
    this.setupMiddleware();
    this.router = express.Router();
    this.app.set("port", process.env.PORT || 3000);
    this.app.use(process.env.LIVE_BASE_PATH || "/live", this.router);
    this.setupRoutes();
    this.setupNotFoundHandler();
  }

  public async initialize(): Promise<void> {
    try {
      await redisManager.initialize();
      logger.info("Redis setup completed");
      const manager = HocusPocusServerManager.getInstance();
      this.hocuspocusServer = await manager.initialize();
      logger.info("HocusPocus setup completed");
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
    this.app.use(cors());
  }

  private setupNotFoundHandler() {
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        message: "Not Found",
      });
    });
  }

  private setupRoutes() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    CONTROLLERS.forEach((controller) => registerController(this.router, controller as any, [this.hocuspocusServer]));
  }

  public listen() {
    this.serverInstance = this.app.listen(this.app.get("port"), () => {
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

    if (this.serverInstance) {
      // Close the Express server
      this.serverInstance.close(() => {
        logger.info("Express server closed gracefully.");
      });
    } else {
      logger.warn("Express server not found");
      throw new Error("Express server not found");
    }
  }
}
