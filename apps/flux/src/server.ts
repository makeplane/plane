/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { Effect, Ref, HashMap, Runtime, Scope, Redacted } from "effect";
import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { AppConfig } from "./services/config";
import { AuthService } from "./services/auth";
import { WorkspaceRegistry } from "./services/workspace-registry";
import { RedisClient } from "./services/redis";
import {
  handleHealthRequest,
  handleReadinessRequest,
  handleLivenessRequest,
  setupEventsNamespace,
  setupFluxNamespace,
} from "./handlers";
import type { WorkspaceConnection } from "./handlers";
import { createAuthMiddleware } from "./middleware";

export class FluxServer extends Effect.Service<FluxServer>()("FluxServer", {
  effect: Effect.gen(function* () {
    const config = yield* AppConfig;
    const auth = yield* AuthService;
    const registry = yield* WorkspaceRegistry;
    const redisClient = yield* RedisClient;
    const runtime = yield* Effect.runtime<never>();
    const startTime = Date.now();

    const runPromise = Runtime.runPromise(runtime);
    const runFork = Runtime.runFork(runtime);

    // Track workspace connections for health/stats
    const workspaceConnections = yield* Ref.make<HashMap.HashMap<string, WorkspaceConnection>>(HashMap.empty());

    // Health context
    const healthContext = {
      startTime,
      clients: workspaceConnections,
      channelSubscribers: yield* Ref.make<HashMap.HashMap<string, unknown>>(HashMap.empty()),
      redisConnected: () =>
        Effect.tryPromise({
          try: () => redisClient.ping(),
          catch: () => false,
        }).pipe(
          Effect.map(() => true),
          Effect.catchAll(() => Effect.succeed(false))
        ),
    };

    const basePath = config.basePath;

    // HTTP request handler for health endpoints
    const handleHttpRequest = (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url || "/";

      if (url === `${basePath}/health` || url === "/health") {
        void runPromise(handleHealthRequest(healthContext, req, res));
        return;
      }

      if (url === `${basePath}/ready` || url === "/ready") {
        void runPromise(handleReadinessRequest(healthContext, req, res));
        return;
      }

      if (url === `${basePath}/live` || url === "/live") {
        void runPromise(handleLivenessRequest(req, res));
        return;
      }

      if (url === basePath || url === `${basePath}/` || url === "/") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ service: "flux", version: "1.0.0", basePath }));
        return;
      }

      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    };

    const start: Effect.Effect<void, never, Scope.Scope> = Effect.gen(function* () {
      const httpServer = createServer(handleHttpRequest);

      // Create Socket.IO server
      const io = new SocketIOServer(httpServer, {
        path: `${basePath}/socket.io`,
        cors: {
          origin: config.corsOrigin,
          methods: ["GET", "POST"],
          credentials: true,
        },
        transports: ["websocket", "polling"],
      });

      // Setup Redis adapter for horizontal scaling (needs dedicated pub/sub clients)
      const redisUrl = Redacted.value(config.redisUrl);
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();

      io.adapter(createAdapter(pubClient, subClient));
      yield* Effect.log("Redis adapter configured for Socket.IO");

      // Cleanup on shutdown
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Effect.log("Shutting down Socket.IO server...");
          // io.close() also closes the underlying httpServer when one was passed to the constructor
          yield* Effect.promise(() => io.close());
          yield* Effect.promise(() => pubClient.quit());
          yield* Effect.promise(() => subClient.quit());
          yield* Effect.log("Socket.IO server closed");
        }).pipe(Effect.catchAll(() => Effect.void))
      );

      // Setup authentication middleware for events namespace
      const authMiddleware = createAuthMiddleware({
        auth,
        registry,
        runPromise,
        runFork: (effect) => {
          runFork(effect);
        },
        requireWorkspaceMembership: true,
      });

      // Setup namespace handlers
      const eventsNamespace = io.of(/^\/events\/[\w-]+$/);
      eventsNamespace.use((socket, next) => {
        void authMiddleware(socket, next);
      });
      setupEventsNamespace(eventsNamespace, {
        workspaceConnections,
        registry,
        runFork: (effect) => {
          runFork(effect);
        },
      });
      setupFluxNamespace(io, {
        runFork: (effect) => {
          runFork(effect);
        },
      });

      // Start HTTP server
      yield* Effect.async<void>((resume) => {
        httpServer.listen(config.port, () => {
          resume(Effect.void);
        });
      });

      yield* Effect.logInfo(`Flux server listening on port ${config.port}`);
      yield* Effect.logInfo(`Socket.IO path: ${basePath}/socket.io`);
      yield* Effect.logInfo(`Events namespace: /events/{workspaceSlug}`);
      yield* Effect.logInfo(`Health endpoint: ${basePath}/health`);
    });

    return { start };
  }),
  dependencies: [AppConfig.Default, AuthService.Default, WorkspaceRegistry.Default, RedisClient.Default],
}) {}
