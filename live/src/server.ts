import compression from "compression";
import cors from "cors";
import expressWs from "express-ws";
import express, { Request, Response } from "express";
import helmet from "helmet";
// hocuspocus server
import { getHocusPocusServer } from "@/core/hocuspocus-server.js";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document.js";
import { logger, manualLogger } from "@/core/helpers/logger.js";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common.js";

export class Server {
  private app: any;
  private router: any;
  private hocuspocusServer: any;

  constructor() {
    this.app = express();
    this.router = express.Router();
    expressWs(this.app);
    this.app.set("port", process.env.PORT || 3000);
    this.setupMiddleware();
    this.setupHocusPocus();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    // Middleware for response compression
    this.app.use(compression({ level: 6, threshold: 5 * 1000 }));
    // Logging middleware
    this.app.use(logger);
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // cors middleware
    this.app.use(cors());
    this.app.use(process.env.LIVE_BASE_PATH || "/live", this.router);
  }

  private async setupHocusPocus() {
    this.hocuspocusServer = await getHocusPocusServer().catch((err) => {
      manualLogger.error("Failed to initialize HocusPocusServer:", err);
      process.exit(1);
    });
  }

  private setupRoutes() {
    this.router.get("/health", (_req: Request, res: Response) => {
      res.status(200).json({ status: "OK" });
    });

    this.router.ws("/collaboration", (ws: any, req: Request) => {
      try {
        this.hocuspocusServer.handleConnection(ws, req);
      } catch (err) {
        manualLogger.error("WebSocket connection error:", err);
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
        manualLogger.error("Error in /convert-document endpoint:", error);
        res.status(500).send({
          message: `Internal server error. ${error}`,
        });
      }
    });

    this.app.use((err: any, _req: Request, res: Response) => {
      res.status(404).send("Not Found");
    });

    // this.app.use((err: any, _req: Request, res: Response) => {
    //   // Set the response status
    //   res.status(err.status || 500);

    //   // Send the response
    //   res.json({
    //     error: {
    //       message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message,
    //       ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
    //     },
    //   });
    // });
  }

  public listen() {
    this.app.listen(this.app.get("port"), () => {
      manualLogger.info(`Plane Live server has started at port ${this.app.get("port")}`);
    });
  }

  public async destroy() {
    // Close the HocusPocus server WebSocket connections
    await this.hocuspocusServer.destroy();
    manualLogger.info("HocusPocus server WebSocket connections closed gracefully.");
    // Close the Express server
    this.app.close(() => {
      manualLogger.info("Express server closed gracefully.");
      process.exit(1);
    });
  }
}

const server = new Server();
server.listen();

// Graceful shutdown on unhandled rejection
process.on("unhandledRejection", async (err: any) => {
  manualLogger.info("Unhandled Rejection: ", err);
  manualLogger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
  await server.destroy();
});

// Graceful shutdown on uncaught exception
process.on("uncaughtException", async (err: any) => {
  manualLogger.info("Uncaught Exception: ", err);
  manualLogger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  await server.destroy();
});
