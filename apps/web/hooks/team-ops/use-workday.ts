/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { WorkdayService } from "@plane/services";
import type { TFinishWorkPayload, TTeamflowParams, TDayMode, TWorkPlace, TWorkdayState } from "@plane/types";

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

const REFRESH_MS = 15_000;

/** The caller's day: how they work today, the running task and its state, refreshed often so a freeze shows up. */
export const useWorkdayState = (workspaceSlug: string) => {
  const key = `TEAM_OPS_WORKDAY_STATE_${workspaceSlug}`;
  const { data, error, isLoading, mutate } = useSWR(key, () => workdayService.getState(workspaceSlug), {
    refreshInterval: REFRESH_MS,
  });
  // Every answer carries the new state, so the page updates at once without waiting for the next refresh.
  const apply = useCallback(
    async (request: Promise<TWorkdayState>) => {
      const next = await request;
      await mutate(next, { revalidate: false });
      return next;
    },
    [mutate]
  );
  return {
    state: data,
    error,
    isLoading,
    refresh: mutate,
    setDayMode: (mode: TDayMode) => apply(workdayService.setDayMode(workspaceSlug, mode)),
    startWork: (issue: string, location?: TWorkPlace) =>
      apply(workdayService.startWork(workspaceSlug, issue, location)),
    setBreak: (action: "start" | "end") => apply(workdayService.setBreak(workspaceSlug, action)),
    checkIn: () => apply(workdayService.checkIn(workspaceSlug)),
  };
};

/** Who is doing what right now. Only asked for by people allowed to see the team. */
export const useTeamStatus = (workspaceSlug: string, enabled: boolean) => {
  const { data } = useSWR(
    enabled ? `TEAM_OPS_TEAM_STATUS_${workspaceSlug}` : null,
    () => workdayService.getTeamStatus(workspaceSlug),
    {
      refreshInterval: REFRESH_MS,
    }
  );
  return { rows: data };
};

export const useOpsNotifications = (workspaceSlug: string) => {
  const key = `TEAM_OPS_NOTIFICATIONS_${workspaceSlug}`;
  const { data, mutate } = useSWR(key, () => workdayService.listNotifications(workspaceSlug), {
    refreshInterval: REFRESH_MS,
  });
  const markRead = useCallback(
    async (id?: string) => {
      await workdayService.markNotificationsRead(workspaceSlug, id);
      await mutate();
    },
    [workspaceSlug, mutate]
  );
  return { notifications: data?.results, unread: data?.unread ?? 0, markRead };
};
