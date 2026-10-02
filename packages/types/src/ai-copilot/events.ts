/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TToolError, TToolName, TToolStatus } from "./common";
import type { TToolArgsMap, TToolResultMap } from "./tools";

// `sequence` increases per session and is sent as the SSE `id`, so a client can resume with Last-Event-ID.

export type TMessageDeltaEventData = {
  sequence: number;
  message_id: string;
  delta: string;
  // True on the last chunk of the message.
  done: boolean;
};

export type TToolCallStartEventData<N extends TToolName = TToolName> = {
  [K in N]: {
    sequence: number;
    id: string;
    name: K;
    args: TToolArgsMap[K];
    status: "running";
    // True when the tool waits for a user response before it can continue.
    awaiting_input: boolean;
  };
}[N];

export type TToolCallUpdateEventData<N extends TToolName = TToolName> = {
  sequence: number;
  id: string;
  status: TToolStatus;
  awaiting_input?: boolean;
  // Set when the content changed after the proposal was issued, which blocks accepting it.
  stale?: boolean;
  // Snapshot of the result so far. It replaces the previous snapshot.
  result?: Partial<TToolResultMap[N]>;
};

export type TToolCallEndEventData<N extends TToolName = TToolName> = {
  sequence: number;
  id: string;
  status: Exclude<TToolStatus, "running">;
  result?: TToolResultMap[N];
  error?: TToolError;
};

export type TCopilotStreamEvent =
  | { event: "message_delta"; data: TMessageDeltaEventData }
  | { event: "tool_call_start"; data: TToolCallStartEventData }
  | { event: "tool_call_update"; data: TToolCallUpdateEventData }
  | { event: "tool_call_end"; data: TToolCallEndEventData };
