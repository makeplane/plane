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

import type { Socket } from "socket.io-client";

// =============================================================================
// Connection
// =============================================================================

export type TConnectionStatus = "disconnected" | "connecting" | "connected" | "reconnecting";

export type TSocketOptions = {
  withCredentials?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  reconnectionDelayMax?: number;
  timeout?: number;
  url: string;
  path?: string;
};

// =============================================================================
// Event payload — minimal signal from flux consumer
// =============================================================================

/**
 * Minimal invalidation signal from the flux consumer.
 * The consumer strips the full entity payload and only sends
 * what the client needs to know which SWR caches to refetch.
 *
 * Routing is handled server-side via Socket.IO rooms —
 * clients only receive events for entities they've subscribed to.
 */
export type TEntityEvent = {
  readonly event_id: string;
  /** e.g. "workitem.created", "epic.comment.deleted" */
  readonly event_type: string;
  readonly entity_id: string;
  /** Only present on comment events — used to invalidate reply threads */
  readonly parent_comment_id?: string | null;
};

// =============================================================================
// Socket.IO event contracts
// =============================================================================

/**
 * Events the client sends to the server.
 */
export type TClientToServerEvents = {
  "subscribe:entity": (data: { entityType: string; entityId: string }) => void;
  "unsubscribe:entity": (data: { entityType: string; entityId: string }) => void;
};

/**
 * Events the server sends to the client.
 * Entity events use rooms and event names like "workitem:{uuid}" or "epic:{uuid}".
 */
export type TServerToClientEvents = {
  [event: `${string}:${string}`]: (data: TEntityEvent) => void;
};

// =============================================================================
// Socket Instance
// =============================================================================

export type TSocketInstance = Socket<TServerToClientEvents, TClientToServerEvents>;

// =============================================================================
// Context type
// =============================================================================

export type TSocketContext = {
  status: TConnectionStatus;
  subscribeEntity: (entityType: string, entityId: string, handler: (data: TEntityEvent) => void) => () => void;
};
