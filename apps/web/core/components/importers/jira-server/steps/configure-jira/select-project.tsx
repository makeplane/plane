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

import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";

type TConfigureJiraSelectProject = {
  resourceId: string | undefined;
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureJiraSelectProject = observer(function ConfigureJiraSelectProject(
  props: TConfigureJiraSelectProject
) {
  // props
  const { resourceId, value, handleFormData } = props;

  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    data: { fetchJiraProjects, jiraProjectIdsByResourceId, getJiraProjectById },
  } = useJiraServerImporter();
  const { t } = useTranslation();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const jiraProjects = ((resourceId && jiraProjectIdsByResourceId(resourceId)) || [])
    .map((id) => (resourceId && id ? getJiraProjectById(resourceId, id) : undefined))
    .filter((project) => project != undefined && project != null);

  // handlers
  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value && resourceId) {
      const projectData = getJiraProjectById(resourceId, value);
      if (projectData) handleSyncJobConfig("project", projectData);
    }
  };

  // fetching the jira resource projects
  const { isLoading } = useSWR(
    workspaceId && userId && resourceId ? `IMPORTER_JIRA_RESOURCE_PROJECTS_${workspaceId}_${resourceId}` : null,
    workspaceId && userId && resourceId ? async () => fetchJiraProjects(workspaceId, userId, resourceId) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="text-13 text-secondary">{t("importers.select_service_project", { serviceName: "Jira" })}</div>
      {isLoading && (!jiraProjects || jiraProjects.length === 0) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(jiraProjects || [])?.map((project) => ({
            key: project.id,
            label: project.name,
            value: project.id,
            data: project,
          }))}
          value={value}
          placeHolder={t("importers.select_service_project", { serviceName: "Jira" })}
          onChange={(value: string | undefined) => handelData(value)}
          iconExtractor={(option) => (
            <div className="!w-4 !h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center rounded-sm">
              {option && option.avatarUrls?.["48x48"] ? (
                <img
                  src={option.avatarUrls?.["48x48"]}
                  alt={`Jira Project ${option.name}`}
                  className="w-full h-full object-contain object-center"
                />
              ) : (
                <></>
              )}
            </div>
          )}
          queryExtractor={(option) => option.name}
        />
      )}
    </div>
  );
});
