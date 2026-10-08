/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
import type { TProjectTimeSettings } from "@plane/types";
// services
import { timeTrackingService } from "@/services/time-tracking.service";
// local imports
import { timeTrackingKeys } from "./keys";

export const useProjectTimeSettings = (workspaceSlug: string | undefined, projectId: string | null | undefined) => {
  const cacheKey = workspaceSlug && projectId ? timeTrackingKeys.projectSettings(workspaceSlug, projectId) : null;
  const { data, error, isLoading, mutate } = useSWR(
    cacheKey,
    workspaceSlug && projectId ? () => timeTrackingService.getProjectTimeSettings(workspaceSlug, projectId) : null,
    { revalidateOnFocus: false }
  );

  const updateSettings = useCallback(
    async (payload: Partial<Pick<TProjectTimeSettings, "default_billable">>) => {
      if (!workspaceSlug || !projectId) return;
      const updated = await mutate(timeTrackingService.updateProjectTimeSettings(workspaceSlug, projectId, payload), {
        optimisticData: (current) => ({ project_id: projectId, default_billable: false, ...current, ...payload }),
        rollbackOnError: true,
        revalidate: false,
      });
      return updated;
    },
    [workspaceSlug, projectId, mutate]
  );

  return { settings: data, error, isLoading, updateSettings };
};
