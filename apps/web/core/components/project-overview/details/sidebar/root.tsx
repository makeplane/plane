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

import type { FC } from "react";
import React from "react";
import { observer } from "mobx-react";
import { Activity } from "lucide-react";
// ui
import { InfoFillIcon, UpdatesIcon } from "@plane/propel/icons";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// plane web
import { SidebarRoot } from "@/components/common/layout/sidebar";
// local components
import { ProjectOverviewSidebarActivityRoot } from "./activity-tab-root";
import { ProjectOverviewSidebarPropertiesRoot } from "./properties-tab-root";
import { ProjectOverviewSidebarUpdatesRoot } from "./updates-tab-root";

// local components
type Props = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectOverviewSidebarRoot = observer(function ProjectOverviewSidebarRoot(props: Props) {
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
