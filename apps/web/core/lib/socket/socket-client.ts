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

import { io } from "socket.io-client";
// types
import type { TSocketOptions, TConnectionStatus, TEntityEvent, TSocketInstance } from "./types/root";

const DEFAULT_OPTIONS = {
  withCredentials: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  timeout: 10000,
  url: "",
  path: "/socket.io",
} satisfies TSocketOptions;

export class SocketClient {
  private socket: TSocketInstance | null = null;
  private options: Required<TSocketOptions>;
  private currentWorkspaceSlug: string | null = null;
  private listeners = new Set<() => void>();
  private _status: TConnectionStatus = "disconnected";

  constructor(options: TSocketOptions) {
    this.options = {
      withCredentials: options.withCredentials ?? DEFAULT_OPTIONS.withCredentials,
      reconnectionAttempts: options.reconnectionAttempts ?? DEFAULT_OPTIONS.reconnectionAttempts,
      reconnectionDelay: options.reconnectionDelay ?? DEFAULT_OPTIONS.reconnectionDelay,
      reconnectionDelayMax: options.reconnectionDelayMax ?? DEFAULT_OPTIONS.reconnectionDelayMax,
      timeout: options.timeout ?? DEFAULT_OPTIONS.timeout,
      url: options.url ?? DEFAULT_OPTIONS.url,
      path: options.path ?? DEFAULT_OPTIONS.path,
    };
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * Connect to a workspace namespace
   */
  connect(workspaceSlug: string): void {
    // Already connected to this workspace
    if (this.currentWorkspaceSlug === workspaceSlug && this.socket?.connected) {
      return;
    }

    // Disconnect from previous workspace if any
    if (this.socket) {
      this.disconnect();
    }

    this.currentWorkspaceSlug = workspaceSlug;
    this.setStatus("connecting");

    // Build namespace: /events/{workspaceSlug} (for flux server)
    // Full URL will be: http://host:port/events/{workspaceSlug} with path /flux/socket.io
    const namespace = `/events/${workspaceSlug}`;
    const serverUrl = this.options.url;

    if (process.env.NODE_ENV === "development") {
      console.log("[WorkspaceSocket] Connecting to:", { serverUrl, namespace, path: this.options.path });
    }

    // Create typed socket connection to namespaced endpoint
    this.socket = io(`${serverUrl}${namespace}`, {
      path: this.options.path,
      withCredentials: this.options.withCredentials,
      reconnectionAttempts: this.options.reconnectionAttempts,
      reconnectionDelay: this.options.reconnectionDelay,
      reconnectionDelayMax: this.options.reconnectionDelayMax,
      timeout: this.options.timeout,
      transports: ["websocket", "polling"],
    });

    this.setupListeners();
  }

  /**
   * Disconnect from current workspace
   */
  disconnect(): void {
    if (!this.socket) return;

    if (process.env.NODE_ENV === "development") {
      console.log("[WorkspaceSocket] Disconnecting socket from workspace:", this.currentWorkspaceSlug);
    }

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.currentWorkspaceSlug = null;
    this.setStatus("disconnected");
  }

  /**
   * Subscribe to events for a specific entity.
   * Joins the server-side room so only events for this entity are delivered.
   */
  subscribeEntity(entityType: string, entityId: string, handler: (data: TEntityEvent) => void): () => void {
    const socket = this.socket;
    if (!socket) {
      console.warn(`[WorkspaceSocket] Cannot subscribe to entity "${entityId}" - not connected`);
      return () => {};
    }

    const room = `${entityType}:${entityId}` as const;
    socket.emit("subscribe:entity", { entityType, entityId });
    socket.on(room, handler);

    return () => {
      socket.off(room, handler);
      // Only send unsubscribe if still connected — server-side rooms are already
      // cleaned up on disconnect, and buffering during reconnect causes ordering issues
      if (socket.connected) {
        socket.emit("unsubscribe:entity", { entityType, entityId });
      }
    };
  }

  /**
   * Subscribe to status changes (useSyncExternalStore-compatible)
   */
  onStatusChange = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /**
   * Get current status snapshot (useSyncExternalStore-compatible)
   */
  getStatus = (): TConnectionStatus => this._status;

  // ===========================================================================
  // Private methods
  // ===========================================================================

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.setStatus("connected");

      if (process.env.NODE_ENV === "development") {
        console.log(`[WorkspaceSocket] Connected to workspace namespace: ${this.currentWorkspaceSlug}`);
      }
    });

    this.socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[WorkspaceSocket] Disconnected: ${reason}`);
      }

      if (reason === "io server disconnect" || reason === "io client disconnect") {
        // Server forcefully disconnected or client called disconnect() — won't auto-reconnect
        this.setStatus("disconnected");
      } else {
        // Transport close, ping timeout, etc. — Socket.IO will auto-reconnect
        this.setStatus("reconnecting");
      }
    });

    this.socket.io.on("reconnect_attempt", (attempt) => {
      this.setStatus("reconnecting");

      if (process.env.NODE_ENV === "development") {
        console.log(`[WorkspaceSocket] Reconnection attempt ${attempt}`);
      }
    });

    this.socket.io.on("reconnect", () => {
      this.setStatus("connected");

      if (process.env.NODE_ENV === "development") {
        console.log(`[WorkspaceSocket] Reconnected to workspace namespace: ${this.currentWorkspaceSlug}`);
      }
    });

    this.socket.io.on("reconnect_failed", () => {
      this.setStatus("disconnected");
      console.error("[WorkspaceSocket] Reconnection failed after all attempts");
    });

    this.socket.on("connect_error", (error) => {
      if (process.env.NODE_ENV === "development") {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[WorkspaceSocket] Connection error:", message);
      }
    });
  }

  private setStatus(status: TConnectionStatus): void {
    if (this._status === status) return;

    this._status = status;
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("[WorkspaceSocket] Error in status listener:", error);
        }
      }
    }
  }
}
