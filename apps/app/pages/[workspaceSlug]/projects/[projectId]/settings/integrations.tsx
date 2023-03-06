import React, { useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// lib
import { requiredAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// services
import workspaceService from "services/workspace.service";
import projectService from "services/project.service";
// ui
import { EmptySpace, EmptySpaceItem, Loader } from "components/ui";
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// icons
import { PlusIcon, PuzzlePieceIcon } from "@heroicons/react/24/outline";
// types
import { IProject, UserAuth } from "types";
import type { NextPageContext, NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";
import { SingleIntegration } from "components/project";

const ProjectIntegrations: NextPage<UserAuth> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;

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
      workspaceSlug ? workspaceService.getWorkspaceIntegrations(workspaceSlug as string) : null
  );

  return (
    <AppLayout
      memberType={{ isMember, isOwner, isViewer, isGuest }}
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem
            title={`${projectDetails?.name ?? "Project"}`}
            link={`/${workspaceSlug}/projects/${projectId}/issues`}
          />
          <BreadcrumbItem title="Integrations" />
        </Breadcrumbs>
      }
      settingsLayout
    >
      {workspaceIntegrations ? (
        workspaceIntegrations.length > 0 ? (
          <section className="space-y-8">
            <h3 className="text-2xl font-semibold">Integrations</h3>
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
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const projectId = ctx.query.projectId as string;
  const workspaceSlug = ctx.query.workspaceSlug as string;

  const memberDetail = await requiredAdmin(workspaceSlug, projectId, ctx.req?.headers.cookie);

  return {
    props: {
      isOwner: memberDetail?.role === 20,
      isMember: memberDetail?.role === 15,
      isViewer: memberDetail?.role === 10,
      isGuest: memberDetail?.role === 5,
    },
  };
};

export default ProjectIntegrations;
