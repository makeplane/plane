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

import { Outlet } from "react-router";
import useSWR from "swr";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { DashboardsFeatureFlagFallback } from "@/components/dashboards/feature-flag-fallback";
import { WithFeatureFlagHOC } from "@/components/feature-flags";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";
import type { Route } from "./+types/layout";

export default function WorkspaceDashboardsLayout({ params }: Route.ComponentProps) {
  // navigation
  const { workspaceSlug } = params;
  // store hooks
  const {
    workspaceDashboards: { fetchDashboards },
  } = useDashboards();

  useSWR(`WORKSPACE_DASHBOARDS_LIST_${workspaceSlug}`, () => fetchDashboards());

  return (
    <WorkspaceAccessWrapper pageKey="dashboards">
      <WithFeatureFlagHOC
        fallback={<DashboardsFeatureFlagFallback />}
        flag="DASHBOARDS"
        workspaceSlug={workspaceSlug?.toString() ?? ""}
      >
        <Outlet />
      </WithFeatureFlagHOC>
    </WorkspaceAccessWrapper>
  );
}
