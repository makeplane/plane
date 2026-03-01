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
    const runtime = yield* Effect.runtime<never>();
    const startTime = Date.now();

    // Track workspace connections for health/stats
    const workspaceConnections = yield* Ref.make<HashMap.HashMap<string, WorkspaceConnection>>(HashMap.empty());

    const runPromise = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => {
      return Runtime.runPromise(runtime)(effect);
    };

    const runFork = <A, E>(effect: Effect.Effect<A, E, never>) => {
      Runtime.runFork(runtime)(effect);
    };

    // Health context
    const healthContext = {
      startTime,
      clients: workspaceConnections,
      channelSubscribers: yield* Ref.make<HashMap.HashMap<string, unknown>>(HashMap.empty()),
      redisConnected: () => Effect.succeed(true),
    };

    const basePath = config.fluxBasePath.endsWith("/") ? config.fluxBasePath.slice(0, -1) : config.fluxBasePath;

    // HTTP request handler for health endpoints
    const handleHttpRequest = (req: IncomingMessage, res: ServerResponse) => {
      const url = req.url || "/";

      if (url === `${basePath}/health` || url === "/health") {
        runPromise(handleHealthRequest(healthContext, req, res));
        return;
      }

      if (url === `${basePath}/ready` || url === "/ready") {
        runPromise(handleReadinessRequest(healthContext, req, res));
        return;
      }

      if (url === `${basePath}/live` || url === "/live") {
        runPromise(handleLivenessRequest(req, res));
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

      // Setup Redis adapter for horizontal scaling
      const redisUrl = Redacted.value(config.redisUrl);
      const pubClient = new Redis(redisUrl);
      const subClient = pubClient.duplicate();

      io.adapter(createAdapter(pubClient, subClient));
      yield* Effect.log("Redis adapter configured for Socket.IO");

      // Cleanup on shutdown
      yield* Effect.addFinalizer(() =>
        Effect.gen(function* () {
          yield* Effect.log("Shutting down Socket.IO server...");
          yield* Effect.promise(
            () =>
              new Promise<void>((resolve) => {
                io.close(() => {
                  httpServer.close(() => resolve());
                });
              })
          );
          yield* Effect.promise(() => pubClient.quit());
          yield* Effect.promise(() => subClient.quit());
          yield* Effect.log("Socket.IO server closed");
        }).pipe(Effect.catchAll(() => Effect.void))
      );

      // Setup authentication middleware for events namespace
      const authMiddleware = createAuthMiddleware({
        apiBaseUrl: config.apiBaseUrl,
        requireWorkspaceMembership: true,
      });

      // Setup namespace handlers
      const eventsNamespace = io.of(/^\/events\/[\w-]+$/);
      eventsNamespace.use(authMiddleware);
      setupEventsNamespace(eventsNamespace, { workspaceConnections, runFork });
      setupFluxNamespace(io, { runFork });

      // Start HTTP server
      yield* Effect.async<void>((resume) => {
        httpServer.listen(config.port, () => {
          resume(Effect.void);
        });
      });

      yield* Effect.logInfo(`Flux server listening on port ${config.port}`);
      yield* Effect.logInfo(`Socket.IO path: ${basePath}/socket.io`);
      yield* Effect.logInfo(`Events namespace: /events/{workspaceId}`);
      yield* Effect.logInfo(`Health endpoint: ${basePath}/health`);
    });

    return { start };
  }),
  dependencies: [AppConfig.Default],
}) {}

export const FluxServerLive = FluxServer.Default;
