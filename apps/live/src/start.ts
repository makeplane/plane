/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { logger } from "@plane/logger";
import { env } from "@/env";
import { AppError } from "@/lib/errors";
import { Server } from "./server";

// Warn (without refusing to start) when the shared key is the template value or an older shipped default.
const INSECURE_LIVE_SERVER_SECRET_KEYS = new Set([
  "change-this-key-on-deployment",
  "htbqvBJAgpm9bzvf3r4urJer0ENReatceh",
  "2FiJk1U2aiVPEQtzLehYGlTSnTnrs7LW",
]);
if (INSECURE_LIVE_SERVER_SECRET_KEYS.has(env.LIVE_SERVER_SECRET_KEY)) {
  logger.error(
    "SECURITY: LIVE_SERVER_SECRET_KEY is set to a placeholder or default value from the env templates. " +
      "Set the same unique value for the API and Live services (the latest CLI setup.sh generates it on " +
      "install and upgrade) and restart both."
  );
}

let server: Server;

async function startServer() {
  server = new Server();
  try {
    await server.initialize();
    server.listen();
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

// Handle process signals
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM signal. Initiating graceful shutdown...");
  try {
    if (server) {
      await server.destroy();
    }
    logger.info("Server shut down gracefully");
  } catch (error) {
    logger.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT signal. Killing node process...");
  try {
    if (server) {
      await server.destroy();
    }
    logger.info("Server shut down gracefully");
  } catch (error) {
    logger.error("Error during graceful shutdown:", error);
    process.exit(1);
  }
  process.exit(1);
});

process.on("unhandledRejection", (err: Error) => {
  const error = new AppError(err);
  logger.error(`[UNHANDLED_REJECTION]`, error);
});

process.on("uncaughtException", (err: Error) => {
  const error = new AppError(err);
  logger.error(`[UNCAUGHT_EXCEPTION]`, error);
});
