/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Outlet } from "react-router";
import useSWR from "swr";
// plane imports
import { Header, Row } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { TabNavigationRoot } from "@/components/navigation/tab-navigation-root";
import { AppSidebarToggleButton } from "@/components/sidebar/sidebar-toggle-button";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useWorkflowStore } from "@/hooks/store/use-workflow";
import { useProjectNavigationPreferences } from "@/hooks/use-navigation-preferences";
// layouts
import { ProjectAuthWrapper } from "@/layouts/auth-layout/project-wrapper";
// plane-web
import { WorkflowBlockerModal } from "@/plane-web/components/issues/workflow/workflow-blocker-modal";
// local imports
import type { Route } from "./+types/layout";

function ProjectLayout({ params }: Route.ComponentProps) {
  // router
  const { workspaceSlug, projectId } = params;
  // store hooks
  const { sidebarCollapsed } = useAppTheme();
  const workflowStore = useWorkflowStore();
  // preferences
  const { preferences: projectPreferences } = useProjectNavigationPreferences();

  // Fetch workflow data when entering a project so Kanban indicators and
  // drag-block checks have up-to-date transition rules.
  useSWR(
    workspaceSlug && projectId ? `PROJECT_WORKFLOW_${workspaceSlug}_${projectId}` : null,
    () => workflowStore.fetchWorkflow(workspaceSlug, projectId),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <>
      {projectPreferences.navigationMode === "TABBED" && (
        <div className="z-20">
          <Row className="h-header flex gap-2 w-full items-center border-b border-subtle bg-surface-1">
            <div className="flex items-center gap-2 divide-x divide-subtle h-full w-full">
              <div className="flex items-center gap-2 size-full flex-1">
                {sidebarCollapsed && (
                  <div className="shrink-0">
                    <AppSidebarToggleButton />
                  </div>
                )}
                <Header className={cn("h-full", { "pl-1.5": !sidebarCollapsed })}>
                  <Header.LeftItem className="h-full max-w-full flex items-center gap-2">
                    <TabNavigationRoot workspaceSlug={workspaceSlug} projectId={projectId} />
                  </Header.LeftItem>
                </Header>
              </div>
            </div>
          </Row>
        </div>
      )}
      <ProjectAuthWrapper workspaceSlug={workspaceSlug} projectId={projectId}>
        <Outlet />
      </ProjectAuthWrapper>
      {/* Workflow blocker modal — mounts here, self-opens on WORKFLOW_TRANSITION_BLOCKED 403s */}
      <WorkflowBlockerModal projectId={projectId} />
    </>
  );
}

const ProjectLayoutObserved = observer(ProjectLayout);
export default ProjectLayoutObserved;
