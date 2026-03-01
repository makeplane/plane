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
// plane imports
import type { TIssue } from "@plane/types";
// local imports
import type { TWorkItemWithComment } from "./work-item";

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
// Events - Define your event types here
// =============================================================================

/**
 * Events the client can send to the server
 */
export type TClientToServerEvents = Record<string, never>;

/**
 * Map of event types to their specific payload data types
 * This is the single source of truth for all socket events
 * Add new mappings here when supporting new entity types (projects, cycles, etc.)
 *
 * @example
 * To add project events:
 * ```typescript
 * export type TEventDataMap = {
 *   // ... existing issue events
 *   "project.created": Partial<TProject>;
 *   "project.updated": Partial<TProject>;
 * };
 * ```
 */
export type TEventDataMap = {
  // Work item events
  "workitem.created": Partial<TIssue>;
  "workitem.updated": Partial<TIssue>;
  "workitem.deleted": Partial<TIssue>;
  "workitem.state.updated": Partial<TIssue>;
  "workitem.assignee.added": Partial<TIssue>;
  "workitem.assignee.removed": Partial<TIssue>;
  "workitem.module.added": Partial<TIssue>;
  "workitem.module.removed": Partial<TIssue>;
  "workitem.label.added": Partial<TIssue>;
  "workitem.label.removed": Partial<TIssue>;
  "workitem.cycle.added": Partial<TIssue>;
  "workitem.cycle.removed": Partial<TIssue>;
  "workitem.link.added": Partial<TIssue>;
  "workitem.link.updated": Partial<TIssue>;
  "workitem.link.removed": Partial<TIssue>;
  "workitem.comment.created": Partial<TWorkItemWithComment>;
  "workitem.comment.updated": Partial<TWorkItemWithComment>;
  "workitem.comment.deleted": Partial<TWorkItemWithComment>;
  "workitem.relation.added": Partial<TIssue>;
  "workitem.relation.removed": Partial<TIssue>;
  // Epic events
  "epic.created": Partial<TIssue>;
  "epic.updated": Partial<TIssue>;
  "epic.deleted": Partial<TIssue>;
  "epic.state.updated": Partial<TIssue>;
  "epic.assignee.added": Partial<TIssue>;
  "epic.assignee.removed": Partial<TIssue>;
  "epic.module.added": Partial<TIssue>;
  "epic.module.removed": Partial<TIssue>;
  "epic.label.added": Partial<TIssue>;
  "epic.label.removed": Partial<TIssue>;
  "epic.cycle.added": Partial<TIssue>;
  "epic.cycle.removed": Partial<TIssue>;
  "epic.link.added": Partial<TIssue>;
  "epic.link.updated": Partial<TIssue>;
  "epic.link.removed": Partial<TIssue>;
  "epic.comment.created": Partial<TWorkItemWithComment>;
  "epic.comment.updated": Partial<TWorkItemWithComment>;
  "epic.comment.deleted": Partial<TWorkItemWithComment>;
  "epic.relation.added": Partial<TIssue>;
  "epic.relation.removed": Partial<TIssue>;
};

/**
 * Event type discriminators - automatically derived from TEventDataMap keys
 * No need to manually maintain this - it updates automatically when you add to the map
 */
export type TWorkItemEventType = keyof TEventDataMap;

/**
 * Conditional type to get the correct data type for a given event type
 */
export type TEventData<T extends TWorkItemEventType> = T extends keyof TEventDataMap ? TEventDataMap[T] : unknown;

/**
 * Work item event payload structure from flux server (consumer.ts lines 64-73)
 * Generic type parameter T allows type-safe payload.data based on event_type
 *
 * @example
 * ```typescript
 * // When event_type is "workitem.created", payload.data is typed as Partial<TIssue>
 * useSocketEvent("work-item:updated", (event) => {
 *   if (event.event_type === "workitem.created") {
 *     const data = event.payload?.data; // Type: Partial<TIssue>
 *   }
 * });
 * ```
 */
export type TWorkItemEvent<T extends TWorkItemEventType = TWorkItemEventType> = {
  readonly entity_id?: string;
  readonly project_id?: string;
  readonly workspace_id?: string;
  readonly event_type?: T;
  readonly entity_type?: string;
  readonly payload?: {
    readonly data?: TEventData<T>;
    readonly previous_attributes?: Record<string, unknown>;
  };
  readonly timestamp?: number;
  readonly initiator_id?: string;
};

/**
 * Union type of all possible work item events with specific types
 * This creates a discriminated union for proper type narrowing
 */
export type TWorkItemEventUnion = {
  [K in TWorkItemEventType]: TWorkItemEvent<K>;
}[TWorkItemEventType];

/**
 * Events the server sends to the client
 * Socket.IO requires function signatures for proper type inference
 */
export type TServerToClientEvents = {
  // Connection confirmation from server
  connected: (data: { clientId: string; workspaceId: string; userId: string; timestamp: number }) => void;
  // Single work item event - all changes come through this event
  // Uses discriminated union for type-safe narrowing based on event_type
  "work-item:updated": (data: TWorkItemEventUnion) => void;
};

export type TServerEventName = keyof TServerToClientEvents;

// =============================================================================
// Socket Instance
// =============================================================================

export type TSocketInstance = Socket<TServerToClientEvents, TClientToServerEvents>;

// =============================================================================
// Utility types for extracting event names and payloads
// =============================================================================

export type TServerEventPayload<E extends TServerEventName> = TServerToClientEvents[E] extends (data: infer P) => void
  ? P
  : never;

export type TServerEventListener<E extends TServerEventName> = (data: TServerEventPayload<E>) => void;

// =============================================================================
// Context type
// =============================================================================

export type TSocketContext = {
  status: TConnectionStatus;
  subscribe: <E extends TServerEventName>(event: E, handler: TServerEventListener<E>) => () => void;
};
