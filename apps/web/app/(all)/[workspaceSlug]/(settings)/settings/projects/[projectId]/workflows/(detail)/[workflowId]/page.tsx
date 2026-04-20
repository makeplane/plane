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

import type { Route } from "./+types/page";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { useProject } from "@/hooks/store/use-project";
import { WorkflowDetailMainContent } from "@/components/workflows/detail/main-content";
import { PageHead } from "@/components/core/page-title";
import { WorkflowConfigSidebarRoot } from "@/components/workflows/detail/sidebar/root";
import { WorkflowsDetailHeader } from "./header";
import { useNavigate } from "react-router";
import { useWorkflows } from "@/hooks/store/use-workflows";
import { EmptyStateDetailed } from "@plane/propel/empty-state";
import { Loader } from "@plane/ui";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { observer } from "mobx-react";
import { useEffect } from "react";

function WorkflowsDetailPage({ params }: Route.ComponentProps) {
  // params
  const { workspaceSlug, projectId, workflowId } = params;
  // store hooks
  const { currentProjectDetails: projectDetails } = useProject();
  const {
    getWorkflowById,
    isWorkflowsEnabled,
    loader,
    permissions: { getCanView },
  } = useWorkflows();
  const navigate = useNavigate();
  // derived values
  const workflow = getWorkflowById(workflowId);
  const pageTitle = projectDetails?.name ? `${projectDetails?.name} - Workflows` : undefined;
  const canViewWorkflow = getCanView(workspaceSlug, projectId);
  const isProjectWorkflowEnabled = isWorkflowsEnabled(workspaceSlug, projectId);

  // redirect to list page if not enabled
  useEffect(() => {
    if (projectDetails && !isProjectWorkflowEnabled) {
      navigate(`/${workspaceSlug}/settings/projects/${projectId}/workflows`);
    }
  }, [isProjectWorkflowEnabled, navigate, projectDetails, projectId, workspaceSlug]);

  if (!canViewWorkflow) {
    return <NotAuthorizedView section="settings" isProjectView />;
  }
  // To avoid render during useEffect redirecting to list page.
  if (projectDetails && !isProjectWorkflowEnabled) {
    return null;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <div className="@container grow size-full flex flex-col overflow-hidden">
        <div className="shrink-0 w-full">
          <WorkflowsDetailHeader workspaceSlug={workspaceSlug} projectId={projectId} workflowId={workflowId} />
        </div>
        <div className="size-full flex overflow-hidden">
          {workflow ? (
            <>
              <WorkflowDetailMainContent workspaceSlug={workspaceSlug} projectId={projectId} workflowId={workflowId} />
              <WorkflowConfigSidebarRoot workspaceSlug={workspaceSlug} projectId={projectId} workflow={workflow} />
            </>
          ) : loader ? (
            <SettingsContentWrapper>
              <Loader className="flex flex-col size-full gap-16 p-5">
                <div className="basis-2/3 space-y-2">
                  <Loader.Item height="30px" width="40%" />
                  <Loader.Item height="15px" width="60%" />
                  <Loader.Item height="15px" width="60%" />
                  <Loader.Item height="15px" width="40%" />
                </div>
                <div className="basis-2/3 space-y-2">
                  <Loader.Item height="48px" width="100%" />
                  <Loader.Item height="48px" width="100%" />
                </div>
              </Loader>
            </SettingsContentWrapper>
          ) : (
            <EmptyStateDetailed
              assetKey="workflow"
              title="Workflow not found"
              description="The workflow you are looking for does not exist, has been removed or has been deleted."
              actions={[
                {
                  label: "View other workflows",
                  onClick: () => {
                    navigate(`/${workspaceSlug}/settings/projects/${projectId}/workflows`);
                  },
                },
              ]}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default observer(WorkflowsDetailPage);
