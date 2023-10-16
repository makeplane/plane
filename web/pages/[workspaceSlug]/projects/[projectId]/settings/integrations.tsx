import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout-legacy";
// services
import { IntegrationService } from "services/integrations";
import { ProjectService } from "services/project";
// components
import { SettingsSidebar, SingleIntegration } from "components/project";
// ui
import { EmptyState } from "components/common";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
import { Loader } from "@plane/ui";
// images
import emptyIntegration from "public/empty-state/integration.svg";
// types
import { IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, USER_PROJECT_VIEW, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

// services
const integrationService = new IntegrationService();
const projectService = new ProjectService();

const ProjectIntegrations: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId ? () => projectService.getProject(workspaceSlug as string, projectId as string) : null
  );

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () => (workspaceSlug ? integrationService.getWorkspaceIntegrationsList(workspaceSlug as string) : null)
  );

  const { data: memberDetails } = useSWR(
    workspaceSlug && projectId ? USER_PROJECT_VIEW(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMemberMe(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const isAdmin = memberDetails?.role === 20;

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
            link={`/${workspaceSlug}/projects/${projectId}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title="Integrations Settings" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="flex flex-row gap-2 h-full">
        <div className="w-80 pt-8 overflow-y-hidden flex-shrink-0">
          <SettingsSidebar />
        </div>
        <div className={`pr-9 py-8 gap-10 w-full overflow-y-auto ${isAdmin ? "" : "opacity-60"}`}>
          <div className="flex items-center py-3.5 border-b border-custom-border-200">
            <h3 className="text-xl font-medium">Integrations</h3>
          </div>
          {workspaceIntegrations ? (
            workspaceIntegrations.length > 0 ? (
              <div>
                {workspaceIntegrations.map((integration) => (
                  <SingleIntegration key={integration.integration_detail.id} integration={integration} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="You haven't configured integrations"
                description="Configure GitHub and other integrations to sync your project issues."
                image={emptyIntegration}
                primaryButton={{
                  text: "Configure now",
                  onClick: () => router.push(`/${workspaceSlug}/settings/integrations`),
                }}
                disabled={!isAdmin}
              />
            )
          ) : (
            <Loader className="space-y-5">
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
              <Loader.Item height="40px" />
            </Loader>
          )}
        </div>
      </div>
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectIntegrations;
