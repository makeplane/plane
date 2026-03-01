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
import type {
  TSocketOptions,
  TConnectionStatus,
  TServerEventName,
  TServerEventListener,
  TSocketInstance,
} from "./types/root";

const DEFAULT_OPTIONS = {
  withCredentials: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30000,
  timeout: 10000,
  url: "",
  path: "/socket.io",
} satisfies TSocketOptions;

type TStatusChangeHandler = (status: TConnectionStatus) => void;

export class SocketClient {
  private socket: TSocketInstance | null = null;
  private options: Required<TSocketOptions>;
  private currentWorkspaceId: string | null = null;
  private statusChangeHandler: TStatusChangeHandler | null = null;
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

  get status(): TConnectionStatus {
    return this._status;
  }

  get workspaceId(): string | null {
    return this.currentWorkspaceId;
  }

  /**
   * Connect to a workspace namespace
   */
  connect(workspaceId: string): void {
    // Already connected to this workspace
    if (this.currentWorkspaceId === workspaceId && this.socket?.connected) {
      return;
    }

    // Disconnect from previous workspace if any
    if (this.socket) {
      this.disconnect();
    }

    this.currentWorkspaceId = workspaceId;
    this.setStatus("connecting");

    // Build namespace: /events/{workspaceId} (for flux server)
    // Full URL will be: http://host:port/events/{workspaceId} with path /flux/socket.io
    const namespace = `/events/${workspaceId}`;
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
      console.log("[WorkspaceSocket] Disconnecting socket from workspace:", this.currentWorkspaceId);
    }

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.currentWorkspaceId = null;
    this.setStatus("disconnected");
  }

  /**
   * Subscribe to a server event with full type safety
   *
   * Note: Socket.IO's type system uses FallbackToUntypedListener which doesn't properly
   * recognize our generic event handler types. The handlers are type-safe at the API level,
   * and Socket.IO will call them correctly at runtime. We use ts-expect-error to acknowledge
   * this known Socket.IO typing limitation while maintaining full type safety for users of this API.
   */
  subscribe<E extends TServerEventName>(event: E, handler: TServerEventListener<E>): () => void {
    if (!this.socket) {
      console.warn(`[WorkspaceSocket] Cannot subscribe to "${event}" - not connected`);
      return () => {};
    }

    // Socket.IO's complex conditional types don't recognize our handler type
    // but it's type-safe and will work correctly at runtime
    // @ts-expect-error - Socket.IO FallbackToUntypedListener type limitation
    this.socket.on(event, handler);

    // Return unsubscribe function
    return () => {
      if (this.socket) {
        // @ts-expect-error - Socket.IO FallbackToUntypedListener type limitation
        this.socket.off(event, handler);
      }
    };
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(handler: TStatusChangeHandler): () => void {
    this.statusChangeHandler = handler;
    // Immediately call with current status
    handler(this._status);

    return () => {
      this.statusChangeHandler = null;
    };
  }

  // ===========================================================================
  // Private methods
  // ===========================================================================

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.setStatus("connected");

      if (process.env.NODE_ENV === "development") {
        console.log(`[WorkspaceSocket] Connected to workspace namespace: ${this.currentWorkspaceId}`);
      }
    });

    this.socket.on("disconnect", (reason) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[WorkspaceSocket] Disconnected: ${reason}`);
      }

      // Socket.IO will auto-reconnect for these reasons
      if (reason === "io server disconnect") {
        // Server forcefully disconnected, won't auto-reconnect
        this.setStatus("disconnected");
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
        console.log(`[WorkspaceSocket] Reconnected to workspace namespace: ${this.currentWorkspaceId}`);
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
    if (this.statusChangeHandler) {
      try {
        this.statusChangeHandler(status);
      } catch (error) {
        console.error("[WorkspaceSocket] Status change handler error:", error);
      }
    }
  }
}
