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

import type { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { AsanaProject } from "@plane/etl/asana";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";

type TConfigureAsanaSelectProject = {
  workspaceGid: string | undefined;
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureAsanaSelectProject = observer(function ConfigureAsanaSelectProject(
  props: TConfigureAsanaSelectProject
) {
  // props
  const { workspaceGid, value, handleFormData } = props;
  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    data: { fetchAsanaProjects, getAsanaProjectsByWorkspaceGid, getAsanaProjectById },
  } = useAsanaImporter();
  const { t } = useTranslation();
  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const asanaProjects = ((workspaceGid && getAsanaProjectsByWorkspaceGid(workspaceGid)) || []).filter(
    (project: AsanaProject) => project && project.gid
  );
  // handlers
  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value && workspaceGid) {
      const projectData = getAsanaProjectById(workspaceGid, value);
      if (projectData) handleSyncJobConfig("project", projectData);
    }
  };

  // fetching the asana projects
  const { isLoading } = useSWR(
    workspaceId && userId && workspaceGid ? `IMPORTER_ASANA_PROJECTS_${workspaceId}_${userId}_${workspaceGid}` : null,
    workspaceId && userId && workspaceGid ? async () => fetchAsanaProjects(workspaceId, userId, workspaceGid) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="text-13 text-secondary">{t("importers.select_service_project", { serviceName: "Asana" })}</div>
      {isLoading && (!asanaProjects || asanaProjects.length === 0) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(asanaProjects || [])?.map((project) => ({
            key: project.gid,
            label: project.name,
            value: project.gid,
            data: project,
          }))}
          value={value}
          placeHolder={
            isLoading
              ? t("importers.loading_service_projects", { serviceName: "Asana" })
              : t("importers.select_service_project", { serviceName: "Asana" })
          }
          onChange={(value: string | undefined) => handelData(value)}
          queryExtractor={(option) => option.name}
          disabled={!workspaceGid || isLoading}
        />
      )}
    </div>
  );
});
