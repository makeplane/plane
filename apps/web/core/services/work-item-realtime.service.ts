/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { LIVE_BASE_PATH, LIVE_BASE_URL, WORK_ITEM_REALTIME_PATH } from "@plane/constants";
import type { TWorkItemRealtimeEvent } from "@plane/types";

type TWorkItemRealtimeConnectionParams = {
  workspaceSlug: string;
  projectId: string;
  userId: string;
  onEvent: (event: TWorkItemRealtimeEvent) => void;
};

const buildWorkItemRealtimeUrl = (params: TWorkItemRealtimeConnectionParams) => {
  const liveBaseUrl = LIVE_BASE_URL?.trim() || (typeof window !== "undefined" ? window.location.origin : "");
  if (!liveBaseUrl) return null;

  const url = new URL(liveBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${LIVE_BASE_PATH}${WORK_ITEM_REALTIME_PATH}`;
  url.searchParams.set("workspaceSlug", params.workspaceSlug);
  url.searchParams.set("projectId", params.projectId);
  url.searchParams.set("userId", params.userId);
  return url.toString();
};

export class WorkItemRealtimeService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByClient = false;
  private attempt = 0;

  connect(params: TWorkItemRealtimeConnectionParams) {
    this.disconnect();
    this.closedByClient = false;
    this.attempt = 0;
    this.open(params);
  }

  disconnect() {
    this.closedByClient = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  private open(params: TWorkItemRealtimeConnectionParams) {
    const url = buildWorkItemRealtimeUrl(params);
    if (!url || typeof window === "undefined") return;

    const socket = new WebSocket(url);
    this.socket = socket;

    socket.addEventListener("message", (message) => {
      try {
        const event = JSON.parse(message.data) as TWorkItemRealtimeEvent;
        params.onEvent(event);
      } catch (error) {
        console.error("Failed to parse work item realtime event", error);
      }
    });

    socket.addEventListener("close", () => {
      this.socket = null;
      if (this.closedByClient || this.attempt >= 8) return;
      const delay = Math.min(1000 * 2 ** this.attempt, 15000);
      this.attempt += 1;
      this.reconnectTimer = setTimeout(() => this.open(params), delay);
    });

    socket.addEventListener("error", () => {
      socket.close();
    });
  }
}
