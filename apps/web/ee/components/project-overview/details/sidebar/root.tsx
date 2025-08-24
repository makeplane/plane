"use client";

import React, { FC } from "react";
import { observer } from "mobx-react";
import { Activity } from "lucide-react";
// ui
import { InfoFillIcon, UpdatesIcon } from "@plane/ui";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// plane web
import { SidebarRoot } from "@/plane-web/components/common/layout/sidebar";
// local components
import { ProjectOverviewSidebarActivityRoot } from "./activity-tab-root";
import { ProjectOverviewSidebarPropertiesRoot } from "./properties-tab-root";
import { ProjectOverviewSidebarUpdatesRoot } from "./updates-tab-root";

// local components
type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewSidebarRoot: FC<Props> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // store hooks
  const { projectOverviewSidebarCollapsed } = useAppTheme();

  const PROJECT_OVERVIEW_DETAILS_SIDEBAR_TABS = [
    {
      key: "properties",
      icon: InfoFillIcon,
      content: <ProjectOverviewSidebarPropertiesRoot workspaceSlug={workspaceSlug} projectId={projectId} />,
    },
    {
      key: "updates",
      icon: UpdatesIcon,
      content: <ProjectOverviewSidebarUpdatesRoot workspaceSlug={workspaceSlug} projectId={projectId} />,
    },
    {
      key: "activity",
      icon: Activity,
      content: <ProjectOverviewSidebarActivityRoot workspaceSlug={workspaceSlug} projectId={projectId} />,
    },
  ];

  return (
    <SidebarRoot
      tabs={PROJECT_OVERVIEW_DETAILS_SIDEBAR_TABS}
      storageKey={`project-detail-sidebar-${projectId}`}
      defaultTab="properties"
      isSidebarOpen={!projectOverviewSidebarCollapsed}
    />
  );
});
