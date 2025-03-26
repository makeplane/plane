"use client";

import { useParams } from "next/navigation";
import useSWR from "swr";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { DashboardsFeatureFlagFallback } from "@/plane-web/components/dashboards/feature-flag-fallback";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";
// plane web hooks
import { useDashboards } from "@/plane-web/hooks/store";

export default function WorkspaceDashboardsLayout({ children }: { children: React.ReactNode }) {
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    workspaceDashboards: { fetchDashboards },
  } = useDashboards();

  useSWR(
    workspaceSlug ? `WORKSPACE_DASHBOARDS_LIST_${workspaceSlug.toString()}` : null,
    workspaceSlug ? () => fetchDashboards() : null
  );

  return (
    <WorkspaceAccessWrapper pageKey="dashboards">
      <WithFeatureFlagHOC
        fallback={<DashboardsFeatureFlagFallback />}
        flag="DASHBOARDS"
        workspaceSlug={workspaceSlug?.toString() ?? ""}
      >
        {children}
      </WithFeatureFlagHOC>
    </WorkspaceAccessWrapper>
  );
}
