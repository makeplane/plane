/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { WorkCalendarService, buildOptimisticDay, getReportFileName } from "@plane/services";
import type {
  TCalendarBulkPayload,
  TCalendarDay,
  TCalendarDayPayload,
  TCalendarDaysResponse,
  TCalendarHolidayPayload,
  TCalendarSettings,
  TOpsTeamPayload,
  TReportKind,
  TReportParams,
  TTeamDayFilters,
  TWeeklyPlanPayload,
} from "@plane/types";

const workCalendarService = new WorkCalendarService();

const withDay = (response: TCalendarDaysResponse, day: TCalendarDay): TCalendarDaysResponse => ({
  ...response,
  days: response.days.map((item) => (item.date === day.date ? day : item)),
});

const replaceDay = (current: TCalendarDaysResponse | undefined, day: TCalendarDay) => current && withDay(current, day);

/** The workspace policy and what the signed-in user may do under it. */
export const useCalendarSettings = (workspaceSlug: string) => {
  const { data, error, isLoading, mutate } = useSWR(`TEAM_OPS_CALENDAR_SETTINGS_${workspaceSlug}`, () =>
    workCalendarService.getSettings(workspaceSlug)
  );

  const updateSettings = useCallback(
    async (payload: Partial<TCalendarSettings>) => {
      const updated = await workCalendarService.updateSettings(workspaceSlug, payload);
      await mutate(updated, { revalidate: false });
      return updated;
    },
    [workspaceSlug, mutate]
  );

  return {
    settings: data?.settings,
    permissions: data?.permissions,
    error,
    isLoading,
    updateSettings,
  };
};

type TCalendarParams = {
  workspaceSlug: string;
  /** Whose calendar; `undefined` waits (the signed-in user is not known yet). */
  userId: string | undefined;
  /** Inclusive day keys, `YYYY-MM-DD`. */
  from: string;
  to: string;
};

/** One person's resolved days for a range, with saves that update the view straight away. */
export const useCalendarDays = ({ workspaceSlug, userId, from, to }: TCalendarParams) => {
  const key = userId ? `TEAM_OPS_CALENDAR_DAYS_${workspaceSlug}_${userId}_${from}_${to}` : null;

  const {
    data,
    error,
    isLoading,
    mutate: mutateDays,
  } = useSWR(key, () => workCalendarService.getDays(workspaceSlug, { from, to, user: userId }));

  // The grid shows the new plan at once and falls back to the old one if the server refuses it.
  const saveDay = useCallback(
    async (date: string, payload: TCalendarDayPayload) => {
      const previous = data?.days.find((day) => day.date === date);
      return mutateDays(
        async (current) => replaceDay(current, await workCalendarService.saveDay(workspaceSlug, date, payload)),
        {
          optimisticData: data && previous ? withDay(data, buildOptimisticDay(previous, payload)) : undefined,
          rollbackOnError: true,
          populateCache: true,
          revalidate: false,
        }
      );
    },
    [workspaceSlug, data, mutateDays]
  );

  const resetDay = useCallback(
    async (date: string) => {
      const reset = await workCalendarService.resetDay(workspaceSlug, date);
      await mutateDays((current) => replaceDay(current, reset), { revalidate: false });
      return reset;
    },
    [workspaceSlug, mutateDays]
  );

  const applyToDays = useCallback(
    async (payload: TCalendarBulkPayload) => {
      const result = await workCalendarService.applyToDays(workspaceSlug, payload);
      await mutateDays();
      return result;
    },
    [workspaceSlug, mutateDays]
  );

  return { days: data?.days, error, isLoading, saveDay, resetDay, applyToDays, refresh: mutateDays };
};

/** The signed-in user's recurring weekly plan. */
export const useWeeklyPlan = (workspaceSlug: string) => {
  const key = `TEAM_OPS_CALENDAR_PLAN_${workspaceSlug}`;
  const { data, error, isLoading, mutate } = useSWR(key, () => workCalendarService.getWeeklyPlan(workspaceSlug));

  const savePlan = useCallback(
    async (payload: TWeeklyPlanPayload) => {
      const saved = await workCalendarService.saveWeeklyPlan(workspaceSlug, payload);
      await mutate(saved, { revalidate: false });
      return saved;
    },
    [workspaceSlug, mutate]
  );

  return { plan: data?.days, error, isLoading, savePlan };
};

/** The change history of one person's plan on one day. */
export const useDayHistory = (workspaceSlug: string, userId: string | undefined, date: string | null) => {
  const key = userId && date ? `TEAM_OPS_CALENDAR_AUDIT_${workspaceSlug}_${userId}_${date}` : null;
  const { data, isLoading, mutate } = useSWR(key, () =>
    workCalendarService.listAudit(workspaceSlug, { user: userId, from: date!, to: date!, per_page: 20 })
  );
  return { history: data?.results ?? [], isLoading, refresh: mutate };
};

