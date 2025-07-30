import compression from "compression";
import cors from "cors";
import expressWs from "express-ws";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { logger } from "@plane/logger";
// hocuspocus server
import { HocusPocusServerManager } from "@/hocuspocus";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document";
import { logger as loggerMiddleware } from "@/middlewares/logger";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common";
// redis
import { redisManager } from "@/redis";

export class Server {
  private app: any;
  private router: any;
  private hocuspocusServer: any;
  private serverInstance: any;

  constructor() {
    this.app = express();
    this.router = express.Router();
    expressWs(this.app);
    this.app.set("port", process.env.PORT || 3000);
    this.setupMiddleware();
    this.setupRoutes();
  }

  public async initialize(): Promise<void> {
    return redisManager
      .initialize()
      .then(() => {
        logger.info("Redis setup completed");
        const manager = HocusPocusServerManager.getInstance();
        manager.initialize().catch((error) => {
          logger.error("Failed to initialize HocusPocusServer:");
          throw error;
        });
      })
      .catch((error) => {
        logger.error("Failed to setup Redis:", error);
        throw error;
      });
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
    this.app.use(process.env.LIVE_BASE_PATH || "/live", this.router);
  }

  private setupRoutes() {
    this.router.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "OK" });
    });

    this.router.ws("/collaboration", (ws: any, req: Request) => {
      try {
        this.hocuspocusServer.handleConnection(ws, req);
      } catch (err) {
        logger.error("WebSocket connection error:", err);
        ws.close();
      }
    });

    this.router.post("/convert-document", (req: Request, res: Response) => {
      const { description_html, variant } = req.body as TConvertDocumentRequestBody;
      try {
        if (description_html === undefined || variant === undefined) {
          res.status(400).send({
            message: "Missing required fields",
          });
          return;
        }
        const { description, description_binary } = convertHTMLDocumentToAllFormats({
          document_html: description_html,
          variant,
        });
        res.status(200).json({
          description,
          description_binary,
        });
      } catch (error) {
        logger.error("Error in /convert-document endpoint:", error);
        res.status(500).json({
          message: `Internal server error.`,
        });
      }
    });

    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        message: "Not Found",
      });
    });
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
      process.exit(1);
    });
  }
}
