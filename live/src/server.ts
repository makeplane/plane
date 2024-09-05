import "@/core/config/sentry-config.js";

import express from "express";
import expressWs from "express-ws";
import * as Sentry from "@sentry/node";

// cors
import cors from "cors";

// core hocuspocus server
import { HocusPocusServer } from "@/core/hocuspocus-server.js";

// helpers
import { logger, manualLogger } from "@/core/helpers/logger.js";
import { errorHandler } from "@/core/helpers/error-handler.js";

const app = express();
expressWs(app);

app.set("port", process.env.PORT || 3000);

// Logging middleware
app.use(logger);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// cors middleware
app.use(cors());

const router = express.Router();

router.get("/health", (_req, res) => {
  res.status(200).json({ status: "OK" });
});

router.ws("/collaboration", (ws, req) => {
  HocusPocusServer.handleConnection(ws, req);
});

app.use(process.env.LIVE_BASE_PATH || "/live", router);

app.use((_req, res, _next) => {
  res.status(404).send("Not Found");
});

Sentry.setupExpressErrorHandler(app);

app.use(errorHandler);

app.listen(app.get("port"), () => {
  manualLogger.info(`Plane Live server has started at port ${app.get("port")}`);
});
