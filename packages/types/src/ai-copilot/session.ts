/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TCopilotEntityType, TCopilotMessageRole, TToolError, TToolName, TToolStatus } from "./common";
import type { TToolArgsMap, TToolResultMap } from "./tools";

export type TCopilotCreateSessionPayload = {
  entity_type: TCopilotEntityType;
  entity_id: string;
};

export type TCopilotToolCall<N extends TToolName = TToolName> = {
  [K in N]: {
    id: string;
    name: K;
    args: TToolArgsMap[K];
    // A running tool call holds the result found so far.
    result: Partial<TToolResultMap[K]> | null;
    error: TToolError | null;
    status: TToolStatus;
    is_stale: boolean;
    is_answered: boolean;
    awaiting_input: boolean;
    created_at: string;
    updated_at: string;
  };
}[N];

export type TCopilotMessage = {
  id: string;
  role: TCopilotMessageRole;
  content: string;
  sequence: number;
  tool_calls: TCopilotToolCall[];
  created_at: string;
  updated_at: string;
};

export type TCopilotMemory = {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type TCopilotSession = {
  id: string;
  workspace: string;
  project: string;
  entity_type: TCopilotEntityType;
  entity_id: string;
  // Ordered by `sequence`.
  messages: TCopilotMessage[];
  memories: TCopilotMemory[];
  created_at: string;
  updated_at: string;
};
