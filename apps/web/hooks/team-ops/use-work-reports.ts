/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useCallback } from "react";
import useSWR from "swr";
// plane imports
import { TeamDashboardService, WorkReportService } from "@plane/services";
import type { TDashboardParams, TReportBoardParams, TReportKindName, TWorkReportPayload } from "@plane/types";

const workReportService = new WorkReportService();

/** One report (the caller's, or another person's when `userId` is given) with its Time Tracking suggestions. */
export const useWorkReport = (workspaceSlug: string, kind: TReportKindName, date: string, userId?: string) => {
  const key = `TEAM_OPS_REPORT_${workspaceSlug}_${kind}_${date}_${userId ?? "me"}`;
  const { data, error, isLoading, mutate } = useSWR(key, () =>
    workReportService.getReport(workspaceSlug, kind, date, userId)
  );

  const save = useCallback(
    async (payload: TWorkReportPayload) => {
      await workReportService.saveReport(workspaceSlug, kind, date, payload);
      await mutate();
    },
    [workspaceSlug, kind, date, mutate]
  );

  return { report: data, error, isLoading, save };
};

/** Who has handed in their reports, for the people the caller may see. */
export const useReportBoard = (workspaceSlug: string, enabled: boolean, params: TReportBoardParams) => {
  const key = enabled ? `TEAM_OPS_REPORT_BOARD_${workspaceSlug}_${JSON.stringify(params)}` : null;
  const { data, error, isLoading } = useSWR(key, () => workReportService.getBoard(workspaceSlug, params));
  return { board: data, error, isLoading };
};

const dashboardService = new TeamDashboardService();

/** The management dashboard; only fetched for people who may see the team. */
export const useDashboard = (workspaceSlug: string, enabled: boolean, params: TDashboardParams) => {
  const key = enabled ? `TEAM_OPS_DASHBOARD_${workspaceSlug}_${JSON.stringify(params)}` : null;
  const { data, error, isLoading } = useSWR(key, () => dashboardService.getDashboard(workspaceSlug, params));
  return { dashboard: data, error, isLoading };
};
