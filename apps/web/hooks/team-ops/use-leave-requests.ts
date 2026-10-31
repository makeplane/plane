/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { LeaveRequestService } from "@plane/services";
import type { TLeaveAction, TLeaveRequestPayload } from "@plane/types";

const leaveService = new LeaveRequestService();

/** The caller's leave requests, the ones waiting for their decision, and the actions on them. */
export const useLeaveRequests = (workspaceSlug: string) => {
  const mineKey = `TEAM_OPS_LEAVE_MINE_${workspaceSlug}`;
  const reviewKey = `TEAM_OPS_LEAVE_REVIEW_${workspaceSlug}`;
  const mine = useSWR(mineKey, () => leaveService.list(workspaceSlug, "mine"));
  const review = useSWR(reviewKey, () => leaveService.list(workspaceSlug, "review"));

  const refresh = useCallback(() => Promise.all([mine.mutate(), review.mutate()]), [mine, review]);

  const create = useCallback(
    async (payload: TLeaveRequestPayload) => {
      await leaveService.create(workspaceSlug, payload);
      await refresh();
    },
    [workspaceSlug, refresh]
  );

  const act = useCallback(
    async (requestId: string, action: TLeaveAction, note = "") => {
      await leaveService.act(workspaceSlug, requestId, action, note);
      await refresh();
    },
    [workspaceSlug, refresh]
  );

  return { mine: mine.data ?? [], toReview: review.data ?? [], error: mine.error, create, act };
};
