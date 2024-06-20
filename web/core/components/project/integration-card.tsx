"use client";

import React from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { IWorkspaceIntegration } from "@plane/types";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
import { SelectRepository, SelectChannel } from "@/components/integration";
// constants
import { PROJECT_GITHUB_REPOSITORY } from "@/constants/fetch-keys";
// icons
import GithubLogo from "@/public/logos/github-square.png";
import SlackLogo from "@/public/services/slack.png";
import { ProjectService } from "@/services/project";
// types

type Props = {
  integration: IWorkspaceIntegration;
};

const integrationDetails: { [key: string]: any } = {
  github: {
    logo: GithubLogo,
    description: "Select GitHub repository to enable sync.",
  },
  slack: {
    logo: SlackLogo,
    description: "Get regular updates and control which notification you want to receive.",
  },
};

// services
const projectService = new ProjectService();

export const IntegrationCard: React.FC<Props> = ({ integration }) => {
  const { workspaceSlug, projectId } = useParams();

  const { data: syncedGithubRepository } = useSWR(
    projectId ? PROJECT_GITHUB_REPOSITORY(projectId as string) : null,
    () =>
      workspaceSlug && projectId && integration
        ? projectService.getProjectGithubRepository(workspaceSlug as string, projectId as string, integration.id)
        : null
  );

  const handleChange = (repo: any) => {
    if (!workspaceSlug || !projectId || !integration) return;

    const {
      html_url,
      owner: { login },
      id,
      name,
    } = repo;

    projectService
      .syncGithubRepository(workspaceSlug as string, projectId as string, integration.id, {
        name,
        owner: login,
        repository_id: id,
        url: html_url,
      })
      .then(() => {
        mutate(PROJECT_GITHUB_REPOSITORY(projectId as string));

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `${login}/${name} repository synced with the project successfully.`,
        });
      })
      .catch((err) => {
        console.error(err);
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Repository could not be synced with the project. Please try again.",
        });
      });
  };

  return (
    <>
      {integration && (
        <div className="flex items-center justify-between gap-2 border-b border-custom-border-100 bg-custom-background-100 px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 flex-shrink-0">
              <Image
                src={integrationDetails[integration.integration_detail.provider].logo}
                alt={`${integration.integration_detail.title} Logo`}
              />
            </div>
            <div>
              <h3 className="flex items-center gap-4 text-sm font-medium">{integration.integration_detail.title}</h3>
              <p className="text-sm tracking-tight text-custom-text-200">
                {integrationDetails[integration.integration_detail.provider].description}
              </p>
            </div>
          </div>
          {integration.integration_detail.provider === "github" && (
            <SelectRepository
              integration={integration}
              value={
                syncedGithubRepository && syncedGithubRepository.length > 0
                  ? `${syncedGithubRepository[0].repo_detail.owner}/${syncedGithubRepository[0].repo_detail.name}`
                  : null
              }
              label={
                syncedGithubRepository && syncedGithubRepository.length > 0
                  ? `${syncedGithubRepository[0].repo_detail.owner}/${syncedGithubRepository[0].repo_detail.name}`
                  : "Select Repository"
              }
              onChange={handleChange}
            />
          )}
          {integration.integration_detail.provider === "slack" && <SelectChannel integration={integration} />}
        </div>
      )}
    </>
  );
};
