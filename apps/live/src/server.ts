import compression from "compression";
import cors from "cors";
import expressWs from "express-ws";
import type { WebSocket } from "ws";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { type Server as HTTPServer } from "http";
// hocuspocus server
import { getHocusPocusServer, type Hocuspocus } from "@/core/hocuspocus-server.js";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document.js";
import { logger, manualLogger } from "@/core/helpers/logger.js";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common.js";

process.title = "Plane Live Server";

export class Server {
  private app: expressWs.Application;
  private router: expressWs.Router;
  private hocuspocusServer: Hocuspocus | undefined;
  private httpServer: HTTPServer | undefined;

  constructor() {
    const { app } = expressWs(express());
    this.app = app;
    this.app.set("port", process.env.PORT || 3000);
    this.router = express.Router() satisfies expressWs.Router;
    this.setupMiddleware();
  }

  async init() {
    await this.setupHocusPocus();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(compression({ level: 6, threshold: 5 * 1000 }));
    this.app.use(logger);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
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

    this.router.ws("/collaboration", (ws: WebSocket, req: Request) => {
      try {
        if (!this.hocuspocusServer) {
          throw new Error("HocusPocus server is not initialized");
        }

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
    this.httpServer = this.app.listen(this.app.get("port"), () => {
      manualLogger.info(`Plane Live server has started at port ${this.app.get("port")}`);
    });
  }

  public async destroy() {
    if (this.hocuspocusServer) {
      await this.hocuspocusServer.destroy();
      manualLogger.info("HocusPocus server WebSocket connections closed gracefully.");
    }

    if (this.httpServer) {
      this.httpServer.close(() => {
        manualLogger.info("Express server closed gracefully.");
        process.exit(1);
      });
    }
  }
}

const server = new Server();

// Graceful shutdown on unhandled rejection
process.on("unhandledRejection", async (err: unknown) => {
  manualLogger.info("Unhandled Rejection: ", err);
  manualLogger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
  await server.destroy();
});

// Graceful shutdown on uncaught exception
process.on("uncaughtException", async (err: unknown) => {
  manualLogger.info("Uncaught Exception: ", err);
  manualLogger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  await server.destroy();
});

const main = async () => {
  await server.init();
  server.listen();
};

main();
