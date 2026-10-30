/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import { setToast } from "@plane/blocks/toast";
import type { IWorkspaceIntegration } from "@plane/types";
// assets
import GithubLogo from "@/app/assets/logos/github-square.png?url";
import SlackLogo from "@/app/assets/services/slack.png?url";
// components
import { SelectChannel } from "@/components/integration/slack/select-channel";
import { SelectRepository } from "@/components/integration/github/select-repository";
// constants
import { PROJECT_GITHUB_REPOSITORY } from "@plane/constants";
// services
import { ProjectService } from "@/services/project";

type Props = {
  integration: IWorkspaceIntegration;
};

// services
const projectService = new ProjectService();

export function IntegrationCard({ integration }: Props) {
  const { t } = useTranslation();
  const integrationDetails: { [key: string]: any } = {
    github: {
      logo: GithubLogo,
      description: t("web_ui.select_github_repository_to_enable_sync"),
    },
    slack: {
      logo: SlackLogo,
      description: t("web_ui.get_regular_updates_and_control_which_notification_you_want_to_receive"),
    },
  };

  const { workspaceSlug, projectId } = useParams();

  const { data: syncedGithubRepository } = useSWR(projectId ? PROJECT_GITHUB_REPOSITORY(projectId) : null, () =>
    workspaceSlug && projectId && integration
      ? projectService.getProjectGithubRepository(workspaceSlug, projectId, integration.id)
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
      .syncGithubRepository(workspaceSlug, projectId, integration.id, {
        name,
        owner: login,
        repository_id: id,
        url: html_url,
      })
      .then(() => {
        mutate(PROJECT_GITHUB_REPOSITORY(projectId));

        setToast({
          type: "success",
          title: t("success"),
          message: t("web_ui.dynamic_value0_value1_repository_synced_with_the_project_successfully", {
            value0: login,
            value1: name,
          }),
        });

        return undefined;
      })
      .catch((err) => {
        console.error(err);
        setToast({
          type: "error",
          title: t("error"),
          message: t("web_ui.repository_could_not_be_synced_with_the_project_please_try_again"),
        });
      });
  };

  return (
    <>
      {integration && (
        <div className="flex items-center justify-between gap-2 border-b border-subtle bg-surface-1 px-4 py-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 flex-shrink-0">
              <img
                src={integrationDetails[integration.integration_detail.provider].logo}
                className="h-full w-full object-cover"
                alt={t("web_ui.dynamic_value0_logo", { value0: integration.integration_detail.title })}
              />
            </div>
            <div>
              <h3 className="flex items-center gap-4 text-13 font-medium">{integration.integration_detail.title}</h3>
              <p className="text-13 tracking-tight text-secondary">
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
                  : t("web_ui.select_repository")
              }
              onChange={handleChange}
            />
          )}
          {integration.integration_detail.provider === "slack" && <SelectChannel integration={integration} />}
        </div>
      )}
    </>
  );
}
