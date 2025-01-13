// sentry
import { initializeSentry, SentryInstance } from "./sentry-config";
import cors from "cors";
import dotenv from "dotenv";
import express, { Application, Request, Response, NextFunction } from "express";

// lib
import { registerControllers } from "./lib/controller";
import { APIError } from "./lib";
// controllers
import { HomeController } from "@/controllers";
import AsanaController from "@/apps/asana-importer/controllers";
import {
  CredentialController,
  EntityConnectionController,
  JobConfigController,
  JobController,
} from "@/apps/engine/controllers";
import { ConnectionsController } from "@/apps/engine/controllers/connection.controller";
import GithubController from "@/apps/github/controllers";
import JiraController from "@/apps/jira-importer/controllers";
import LinearController from "@/apps/linear-importer/controllers";
import { GitlabController } from "./apps/gitlab";
import { SlackController } from "./apps/slack/controllers";
import { env } from "./env";
import { expressLogger, logger } from "./logger";
import expressWinston from "express-winston";
import JiraDataCenterController from "./apps/jira-server-importer/controllers";
import { AssetsController } from "./apps/engine/controllers/assets.controller";
// types
import { APIErrorResponse } from "./types";


export default class Server {
  private readonly app: Application;
  private readonly port: number;
  private static readonly CONTROLLERS = {
    PING: [HomeController],
    ENGINE: [
      JobController,
      JobConfigController,
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
      SlackController,
      GithubController,
      JiraDataCenterController,
    ],
  };

  constructor() {
    // Initialize environment variables first
    dotenv.config();

    this.app = express();
    this.port = Number(env.PORT);

    this.setupSentry();
    this.setupMiddleware();
    this.setupControllers();
    this.setupErrorHandlers();
    this.setupProcessHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(this.setupLogger());
  }

  private setupLogger() {
    return expressWinston.logger({
      winstonInstance: expressLogger,
      msg: '"{req.method} {req.url}" {req.httpVersion}',
      expressFormat: true,
      colorize: true,
      requestWhitelist: [],
      responseWhitelist: ["statusCode"],
      bodyBlacklist: ["password", "authorization"],
      ignoreRoute: () => false,
    });
  }

  private setupControllers(): void {
    const router = express.Router();
    const allControllers = [
      ...Server.CONTROLLERS.PING,
      ...Server.CONTROLLERS.ENGINE,
      ...Server.CONTROLLERS.APPS,
    ];
    
    allControllers.forEach((controller) => registerControllers(router, controller));
    this.app.use(env.SILO_BASE_PATH || "/", router);
  }

  private setupSentry(): void {
    initializeSentry()
  }

  private setupErrorHandlers(): void {
    // Global error handling middleware
    this.app.use(this.handleError.bind(this));
    // 404 handler must be last
    this.app.use(this.handle404.bind(this));
  }

  private handleError(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void {
    const logError = {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
    };

    logger.error('Global error handler caught:', logError);

    if (SentryInstance) {
      SentryInstance.captureException(err);
    }

    const response: APIErrorResponse = {
      error: env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
      status: err instanceof APIError ? err.statusCode : 500,
    };

    res.status(response.status).json(response);
  }

  private handle404(req: Request, res: Response): void {
    const response: APIErrorResponse = {
      error: 'Not Found',
      status: 404,
    };
    
    res.status(404).json(response);
  }

  private setupProcessHandlers(): void {
    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection at:', reason);
      if (SentryInstance) {
        SentryInstance.captureException(reason);
      }
    });

    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception thrown:', err);
      if (SentryInstance) {
        SentryInstance.captureException(err);
      }
      process.exit(1);
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      logger.info(`Silo started serving on port ${this.port}, 🦊🦊🦊`);
    });
  }
}