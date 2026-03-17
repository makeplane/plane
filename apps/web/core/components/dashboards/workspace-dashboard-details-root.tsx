/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
// hooks
import { useWorkItemFilters } from "@/hooks/store/work-item-filters/use-work-item-filters";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspaceIssueProperties } from "@/hooks/use-workspace-issue-properties";
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { DashboardsWidgetsListRoot } from "./details/root";
import { DashboardsWidgetConfigSidebarRoot } from "./sidebar";
import { WorkItemFiltersRowWrapper } from "@/components/work-item-filters/filters-row/wrapper";
import { WORK_ITEM_FILTERS_ENTITY } from "@plane/constants";

export const WorkspaceDashboardDetailsRoot = observer(function WorkspaceDashboardDetailsRoot() {
  // navigation
  const { dashboardId, workspaceSlug } = useParams();
  // store hooks
  const {
    workspaceDashboards: { fetchDashboardDetails },
  } = useDashboards();
  const { getFilter } = useWorkItemFilters();
  const { fetchProjects } = useProject();

  useWorkspaceIssueProperties(workspaceSlug);
  useSWR(
    workspaceSlug ? `WORKSPACE_PROJECTS_${workspaceSlug}` : null,
    workspaceSlug ? () => fetchProjects(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  useSWR(
    dashboardId ? `WORKSPACE_DASHBOARD_DETAILS_${dashboardId.toString()}` : null,
    dashboardId ? () => fetchDashboardDetails(dashboardId.toString()) : null
  );

  const filter = getFilter(WORK_ITEM_FILTERS_ENTITY.WORKSPACE_DASHBOARD, dashboardId?.toString() ?? "");

  return (
    <div className="size-full flex flex-col overflow-hidden">
      <WorkItemFiltersRowWrapper filter={filter} disablePQL />
      <div className="flex flex-1 overflow-hidden">
        <DashboardsWidgetsListRoot
          className="shrink-0 flex-grow px-page-x py-6 overflow-y-scroll vertical-scrollbar scrollbar-sm"
          dashboardId={dashboardId.toString()}
        />
        <DashboardsWidgetConfigSidebarRoot
          className="shrink-0 h-full border-l border-subtle-1 overflow-y-scroll vertical-scrollbar scrollbar-sm"
          dashboardId={dashboardId.toString()}
        />
      </div>
    </div>
  );
});
