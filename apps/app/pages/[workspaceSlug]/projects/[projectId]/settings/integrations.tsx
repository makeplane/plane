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
import { EmptySpace, EmptySpaceItem, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
import { ExclamationIcon } from "components/icons";
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
      <div className="p-8 lg:px-24">
        <SettingsHeader />
        {workspaceIntegrations ? (
          workspaceIntegrations.length > 0 ? (
            <section className="space-y-8">
              <div className="flex flex-col items-start gap-3">
                <h3 className="text-2xl font-semibold">Integrations</h3>
                <div className="flex items-center gap-3 rounded-[10px] border border-brand-accent/75 bg-brand-accent/5 p-4 text-sm text-brand-base">
                  <ExclamationIcon
                    height={24}
                    width={24}
                    className="fill-current text-brand-base"
                  />
                  <p className="leading-5">
                    Integrations and importers are only available on the cloud version. We plan to
                    open-source our SDKs in the near future so that the community can request or
                    contribute integrations as needed.
                  </p>
                </div>
              </div>
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
