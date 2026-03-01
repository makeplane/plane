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
// icons
import { Sidebar } from "lucide-react";
// plane imports
import { OverviewIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { Breadcrumbs, Header } from "@plane/ui";
import { cn } from "@plane/utils";
// hooks
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { ProjectBreadcrumbWithPreference } from "@/components/breadcrumbs/project/with-preference";

export const ProjectOverviewHeader = observer(function ProjectOverviewHeader() {
  // router
  const router = useAppRouter();
  const { workspaceSlug, projectId } = useParams();
  // store hooks
  const { currentProjectDetails, loader } = useProject();
  const { projectOverviewSidebarCollapsed, toggleProjectOverviewSidebar } = useAppTheme();

  return (
    <Header>
      <Header.LeftItem>
        <Breadcrumbs onBack={() => router.back()} isLoading={loader === "init-loader"}>
          <ProjectBreadcrumbWithPreference
            workspaceSlug={workspaceSlug?.toString()}
            projectId={projectId?.toString()}
          />
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label="Overview"
                href={`/${workspaceSlug}/projects/${currentProjectDetails?.id}/overview/`}
                icon={<OverviewIcon className="h-4 w-4 text-tertiary" />}
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <div className="flex items-center gap-2">
          <IconButton
            size="lg"
            variant="ghost"
            className={cn({
              "text-accent-primary bg-accent-subtle": !projectOverviewSidebarCollapsed,
            })}
            icon={Sidebar}
            onClick={() => toggleProjectOverviewSidebar()}
          />
        </div>
      </Header.RightItem>
    </Header>
  );
});
