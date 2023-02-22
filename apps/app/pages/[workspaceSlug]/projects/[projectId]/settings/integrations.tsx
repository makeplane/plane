import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import useSWR, { mutate } from "swr";

// lib
import { requiredAdmin } from "lib/auth";
// layouts
import AppLayout from "layouts/app-layout";
// services
import workspaceService from "services/workspace.service";
import projectService from "services/project.service";

import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import { IProject, IWorkspace } from "types";
import type { NextPageContext, NextPage } from "next";
// fetch-keys
import { PROJECT_DETAILS, WORKSPACE_INTEGRATIONS } from "constants/fetch-keys";

type TProjectIntegrationsProps = {
  isMember: boolean;
  isOwner: boolean;
  isViewer: boolean;
  isGuest: boolean;
};

const defaultValues: Partial<IProject> = {
  project_lead: null,
  default_assignee: null,
};

const ProjectIntegrations: NextPage<TProjectIntegrationsProps> = (props) => {
  const { isMember, isOwner, isViewer, isGuest } = props;
  const [userRepos, setUserRepos] = useState([]);
  const [activeIntegrationId, setActiveIntegrationId] = useState();

  const {
    query: { workspaceSlug, projectId },
  } = useRouter();

  const { data: projectDetails } = useSWR<IProject>(
    workspaceSlug && projectId ? PROJECT_DETAILS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.getProject(workspaceSlug as string, projectId as string)
      : null
  );

  const { data: integrations } = useSWR(
    workspaceSlug ? WORKSPACE_INTEGRATIONS(workspaceSlug as string) : null,
    () =>
      workspaceSlug ? workspaceService.getWorkspaceIntegrations(workspaceSlug as string) : null
  );
  const handleChange = (repo: any) => {
    const {
      html_url,
      owner: { login },
      id,
      name,
    } = repo;

    projectService
      .syncGiuthubRepository(
        workspaceSlug as string,
        projectId as string,
        activeIntegrationId as any,
        { name, owner: login, repository_id: id, url: html_url }
      )
      .then((res) => {
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  console.log(userRepos);
  return (
    <AppLayout
      settingsLayout="project"
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
    >
      <section className="space-y-8">
        {integrations?.map((integration: any) => (
          <div
            key={integration.id}
            onClick={() => {
              setActiveIntegrationId(integration.id);
              projectService
                .getGithubRepositories(workspaceSlug as any, integration.id)
                .then((response) => {
                  setUserRepos(response.repositories);
                })
                .catch((err) => {
                  console.log(err);
                });
            }}
          >
            {integration.integration_detail.provider}
          </div>
        ))}
        {userRepos.length > 0 && (
          <select
            onChange={(e) => {
              const repo = userRepos.find((repo: any) => repo.id == e.target.value);
              handleChange(repo);
            }}
          >
            <option value={undefined}>Select Repository</option>
            {userRepos?.map((repo: any) => (
              <option value={repo.id} key={repo.id}>
                {repo.full_name}
              </option>
            ))}
          </select>
        )}
      </section>
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
