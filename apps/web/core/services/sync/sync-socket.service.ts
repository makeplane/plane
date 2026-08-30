/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { LIVE_BASE_PATH, LIVE_BASE_URL } from "@plane/constants";

export type TSyncEntityType = "issue" | "issue_comment" | "cycle" | "module" | "project" | "pomodoro_timer";
export type TSyncAction = "created" | "updated" | "deleted" | "moved";

export type TSyncEvent = {
  id: string;
  seq: number;
  entity_type: TSyncEntityType;
  entity_id: string;
  action: TSyncAction;
  actor: string | null;
  payload: Record<string, unknown>;
  created_at: string;
};

type TSyncListener = (event: TSyncEvent) => void;

const CURSOR_STORAGE_PREFIX = "plane-sync-cursor:";
const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30000;
const HEARTBEAT_INTERVAL_MS = 20000;

/**
 * Thin client for the `/sync` WebSocket exposed by apps/live. One instance
 * per open workspace: connects with the last-known cursor so a reload or
 * network blip replays exactly what was missed (see
 * apps/live/src/controllers/sync.controller.ts and
 * apps/api/plane/bgtasks/sync_event_task.py for the server side of this
 * contract), then keeps receiving live events and dispatches them to
 * subscribers keyed by entity type — the store/SWR wiring lives in the
 * subscribers, not here.
 */
export class SyncSocketService {
  private ws: WebSocket | null = null;
  private listeners = new Map<TSyncEntityType, Set<TSyncListener>>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(
    private workspaceSlug: string,
    private workspaceId: string,
    private userId: string
  ) {}

  private cursorKey() {
    return `${CURSOR_STORAGE_PREFIX}${this.workspaceId}`;
  }

  private getCursor(): number {
    if (typeof window === "undefined") return 0;
    return Number(window.localStorage.getItem(this.cursorKey()) ?? "0") || 0;
  }

  private setCursor(seq: number) {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(this.cursorKey(), String(seq));
    } catch {
      // ignore quota / private-mode errors — worst case a reconnect re-replays a bit more
    }
  }

  on(entityType: TSyncEntityType, listener: TSyncListener): () => void {
    if (!this.listeners.has(entityType)) this.listeners.set(entityType, new Set());
    this.listeners.get(entityType)!.add(listener);
    return () => this.listeners.get(entityType)?.delete(listener);
  }

  connect() {
    if (typeof window === "undefined" || this.destroyed) return;

    try {
      const base = LIVE_BASE_URL?.trim() || window.location.origin;
      const url = new URL(base);
      url.protocol = window.location.protocol === "https:" ? "wss" : "ws";
      url.pathname = `${LIVE_BASE_PATH}/sync`;
      url.searchParams.set("userId", this.userId);
      url.searchParams.set("workspaceSlug", this.workspaceSlug);
      url.searchParams.set("workspaceId", this.workspaceId);
      url.searchParams.set("sinceSeq", String(this.getCursor()));

      const ws = new WebSocket(url.toString());
      this.ws = ws;

      ws.addEventListener("open", () => {
        this.reconnectAttempt = 0;
        this.heartbeatTimer = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
        }, HEARTBEAT_INTERVAL_MS);
      });

      ws.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(event.data as string) as TSyncEvent & { type: string };
          if (message.type !== "event") return;
          this.setCursor(message.seq);
          this.listeners.get(message.entity_type)?.forEach((listener) => listener(message));
        } catch {
          // ignore malformed frames
        }
      });

      ws.addEventListener("close", () => this.scheduleReconnect());
      ws.addEventListener("error", () => ws.close());
    } catch {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.destroyed) return;
    const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** this.reconnectAttempt, RECONNECT_MAX_DELAY_MS);
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  disconnect() {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.ws?.close();
    this.ws = null;
  }
}
