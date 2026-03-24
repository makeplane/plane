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
import { useCallback, useMemo } from "react";
import { Outlet } from "react-router";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE, WORK_ITEM_FILTERS_ENTITY } from "@plane/constants";
import type { TWorkItemFilterExpression } from "@plane/types";
// components
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@/components/core/content-wrapper";
import { PageHead } from "@/components/core/page-title";
import { WorkspaceDashboardDetailsHeader } from "./header";
// plane web hooks
import { WorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/base";
import { useLabel } from "@/hooks/store/use-label";
import { useMember } from "@/hooks/store/use-member";
import { useProject } from "@/hooks/store/use-project";
import { useDashboards } from "@/plane-web/hooks/store";
import type { Route } from "./+types/layout";

const defaultWorkItemFilters = {
  richFilters: {},
  lastUsedFilterType: "rich_filters",
} as const;

export default observer(function WorkspaceDashboardDetailsLayout(props: Route.ComponentProps) {
  const { dashboardId, workspaceSlug } = props.params;
  const { getDashboardById } = useDashboards();
  const {
    workspace: { getWorkspaceMemberIds },
  } = useMember();
  const { getWorkspaceLabelIds } = useLabel();
  const { joinedProjectIds } = useProject();

  // Quick filter starts empty — not persisted across reloads
  const initialWorkItemFilters = useMemo(() => defaultWorkItemFilters, []);

  const updateFilters = useCallback(
    async (params: { type: string; expression?: TWorkItemFilterExpression }) => {
      if (params.type !== "rich_filters") return;
      const dashboard = getDashboardById(dashboardId ?? "");
      if (!dashboard) return;
      const expression = params.expression && Object.keys(params.expression).length > 0 ? params.expression : undefined;
      dashboard.updateQuickFilters(expression);
    },
    [dashboardId, getDashboardById]
  );

  return (
    <WorkItemFiltersHOC
      entityType={WORK_ITEM_FILTERS_ENTITY.WORKSPACE_DASHBOARD}
      entityId={dashboardId}
      filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.my_issues.filters}
      initialWorkItemFilters={initialWorkItemFilters}
      memberIds={getWorkspaceMemberIds(workspaceSlug)}
      labelIds={getWorkspaceLabelIds(workspaceSlug)}
      projectIds={joinedProjectIds}
      updateFilters={updateFilters}
      workspaceSlug={workspaceSlug ?? ""}
    >
      <AppHeader header={<WorkspaceDashboardDetailsHeader workspaceSlug={workspaceSlug} dashboardId={dashboardId} />} />
      <ContentWrapper>
        <PageHead title="Dashboards" />
        <Outlet />
      </ContentWrapper>
    </WorkItemFiltersHOC>
  );
});
