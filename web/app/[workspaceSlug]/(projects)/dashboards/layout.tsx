"use client";

import { useParams } from "next/navigation";
// plane web components
import WorkspaceAccessWrapper from "@/layouts/access/workspace-wrapper";
import { DashboardsFeatureFlagFallback } from "@/plane-web/components/dashboards/feature-flag-fallback";
import { WithFeatureFlagHOC } from "@/plane-web/components/feature-flags";

export default function WorkspaceDashboardsLayout({ children }: { children: React.ReactNode }) {
  // navigation
  const { workspaceSlug } = useParams();

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
