import cookieParser from "cookie-parser";
import cors from "cors";
import * as dotenvx from "@dotenvx/dotenvx";
import express, { Application, Request, Response, NextFunction } from "express";

// lib
import expressWinston from "express-winston";
import AsanaController from "@/apps/asana-importer/controllers";
// controllers

// Engine Controllers
import {
  CredentialController,
  EntityConnectionController,
  JobController,
  HomeController,
  AppController,
  AssetsController,
  ConnectionsController,
} from "@/apps/engine/controllers";

import GithubController from "@/apps/github/controllers";
import JiraController from "@/apps/jira-importer/controllers";
import LinearController from "@/apps/linear-importer/controllers";
import ClickupController from "./apps/clickup-importer/controllers";
import CSVController from "./apps/flatfile/controllers";
import GithubEnterpriseController from "./apps/github-enterprise/controllers";
import GitlabController from "./apps/gitlab/controller";
import JiraDataCenterController from "./apps/jira-server-importer/controllers";
import { NotionController } from "./apps/notion-importer/controller";
import SentryControllers from "./apps/sentry/controllers";
import SlackController from "./apps/slack/controllers";

// Helpers and Utils
import { env } from "./env";
import { APIError } from "./lib";
import { registerControllers } from "./lib/controller";
import { logger } from "./logger";
// types
import { OAuthRoutes, registerOAuthStrategies } from "./services/oauth";
import { APIErrorResponse } from "./types";

export default class Server {
  private readonly app: Application;
  private readonly port: number;
  private static readonly CONTROLLERS = {
    PING: [HomeController],
    ENGINE: [
      AppController,
      JobController,
      CredentialController,
      ConnectionsController,
      AssetsController,
      EntityConnectionController,
    ],
    APPS: [
      JiraController,
      LinearController,
      GitlabController,
      AsanaController,
      NotionController,
      SlackController,
      GithubController,
      GithubEnterpriseController,
      JiraDataCenterController,
      CSVController,
      ClickupController,
      OAuthRoutes,
      ...SentryControllers,
    ],
  };

  constructor() {
    // Initialize environment variables first
    dotenvx.config();

    this.app = express();
    this.port = Number(env.PORT);

    this.setupMiddleware();
    this.setupLogger();
    this.setupControllers();
    this.setupErrorHandlers();
    this.setupProcessHandlers();
    registerOAuthStrategies();
  }

  private setupMiddleware(): void {
    // take the cors allowed origins from env, split by comma
    const origins = env.CORS_ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || [];
    this.app.use(
      cors({
        origin: origins,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      })
    );

    this.app.use(express.json({ limit: "25mb" }));
    this.app.use(cookieParser());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupLogger() {
    this.app.use(
      expressWinston.logger({
        winstonInstance: logger,
        msg: '"{req.method} {req.url}" {req.httpVersion}',
        expressFormat: true,
        colorize: true,
        requestWhitelist: [],
        responseWhitelist: ["statusCode"],
        bodyBlacklist: ["password", "authorization"],
        ignoreRoute: () => false,
      })
    );
  }

  private setupControllers(): void {
    const router = express.Router();
    const allControllers = [...Server.CONTROLLERS.PING, ...Server.CONTROLLERS.ENGINE, ...Server.CONTROLLERS.APPS];

    allControllers.forEach((controller) => registerControllers(router, controller));
    this.app.use(env.SILO_BASE_PATH || "/", router);
  }

  private setupErrorHandlers(): void {
    // Global error handling middleware
    this.app.use(this.handleError.bind(this));
    // 404 handler must be last
    this.app.use(this.handle404.bind(this));
  }

  private handleError(err: Error, req: Request, res: Response, next: NextFunction): void {
    const logError = {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
    };

    logger.error("Global error handler caught:", logError);

    const response: APIErrorResponse = {
      error: env.NODE_ENV === "production" ? "Internal Server Error" : err.message,
      status: err instanceof APIError ? err.statusCode : 500,
    };

    res.status(response.status).json(response);
  }

  private handle404(req: Request, res: Response): void {
    const response: APIErrorResponse = {
      error: "Not Found",
      status: 404,
    };

    res.status(404).json(response);
  }

  private setupProcessHandlers(): void {
    process.on("unhandledRejection", (reason) => {
      logger.error("Unhandled Rejection at:", reason);
    });

    process.on("uncaughtException", (err) => {
      logger.error("Uncaught Exception thrown:", err);
      process.exit(1);
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Silo started serving on port ${this.port}, 🦊🦊🦊`);
    });
  }
}
