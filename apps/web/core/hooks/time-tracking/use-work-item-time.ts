/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import useSWR from "swr";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { timeTrackingKeys } from "./keys";

/** Totals, people, recent and running entries of one work item (the work item Time property). */
export const useWorkItemTime = (
  workspaceSlug: string | undefined,
  projectId: string | null | undefined,
  issueId: string | null | undefined
) => {
  const { data, error, isLoading, mutate } = useSWR(
    workspaceSlug && projectId && issueId ? timeTrackingKeys.workItem(workspaceSlug, projectId, issueId) : null,
    workspaceSlug && projectId && issueId
      ? () => timeTrackingService.getWorkItemTime(workspaceSlug, projectId, issueId)
      : null,
    { revalidateOnFocus: false }
  );
  return { workItemTime: data, error, isLoading, mutate };
};
