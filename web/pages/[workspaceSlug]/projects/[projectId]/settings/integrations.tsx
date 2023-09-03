import React from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// layouts
import { ProjectAuthorizationWrapper } from "layouts/auth-layout";
// services
import IntegrationService from "services/integration";
import projectService from "services/project.service";
// components
import { SettingsHeader, SingleIntegration } from "components/project";
// ui
import { EmptyState, IntegrationAndImportExportBanner, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
// images
import emptyIntegration from "public/empty-state/integration.svg";
// types
import { IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";

const ProjectIntegrations: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: workspaceIntegrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () =>
      workspaceSlug
        ? IntegrationService.getWorkspaceIntegrationsList(workspaceSlug as string)
        : null
  );

  return (
    <ProjectAuthorizationWrapper
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${truncateText(projectDetails?.name ?? "Project", 32)}`}
            link={`/${workspaceSlug}/projects/${projectId}/issues`}
            linkTruncate
          />
          <BreadcrumbItem title="Integrations" unshrinkTitle />
        </Breadcrumbs>
      }
    >
      <div className="h-full flex flex-col p-8 overflow-hidden">
        <SettingsHeader />
        {workspaceIntegrations ? (
          workspaceIntegrations.length > 0 ? (
            <section className="space-y-8 overflow-y-auto">
              <IntegrationAndImportExportBanner bannerName="Integrations" />
              <div className="space-y-5">
                {workspaceIntegrations.map((integration) => (
                  <SingleIntegration
                    key={integration.integration_detail.id}
                    integration={integration}
                  />
                ))}
              </div>
            </section>
          ) : (
            <EmptyState
              title="You haven't configured integrations"
              description="Configure GitHub and other integrations to sync your project issues."
              image={emptyIntegration}
              primaryButton={{
                text: "Configure now",
                onClick: () => router.push(`/${workspaceSlug}/settings/integrations`),
              }}
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
    </ProjectAuthorizationWrapper>
  );
};

export default ProjectIntegrations;
