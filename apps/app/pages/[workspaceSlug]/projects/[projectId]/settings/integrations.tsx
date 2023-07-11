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
import {
  EmptySpace,
  EmptySpaceItem,
  IntegrationAndImportExportBanner,
  Loader,
} from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
// types
import { IProject } from "types";
import type { NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";

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
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectId}/issues`}
          />
          <BreadcrumbItem title="Integrations" />
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
            <div className="grid h-full w-full place-items-center">
              <EmptySpace
                title="You haven't added any integration yet."
                description="Add GitHub and other integrations to sync your project issues."
                Icon={PuzzlePieceIcon}
              >
                <EmptySpaceItem
                  title="Add new integration"
                  Icon={PlusIcon}
                  action={() => {
                    router.push(`/${workspaceSlug}/settings/integrations`);
                  }}
                />
              </EmptySpace>
            </div>
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
