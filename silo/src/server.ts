// sentry
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import dotenv from "dotenv";
import express, { Application } from "express";
import cors from "cors";
// lib
import { registerControllers } from "./lib/controller";
// controllers
import { JobConfigController, JobController, CredentialController } from "@/apps/engine/controllers";

import JiraController from "@/apps/jira-importer/controllers";
import LinearController from "@/apps/linear-importer/controllers";
import { env } from "./env";
import { logger } from "./logger";

const controllers = [JobController, JobConfigController, CredentialController];
const appControllers = [JiraController, LinearController];

export class Server {
  app: Application;
  port: number;

  constructor() {
    this.app = express();
    this.app.use(express.json());
    this.port = Number(env.PORT);
    // cors
    this.app.use(cors());
    // set up dotenv
    dotenv.config();
    // set up controllers
    this.setupControllers();
    // sentry setup
    this.setupSentry();
  }

  setupControllers() {
    // Setup app controllers
    controllers.forEach((controller) => registerControllers(this.app, controller));
    // Setup controllers for importers
    appControllers.forEach((controller) => registerControllers(this.app, controller));
  }

  setupSentry() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: 1.0,
      profilesSampleRate: 1.0,
    });
    Sentry.setupExpressErrorHandler(this.app);
  }

  start() {
    this.app.listen(this.port, () => {
      logger.info(`Silo started serving on port ${this.port}, 🦊🦊🦊`);
    });
  }
}