type TTeamParams = {
  workspaceSlug: string;
  /** The view is only fetched for people who may see it. */
  enabled: boolean;
  from: string;
  to: string;
  filters: TTeamDayFilters;
};

/** Per-day counts and people for the team, with the filters applied by the server. */
export const useTeamCalendar = ({ workspaceSlug, enabled, from, to, filters }: TTeamParams) => {
  const key = enabled ? `TEAM_OPS_CALENDAR_TEAM_${workspaceSlug}_${from}_${to}_${JSON.stringify(filters)}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    workCalendarService.getTeamCalendar(workspaceSlug, { from, to, ...filters })
  );
  return { team: data, error, isLoading, refresh: mutate };
};

/** The table for one day of the team view. */
export const useTeamDay = (workspaceSlug: string, enabled: boolean, date: string | null, filters: TTeamDayFilters) => {
  const key = enabled && date ? `TEAM_OPS_CALENDAR_TEAM_DAY_${workspaceSlug}_${date}_${JSON.stringify(filters)}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    workCalendarService.getTeamDay(workspaceSlug, date!, filters)
  );
  return { day: data, error, isLoading, refresh: mutate };
};

/** Teams of the workspace and, for admins, the actions that change them. */
export const useOpsTeams = (workspaceSlug: string) => {
  const key = `TEAM_OPS_TEAMS_${workspaceSlug}`;
  const { data, error, isLoading, mutate } = useSWR(key, () => workCalendarService.listTeams(workspaceSlug));

  const createTeam = useCallback(
    async (payload: TOpsTeamPayload & { name: string }) => {
      const team = await workCalendarService.createTeam(workspaceSlug, payload);
      await mutate();
      return team;
    },
    [workspaceSlug, mutate]
  );

  const updateTeam = useCallback(
    async (teamId: string, payload: TOpsTeamPayload) => {
      const team = await workCalendarService.updateTeam(workspaceSlug, teamId, payload);
      await mutate();
      return team;
    },
    [workspaceSlug, mutate]
  );

  const deleteTeam = useCallback(
    async (teamId: string) => {
      await workCalendarService.deleteTeam(workspaceSlug, teamId);
      await mutate();
    },
    [workspaceSlug, mutate]
  );

  return { teams: data, error, isLoading, createTeam, updateTeam, deleteTeam };
};

/** The holidays of one calendar year. */
export const useHolidays = (workspaceSlug: string, year: number) => {
  const key = `TEAM_OPS_HOLIDAYS_${workspaceSlug}_${year}`;
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    workCalendarService.listHolidays(workspaceSlug, { from: `${year}-01-01`, to: `${year}-12-31` })
  );

  const addHoliday = useCallback(
    async (payload: TCalendarHolidayPayload) => {
      const holiday = await workCalendarService.createHoliday(workspaceSlug, payload);
      await mutate();
      return holiday;
    },
    [workspaceSlug, mutate]
  );

  const removeHoliday = useCallback(
    async (holidayId: string) => {
      await workCalendarService.deleteHoliday(workspaceSlug, holidayId);
      await mutate();
    },
    [workspaceSlug, mutate]
  );

  return { holidays: data, error, isLoading, addHoliday, removeHoliday };
};

/** The plan summary of a period, or `null` while the period is not valid. */
export const usePlanSummary = (workspaceSlug: string, params: TReportParams | null) => {
  const key = params ? `TEAM_OPS_REPORT_PLAN_${workspaceSlug}_${JSON.stringify(params)}` : null;
  const { data, error, isLoading } = useSWR(key, () => workCalendarService.getPlanSummary(workspaceSlug, params!));
  return { report: data, error, isLoading };
};

/** Planned against logged time for a period, or `null` while the period is not valid. */
export const usePlannedVsLogged = (workspaceSlug: string, params: TReportParams | null) => {
  const key = params ? `TEAM_OPS_REPORT_COMPARISON_${workspaceSlug}_${JSON.stringify(params)}` : null;
  const { data, error, isLoading } = useSWR(key, () => workCalendarService.getPlannedVsLogged(workspaceSlug, params!));
  return { report: data, error, isLoading };
};

/** Downloads a report as a CSV file through the browser. */
export const downloadReport = async (workspaceSlug: string, report: TReportKind, params: TReportParams) => {
  const blob = await workCalendarService.exportReport(workspaceSlug, report, params);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = getReportFileName(report, params.from, params.to);
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/** Sets one day of someone else's plan. The server checks that the caller may do so. */
export const saveDayForUser = (workspaceSlug: string, userId: string, date: string, payload: TCalendarDayPayload) =>
  workCalendarService.saveDay(workspaceSlug, date, { ...payload, user: userId });
