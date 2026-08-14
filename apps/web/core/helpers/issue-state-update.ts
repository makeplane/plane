/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { TIssuePatchPayload } from "@plane/types";
import { propagateStateStore } from "@/store/issue/propagate-state.store";

type TUpdateIssueStateWithPropagationParams = {
  currentStateId: string | null | undefined;
  newStateId: string;
  subIssuesCount: number;
  onUpdate: (data: TIssuePatchPayload) => Promise<void>;
  afterPropagate?: () => Promise<void>;
};

export async function updateIssueStateWithPropagation(params: TUpdateIssueStateWithPropagationParams): Promise<void> {
  const { currentStateId, newStateId, subIssuesCount, onUpdate, afterPropagate } = params;

  if (currentStateId === newStateId) return;

  if (subIssuesCount > 0) {
    const shouldPropagate = await propagateStateStore.prompt(subIssuesCount);
    if (shouldPropagate === null) return;

    await onUpdate({
      state_id: newStateId,
      propagate_state_to_sub_issues: shouldPropagate,
    });

    if (shouldPropagate && afterPropagate) {
      await afterPropagate();
    }
    return;
  }

  await onUpdate({ state_id: newStateId });
}
