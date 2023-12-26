import dotenv from "dotenv";
import path from "path";
import express from "express";
import { Server } from "@overnightjs/core";
import cors from "cors";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createServer, Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
// controllers
import * as controllers from "./controller";
// middlewares
import loggerMiddleware from "./middleware/logger.middleware";
// utils
import { logger } from "./utils/logger";
// db
import { DatabaseSingleton } from "./db/singleton";
// mq
import { MQSingleton } from "./mq/singleton";

class ApiServer extends Server {
  private readonly SERVER_STARTED = "🚀 Api server started on port: ";
  SERVER_PORT: number;
  db: PostgresJsDatabase | null = null;
  mq: MQSingleton | null = null; // Declare the channel property
  io: SocketIOServer;
  httpServer: HTTPServer;

  constructor() {
    super(true);
    // disabling overnight logs
    this.showLogs = false;
    // enabling env variable from .env file
    dotenv.config();
    // assigning port
    this.SERVER_PORT = process.env.SERVER_PORT
      ? parseInt(process.env.SERVER_PORT, 10)
      : 8080;

    // socket server setup
    // Initialize the HTTP server
    this.httpServer = createServer(this.app);
    // Initialize Socket.IO
    this.io = new SocketIOServer(this.httpServer);
    this.setupSocketIO();

    // logger
    this.app.use(loggerMiddleware);
    // exposing public folder for static files.
    this.app.use(express.static("public"));
    // body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // views engine
    this.app.set("views", path.join(__dirname, "views"));
    this.app.set("view engine", "hbs");
    // cors
    this.app.use(cors());
    // setup mq
    this.setupMQ();
    // sentry setup
    if (
      process.env.APP_ENV === "staging" ||
      process.env.APP_ENV === "production"
    ) {
      // setting up error logging and tracing.
      this.setupSentryInit();
    }
    // setting up db
    this.setupDatabase();
    // setting up controllers
    this.setupControllers();
    // not found page
    this.setupNotFoundHandler();
    // setting up sentry error handling
    this.sentryErrorHandling();
  }

  // get the current app instance
  public getAppInstance() {
    return this.app;
  }

  // Setup the database
  private setupDatabase(): void {
    this.db = DatabaseSingleton.getInstance().db;
  }

  // Setup MQ and initialize channel
  private setupMQ(): void {
    this.mq = MQSingleton.getInstance();
    this.startMQAndWorkers().catch((error) =>
      logger.error("Error in startMQAndWorkers:", error)
    );
  }

  // Start mq and workers
  private async startMQAndWorkers(): Promise<void> {
    try {
      await this.mq?.initialize();
    } catch (error) {
      logger.error("Failed to initialize MQ:", error);
    }
  }


  // setup all the controllers
  private setupControllers(): void {
    const controllerInstances = [];
    for (const name in controllers) {
      if (Object.prototype.hasOwnProperty.call(controllers, name)) {
        const Controller = (controllers as any)[name];
        controllerInstances.push(new Controller(this.db, this.mq));
      }
    }
    super.addControllers(controllerInstances);
  }


  // This controller will return 404 for not found pages
  private setupNotFoundHandler(): void {
    this.app.use((req, res) => {
      res.status(404).json({
        status: "error",
        message: "Not Found",
        path: req.path,
      });
    });
  }

  private setupSentryInit() {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      integrations: [
        // enable HTTP calls tracing
        new Sentry.Integrations.Http({ tracing: true }),
        // enable Express.js middleware tracing
        new Tracing.Integrations.Express({ app: this.app }),
      ],
      // Set tracesSampleRate to 1.0 to capture 100%
      // of transactions for performance monitoring.
      // We recommend adjusting this value in production
      tracesSampleRate: 1.0,
    });

    // RequestHandler creates a separate execution context using domains, so that every
    // transaction/span/breadcrumb is attached to its own Hub instance
    this.app.use(Sentry.Handlers.requestHandler());
    // TracingHandler creates a trace for every incoming request
    this.app.use(Sentry.Handlers.tracingHandler());
  }

  private sentryErrorHandling() {
    // The error handler must be before any other error middleware and after all controllers
    this.app.use(Sentry.Handlers.errorHandler());

    this.app.use(function onError(req, res: any) {
      // The error id is attached to `res.sentry` to be returned
      // and optionally displayed to the user for support.
      res.statusCode = 500;
      res.end(res.sentry + "\n");
    });
  }

  private setupSocketIO(): void {
    this.io.on("connection", (socket) => {
      logger.info("Client connected")
      socket.on("disconnect", () => logger.info("Client disconnected"));
    });
  }

  public start(port: number): void {
    this.httpServer.listen(port, () => {
      logger.info(this.SERVER_STARTED + port);
    });
  }
}

export default ApiServer;
