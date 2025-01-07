import * as Sentry from "@sentry/node";
import compression from "compression";
import cors from "cors";
import expressWs from "express-ws";
import express from "express";
import helmet from "helmet";
// config
import "@/core/config/sentry-config.js";
// hocuspocus server
import { getHocusPocusServer } from "@/core/hocuspocus-server.js";
// helpers
import { convertHTMLDocumentToAllFormats } from "@/core/helpers/convert-document.js";
import { logger, manualLogger } from "@/core/helpers/logger.js";
import { errorHandler } from "@/core/helpers/error-handler.js";
// types
import { TConvertDocumentRequestBody } from "@/core/types/common.js";

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
app.use(logger);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cors middleware
app.use(cors());

const router = express.Router();

const HocusPocusServer = await getHocusPocusServer().catch((err) => {
  manualLogger.error("Failed to initialize HocusPocusServer:", err);
  process.exit(1);
});

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

router.ws("/collaboration", (ws, req) => {
  try {
    HocusPocusServer.handleConnection(ws, req);
  } catch (err) {
    manualLogger.error("WebSocket connection error:", err);
    ws.close();
  }
});

router.post("/convert-document", (req, res) => {
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

app.use(process.env.LIVE_BASE_PATH || "/live", router);

app.use((_req, res) => {
  res.status(404).send("Not Found");
});

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

const liveServer = app.listen(app.get("port"), () => {
  manualLogger.info(`Plane Live server has started at port ${app.get("port")}`);
});

const gracefulShutdown = async () => {
  manualLogger.info("Starting graceful shutdown...");

  try {
    // Close the HocusPocus server WebSocket connections
    await HocusPocusServer.destroy();
    manualLogger.info("HocusPocus server WebSocket connections closed gracefully.");

    // Close the Express server
    liveServer.close(() => {
      manualLogger.info("Express server closed gracefully.");
      process.exit(1);
    });
  } catch (err) {
    manualLogger.error("Error during shutdown:", err);
    process.exit(1);
  }

  // Forcefully shut down after 10 seconds if not closed
  setTimeout(() => {
    manualLogger.error("Forcing shutdown...");
    process.exit(1);
  }, 10000);
};

// Graceful shutdown on unhandled rejection
process.on("unhandledRejection", (err: any) => {
  manualLogger.info("Unhandled Rejection: ", err);
  manualLogger.info(`UNHANDLED REJECTION! 💥 Shutting down...`);
  gracefulShutdown();
});

// Graceful shutdown on uncaught exception
process.on("uncaughtException", (err: any) => {
  manualLogger.info("Uncaught Exception: ", err);
  manualLogger.info(`UNCAUGHT EXCEPTION! 💥 Shutting down...`);
  gracefulShutdown();
});
