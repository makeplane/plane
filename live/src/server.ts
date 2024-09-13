import "@/core/config/sentry-config.js";

import express from "express";
import expressWs from "express-ws";
import * as Sentry from "@sentry/node";
import compression from "compression";
import helmet from "helmet";

// cors
import cors from "cors";

// core hocuspocus server
import { getHocusPocusServer } from "@/core/hocuspocus-server.js";

// helpers
import { logger, manualLogger } from "@/core/helpers/logger.js";
import { errorHandler } from "@/core/helpers/error-handler.js";

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
  }),
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
    manualLogger.info(
      "HocusPocus server WebSocket connections closed gracefully.",
    );

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
