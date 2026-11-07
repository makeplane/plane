/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** WebSocket close codes the agent bridge uses (see `apps/agent-bridge/README.md`). */
export const AgentCloseCode = {
  normal: 1000,
  goingAway: 1001,
  /** No close frame at all: the network dropped or the upgrade was refused (e.g. a 403 origin check). */
  abnormal: 1006,
  messageTooBig: 1009,
  internalError: 1011,
  badRequest: 4400,
  unauthenticated: 4401,
  forbidden: 4403,
  agentNotFound: 4404,
  idleTimeout: 4408,
  sessionExpired: 4410,
  tooManyConnections: 4429,
  agentUnavailable: 4502,
} as const;

export type AgentCloseReason =
  | "closed"
  | "server_shutdown"
  | "network"
  | "message_too_big"
  | "server_error"
  | "bad_request"
  | "unauthenticated"
  | "forbidden"
  | "agent_not_found"
  | "idle_timeout"
  | "session_expired"
  | "too_many_chats"
  | "agent_unavailable"
  | "unknown";

export interface CloseInfo {
  readonly code: number;
  readonly reason: string;
  /** False when the socket closed without a close frame (network loss, refused upgrade). */
  readonly wasClean: boolean;
}

export interface CloseDescription {
  readonly reason: AgentCloseReason;
  /** Showing a "Reconnect" action makes sense: a new connection can succeed without user changes. */
  readonly canReconnect: boolean;
  /** The session reconnects on its own (and reloads the ACP session when the agent supports it). */
  readonly autoReconnect: boolean;
}

const DESCRIPTIONS: Record<number, CloseDescription> = {
  [AgentCloseCode.normal]: { reason: "closed", canReconnect: true, autoReconnect: false },
  [AgentCloseCode.goingAway]: { reason: "server_shutdown", canReconnect: true, autoReconnect: false },
  [AgentCloseCode.abnormal]: { reason: "network", canReconnect: true, autoReconnect: false },
  [AgentCloseCode.messageTooBig]: { reason: "message_too_big", canReconnect: true, autoReconnect: false },
  [AgentCloseCode.internalError]: { reason: "server_error", canReconnect: true, autoReconnect: false },
  [AgentCloseCode.badRequest]: { reason: "bad_request", canReconnect: false, autoReconnect: false },
  [AgentCloseCode.unauthenticated]: { reason: "unauthenticated", canReconnect: false, autoReconnect: false },
  [AgentCloseCode.forbidden]: { reason: "forbidden", canReconnect: false, autoReconnect: false },
  [AgentCloseCode.agentNotFound]: { reason: "agent_not_found", canReconnect: false, autoReconnect: false },
  [AgentCloseCode.idleTimeout]: { reason: "idle_timeout", canReconnect: true, autoReconnect: false },
  [AgentCloseCode.sessionExpired]: { reason: "session_expired", canReconnect: true, autoReconnect: true },
  [AgentCloseCode.tooManyConnections]: { reason: "too_many_chats", canReconnect: true, autoReconnect: false },
  [AgentCloseCode.agentUnavailable]: { reason: "agent_unavailable", canReconnect: true, autoReconnect: false },
};

/** What a close code means for the chat UI. Unknown codes are treated as reconnectable. */
export function describeClose(code: number): CloseDescription {
  return DESCRIPTIONS[code] ?? { reason: "unknown", canReconnect: true, autoReconnect: false };
}
