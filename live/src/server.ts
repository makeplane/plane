import "@/core/config/sentry-config.js";

import express from "express";
import expressWs from "express-ws";
import * as Sentry from "@sentry/node";
import compression from "compression";
import helmet from "helmet";
import cors from "cors";
// core hocuspocus server
import { getHocusPocusServer } from "@/core/hocuspocus-server.js";
// helpers
import { coreLogger as LoggerMiddleware, logger } from "@/core/helpers/logger.js";
import { errorHandler } from "@/core/helpers/error-handler.js";
import { resolveDocumentConflicts, TResolveConflictsRequestBody } from "@/core/resolve-conflicts.js";

const app = express();
expressWs(app);

app.set("port", process.env.PORT || 3000);

// Security middleware
app.use(helmet());

// Middleware for response compression
app.use(
  compression({
    level: 6,
    threshold: 5 * 1000,
  })
);

// Logging middleware
app.use(LoggerMiddleware);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cors middleware
app.use(cors());

const router = express.Router();

const HocusPocusServer = await getHocusPocusServer().catch((err) => {
  logger.error("Failed to initialize HocusPocusServer:", err);
  process.exit(1);
});

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

router.ws("/collaboration", (ws, req) => {
  try {
    HocusPocusServer.handleConnection(ws, req);
  } catch (err) {
    logger.error("WebSocket connection error:", err);
    ws.close();
  }
});

app.post("/resolve-document-conflicts", (req, res) => {
  const { original_document, updates } = req.body as TResolveConflictsRequestBody;
  try {
    if (original_document === undefined || updates === undefined) {
      res.status(400).send({
        message: "Missing required fields",
      });
      return;
    }
    const resolvedDocument = resolveDocumentConflicts(req.body);
    res.status(200).json(resolvedDocument);
  } catch (error) {
    logger.error("Error in /resolve-document-conflicts endpoint:", error);
    res.status(500).send({
      message: "Internal server error",
    });
  }
});

app.use(process.env.LIVE_BASE_PATH || "/live", router);

app.use((_req, res) => {
  res.status(404).send("Not Found");
});

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

const liveServer = app.listen(app.get("port"), () => {
  logger.info(`Plane Live server has started at port ${app.get("port")}`);
});

const gracefulShutdown = async () => {
  logger.info("Starting graceful shutdown...");

  try {
    // Close the HocusPocus server WebSocket connections
    await HocusPocusServer.destroy();
    logger.info("HocusPocus server WebSocket connections closed gracefully.");

    // Close the Express server
    liveServer.close(() => {
      logger.info("Express server closed gracefully.");
      process.exit(1);
    });
  } catch (err) {
    logger.error("Error during shutdown:", err);
    process.exit(1);
  }

  // Forcefully shut down after 10 seconds if not closed
  setTimeout(() => {
    logger.error("Forcing shutdown...");
    process.exit(1);
  }, 10000);
};

// Graceful shutdown on unhandled rejection
process.on("unhandledRejection", (err: any) => {
  logger.info("Unhandled Rejection: ", err);
  logger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
  gracefulShutdown();
});

// Graceful shutdown on uncaught exception
process.on("uncaughtException", (err: any) => {
  logger.info("Uncaught Exception: ", err);
  logger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  gracefulShutdown();
});
