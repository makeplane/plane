/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// Liviere/plane fork: data hooks of the project activity heatmap.

import { useCallback, useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { EUserPermissions } from "@plane/constants";
import type { TNavigationItem } from "@/components/navigation/tab-navigation-root";
import { projectActivityService } from "./activity.service";
import { ActivityIcon } from "./activity-icon";
import { currentQuarter, msToNextQuarter } from "./grid";
import type { TActivityQuery, TReportOptions } from "./types";

export const ACTIVITY_NAVIGATION_KEY = "liviere_activity";

export const enabledProjectsKey = (workspaceSlug: string) => `LIVIERE_ACTIVITY_ENABLED_PROJECTS_${workspaceSlug}`;
export const activitySettingsKey = (projectId: string) => `LIVIERE_ACTIVITY_SETTINGS_${projectId}`;

export const useActivityEnabledProjects = (workspaceSlug: string | undefined) =>
  useSWR(
    workspaceSlug ? enabledProjectsKey(workspaceSlug) : null,
    workspaceSlug ? () => projectActivityService.getEnabledProjectIds(workspaceSlug) : null,
    { revalidateOnFocus: false }
  );

/** "Activity" item of the project navigation (sidebar and tabs), shown where the feature is enabled. */
export const useActivityNavigationItems = (workspaceSlug: string | undefined) => {
  const { data: enabledProjectIds } = useActivityEnabledProjects(workspaceSlug);
  return useCallback(
    (slug: string, projectId: string): TNavigationItem[] => [
      {
        i18n_key: "liviere.activity.title",
        key: ACTIVITY_NAVIGATION_KEY,
        name: "Activity",
        href: `/${slug}/projects/${projectId}/activity`,
        icon: ActivityIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: !!enabledProjectIds?.includes(projectId),
        sortOrder: 7,
      },
    ],
    [enabledProjectIds]
  );
};

export const useActivitySettings = (workspaceSlug: string | undefined, projectId: string | undefined) =>
  useSWR(
    workspaceSlug && projectId ? activitySettingsKey(projectId) : null,
    workspaceSlug && projectId ? () => projectActivityService.getSettings(workspaceSlug, projectId) : null,
    { revalidateOnFocus: false }
  );

export const useActivityHeatmap = (workspaceSlug: string, projectId: string, query: TActivityQuery) =>
  useSWR(
    `LIVIERE_ACTIVITY_HEATMAP_${projectId}_${query.from}_${query.to}_${query.tz}_${query.actor ?? ""}`,
    () => projectActivityService.getHeatmap(workspaceSlug, projectId, query),
    { refreshInterval: 60_000, keepPreviousData: true }
  );

export const useActivityReport = (
  workspaceSlug: string,
  projectId: string,
  query: TActivityQuery,
  options: TReportOptions
) =>
  useSWR(
    `LIVIERE_ACTIVITY_REPORT_${projectId}_${query.from}_${query.to}_${query.tz}_${query.actor ?? ""}_${options.source}_${options.entries}`,
    () => projectActivityService.getReport(workspaceSlug, projectId, query, options),
    { revalidateOnFocus: false, keepPreviousData: true }
  );

export const useDaySummaries = (workspaceSlug: string, projectId: string, query: TActivityQuery) =>
  useSWR(
    `LIVIERE_ACTIVITY_SUMMARIES_${projectId}_${query.from}_${query.to}_${query.tz}_${query.actor ?? ""}`,
    () => projectActivityService.getSummaries(workspaceSlug, projectId, query),
    { revalidateOnFocus: false, keepPreviousData: true }
  );

export const skipPeriodsKey = (projectId: string) => `LIVIERE_ACTIVITY_SKIPS_${projectId}`;

/** Skipped periods of a project; with a query those overlapping its range (the grid marks them). */
export const useSkipPeriods = (workspaceSlug: string, projectId: string, query?: TActivityQuery) =>
  useSWR(
    query ? `${skipPeriodsKey(projectId)}_${query.from}_${query.to}_${query.tz}` : `${skipPeriodsKey(projectId)}_all`,
    () => projectActivityService.getSkipPeriods(workspaceSlug, projectId, query && { ...query, actor: null }),
    { revalidateOnFocus: false, keepPreviousData: true }
  );

/** Reloads the skipped periods and the report of a project after a period changed. */
export const refreshSkipPeriods = (projectId: string) =>
  mutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith(skipPeriodsKey(projectId)) || key.startsWith(`LIVIERE_ACTIVITY_REPORT_${projectId}_`))
  );

/** Reloads the day summaries and the report of a project after a summary changed. */
export const refreshDaySummaries = (projectId: string) =>
  mutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith(`LIVIERE_ACTIVITY_SUMMARIES_${projectId}_`) ||
        key.startsWith(`LIVIERE_ACTIVITY_REPORT_${projectId}_`))
  );

/** Reloads the heatmap, the event lists and the report of a project, e.g. after a log entry changed. */
export const refreshProjectActivity = (projectId: string) =>
  mutate(
    (key) =>
      typeof key === "string" &&
      (key.startsWith(`LIVIERE_ACTIVITY_HEATMAP_${projectId}_`) ||
        key.startsWith(`LIVIERE_ACTIVITY_EVENTS_${projectId}_`) ||
        key.startsWith(`LIVIERE_ACTIVITY_REPORT_${projectId}_`))
  );

/** The current quarter of the day in a time zone; changes when the next quarter starts. */
export const useCurrentQuarter = (timeZone: string) => {
  const [quarter, setQuarter] = useState(() => currentQuarter(timeZone));
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      const next = currentQuarter(timeZone);
      setQuarter((previous) => (previous.date === next.date && previous.slot === next.slot ? previous : next));
      // A second past the boundary; browsers delay timers of background tabs, so visibility changes update too
      timer = setTimeout(update, msToNextQuarter() + 1000);
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", update);
    };
  }, [timeZone]);
  return quarter;
};
