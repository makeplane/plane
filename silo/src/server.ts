// sentry
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application } from "express";
// lib
import { registerControllers } from "./lib/controller";
// controllers
import AsanaController from "@/apps/asana-importer/controllers";
import { CredentialController, JobConfigController, JobController } from "@/apps/engine/controllers";
import { ConnectionsController } from "@/apps/engine/controllers/connection.controller";
import GithubController from "@/apps/github/controllers";
import JiraController from "@/apps/jira-importer/controllers";
import LinearController from "@/apps/linear-importer/controllers";
import { GitlabController } from "./apps/gitlab";
import { SlackController } from "./apps/slack/controllers";
import { env } from "./env";
import { logger } from "./logger";

const controllers = [JobController, JobConfigController, CredentialController, ConnectionsController];
const appControllers = [
  JiraController,
  LinearController,
  GithubController,
  GitlabController,
  AsanaController,
  SlackController,
];

export class Server {
  app: Application;
  port: number;

  constructor() {
    this.app = express();
    this.port = Number(env.PORT);
    // cors
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

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
