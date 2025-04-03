import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import expressWs from "express-ws";
import helmet from "helmet";
import path from "path";
import { Server as HocusPocusServer, Hocuspocus } from "@hocuspocus/server";
import { v4 as uuidv4 } from "uuid";
import { onAuthenticate, onStateless, handleDataFetch, handleDataStore } from "./hocuspocus";
import { Logger } from "@hocuspocus/extension-logger";
import { Database } from "@hocuspocus/extension-database";
// controllers
import { HealthController } from "@/core/controllers/health.controller";
import { DocumentController } from "@/core/controllers/document.controller";
import { CollaborationController } from "@/core/controllers/collaboration.controller";
import { registerControllers } from "./lib/controller.utils";

export default class Server {
  app: Application;
  PORT: number;
  BASE_PATH: string;
  CORS_ALLOWED_ORIGINS: string;
  hocuspocusServer: Hocuspocus | null = null;

  constructor() {
    this.PORT = parseInt(process.env.PORT || "3000");
    this.BASE_PATH = process.env.LIVE_BASE_PATH || "/";
    this.CORS_ALLOWED_ORIGINS = process.env.CORS_ALLOWED_ORIGINS || "*";
    // Initialize express app
    this.app = express();
    expressWs(this.app as any);
    // Security middleware
    this.app.use(helmet());
    // cors
    this.setupCors();
    // Cookie parsing
    this.app.use(cookieParser());
    // Body parsing middleware
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    // static files
    this.app.use(express.static(path.join(__dirname, "public")));
    // setup redis
    this.setupRedis();
    // setup hocuspocus server
    this.setupHocuspocusServer();
    // setup controllers
    this.setupControllers();
  }

  private setupCors() {
    const origin = this.CORS_ALLOWED_ORIGINS.split(",").map((origin) => origin.trim());
    this.app.use(
      cors({
        origin,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      })
    );
  }

  private setupRedis() {}

  private setupHocuspocusServer() {
    const serverName = process.env.HOSTNAME || uuidv4();
    this.hocuspocusServer = HocusPocusServer.configure({
      name: serverName,
      onAuthenticate: onAuthenticate(),
      onStateless: onStateless(),
      debounce: 1000,
      extensions: [
        new Logger(),
        new Database({
          fetch: handleDataFetch,
          store: handleDataStore,
        }),
      ],
    });
  }

  private setupControllers() {
    const router = express.Router();
    registerControllers(router, [HealthController, DocumentController, CollaborationController]);
    this.app.use(this.BASE_PATH, router);
  }

  start() {
    this.app.listen(this.PORT, () => {
      console.log(`Plane Live server has started at port ${this.PORT}`);
    });
  }
}
