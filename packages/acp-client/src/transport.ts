/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Stream } from "@agentclientprotocol/sdk";
import {
  createWebSocketStream,
  type WebSocketConstructor,
  type WebSocketLike,
} from "@agentclientprotocol/sdk/experimental/ws-client";

import { AgentCloseCode, type CloseInfo } from "./close-codes.ts";

/** One connection to an agent: an ACP message stream plus how (and why) it ended. */
export interface AgentTransport {
  readonly stream: Stream;
  /** Resolves once with the close code and reason; never rejects. */
  readonly closed: Promise<CloseInfo>;
  close(code?: number, reason?: string): void;
}

/** Opens a fresh transport. The session calls it again to reconnect. */
export type AgentTransportFactory = () => AgentTransport;

export interface WebSocketTransportOptions {
  /** Defaults to `globalThis.WebSocket` (the browser's, which sends the session cookie). */
  readonly WebSocket?: WebSocketConstructor;
}

function listen(socket: WebSocketLike, type: string, listener: (event: unknown) => void): void {
  if (socket.addEventListener) socket.addEventListener(type, listener);
  else socket.on?.(type, (...args: unknown[]) => listener(args));
}

/** Normalize a browser `CloseEvent` or Node `ws` `(code, reason)` arguments. */
function closeInfoOf(event: unknown): CloseInfo {
  if (Array.isArray(event)) {
    const [code, reason] = event as [unknown, unknown];
    return {
      code: typeof code === "number" ? code : AgentCloseCode.abnormal,
      reason: reason === undefined ? "" : String(reason),
      wasClean: typeof code === "number" && code !== AgentCloseCode.abnormal,
    };
  }
  const record = (event ?? {}) as { code?: unknown; reason?: unknown; wasClean?: unknown };
  const code = typeof record.code === "number" ? record.code : AgentCloseCode.abnormal;
  return {
    code,
    reason: typeof record.reason === "string" ? record.reason : "",
    wasClean: typeof record.wasClean === "boolean" ? record.wasClean : code !== AgentCloseCode.abnormal,
  };
}

/**
 * An ACP stream over a WebSocket, on top of the SDK's experimental `createWebSocketStream`.
 *
 * The SDK stream only reports that the socket ended, while the chat needs the close code (the
 * bridge's 44xx codes say what went wrong). So the socket is created through a capturing
 * constructor and its `close` event is observed directly. The browser WebSocket sends the session
 * cookie from the platform cookie jar, which is how the bridge authenticates the user.
 */
export function openWebSocketTransport(url: string, options: WebSocketTransportOptions = {}): AgentTransport {
  const Base: WebSocketConstructor | undefined =
    options.WebSocket ?? (globalThis.WebSocket as unknown as WebSocketConstructor | undefined);
  if (!Base) throw new Error("WebSocket is not available in this environment");

  let socket: WebSocketLike | undefined;
  let resolveClosed!: (info: CloseInfo) => void;
  const closed = new Promise<CloseInfo>((resolve) => {
    resolveClosed = resolve;
  });

  // A plain function used with `new`: returning an object makes `new` yield that object.
  function CapturingWebSocket(socketUrl: string, protocols?: string | string[]): WebSocketLike {
    const created = protocols === undefined ? new Base!(socketUrl) : new Base!(socketUrl, protocols);
    socket = created;
    listen(created, "close", (event) => resolveClosed(closeInfoOf(event)));
    return created;
  }

  // Browser sockets ignore custom headers; the platform cookie jar authenticates the upgrade.
  const stream = createWebSocketStream(url, {
    WebSocket: CapturingWebSocket as unknown as WebSocketConstructor,
    cookies: "omit",
  });

  return {
    stream,
    closed,
    close(code = AgentCloseCode.normal, reason = "") {
      try {
        socket?.close(code, reason);
      } catch {
        socket?.close();
      }
    },
  };
}

export interface AgentSocketUrlOptions {
  /** Bridge origin, e.g. `https://plane.example.com`. Empty: the page's own origin. */
  readonly baseUrl?: string;
  /** Bridge mount path, `/agents` by default. */
  readonly basePath?: string;
  readonly agentId: string;
  readonly workspaceSlug: string;
  /** Used when `baseUrl` is empty; defaults to `window.location.href`. */
  readonly pageUrl?: string;
}

/** `ws(s)://<bridge><basePath>/acp?agent=<id>&workspace=<slug>`, upgrading http(s) to ws(s). */
export function agentSocketUrl(options: AgentSocketUrlOptions): string {
  const page = options.pageUrl ?? globalThis.location?.href;
  const base = new URL(options.baseUrl?.trim() || page || "http://localhost");
  base.protocol = base.protocol === "https:" || base.protocol === "wss:" ? "wss:" : "ws:";
  const basePath = (options.basePath?.trim() || "/agents").replace(/\/+$/, "");
  base.pathname = `${basePath.startsWith("/") ? basePath : `/${basePath}`}/acp`;
  base.search = "";
  base.hash = "";
  base.searchParams.set("agent", options.agentId);
  base.searchParams.set("workspace", options.workspaceSlug);
  return base.toString();
}
