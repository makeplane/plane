/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { WorkdayService } from "@plane/services";
import type { TFinishWorkPayload, TTeamflowParams } from "@plane/types";

const workdayService = new WorkdayService();

/** Finished work and time per work item for a range of days, and the action that finishes work. */
export const useWorkday = (workspaceSlug: string, userId: string | undefined, from: string, to: string) => {
  const rangeKey = userId ? `${workspaceSlug}_${userId}_${from}_${to}` : null;
  const {
    data: sessions,
    isLoading: isSessionsLoading,
    mutate: mutateSessions,
  } = useSWR(rangeKey && `TEAM_OPS_SESSIONS_${rangeKey}`, () =>
    workdayService.listSessions(workspaceSlug, { user: userId, from, to })
  );
  const { data: tasks, mutate: mutateTasks } = useSWR(rangeKey && `TEAM_OPS_TASKS_${rangeKey}`, () =>
    workdayService.listTasks(workspaceSlug, { user: userId, from, to })
  );

  const finishWork = useCallback(
    async (payload: TFinishWorkPayload) => {
      const result = await workdayService.finishWork(workspaceSlug, payload);
      await Promise.all([mutateSessions(), mutateTasks()]);
      return result;
    },
    [workspaceSlug, mutateSessions, mutateTasks]
  );

  return { sessions, tasks, isLoading: isSessionsLoading, finishWork };
};

/** Hand-offs between teams, filtered on the server. */
export const useTeamflow = (workspaceSlug: string, params: TTeamflowParams) => {
  const key = `TEAM_OPS_TEAMFLOW_${workspaceSlug}_${JSON.stringify(params)}`;
  const { data, error, isLoading } = useSWR(key, () => workdayService.getTeamflow(workspaceSlug, params), {
    refreshInterval: 30_000,
  });
  return { flow: data, error, isLoading };
};
