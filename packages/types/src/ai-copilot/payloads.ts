/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TInteractiveToolName, TToolResponseDataMap } from "./tools";

export type TCopilotSendMessagePayload = {
  content: string;
};

// Sent for ask_user submits and resubmits, propose_edit decisions and draft_tickets commits.
export type TCopilotToolResponsePayload = {
  [N in TInteractiveToolName]: {
    tool_call_id: string;
    data: TToolResponseDataMap[N];
  };
}[TInteractiveToolName];

export type TCopilotRetryPayload = {
  tool_call_id: string;
};
