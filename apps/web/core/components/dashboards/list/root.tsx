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
import { useTheme } from "next-themes";
// plane imports
import { useTranslation } from "@plane/i18n";
// assets
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import listSearchDark from "@/app/assets/empty-state/dashboards/list-search-dark.webp?url";
import listSearchLight from "@/app/assets/empty-state/dashboards/list-search-light.webp?url";
// components
import { ListLayout } from "@/components/core/list";
import { SimpleEmptyState } from "@/components/empty-state/simple-empty-state-root";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
// local components
import { DashboardListItem } from "./list-item";
import { DashboardsListLayoutLoader } from "./loader";

export const DashboardsListLayoutRoot = observer(function DashboardsListLayoutRoot() {
  // store hooks
  const {
    getDashboardById,
    workspaceDashboards: { currentWorkspaceFetchStatus, isAnyDashboardAvailable, currentWorkspaceFilteredDashboardIds },
  } = useDashboards();
  // theme hook
  const { resolvedTheme } = useTheme();
  // translation
  const { t } = useTranslation();
  // derived values
  const searchEmptyStateResolvedPath = resolvedTheme === "light" ? listSearchLight : listSearchDark;

  if (!currentWorkspaceFetchStatus) {
    return <DashboardsListLayoutLoader />;
  }

  // no dashboards empty state
  if (!isAnyDashboardAvailable) {
    return (
      <div className="size-full grid place-items-center">
        <EmptyStateDetailed
          assetKey="dashboard"
          title={t("workspace_empty_state.dashboard.title")}
          description={t("workspace_empty_state.dashboard.description")}
        />
      </div>
    );
  }

  if (currentWorkspaceFilteredDashboardIds.length === 0) {
    return (
      <div className="size-full grid place-items-center px-page-x">
        <SimpleEmptyState
          title={t("dashboards.empty_state.dashboards_search.title")}
          description={t("dashboards.empty_state.dashboards_search.description")}
          assetPath={searchEmptyStateResolvedPath}
          size="lg"
        />
      </div>
    );
  }

  return (
    <ListLayout>
      {currentWorkspaceFilteredDashboardIds.map((dashboardId) => (
        <DashboardListItem key={dashboardId} getDashboardDetails={getDashboardById} id={dashboardId} />
      ))}
    </ListLayout>
  );
});
