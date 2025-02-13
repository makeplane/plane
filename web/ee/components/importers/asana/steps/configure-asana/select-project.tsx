"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { AsanaProject } from "@plane/etl/asana";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
import { useTranslation } from "@plane/i18n";

type TConfigureAsanaSelectProject = {
  workspaceGid: string | undefined;
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureAsanaSelectProject: FC<TConfigureAsanaSelectProject> = observer((props) => {
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
  ) as AsanaProject[];
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
      <div className="text-sm text-custom-text-200">{t("importers.select_service_project", { "serviceName": "Asana" })}</div>
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
          placeHolder={isLoading ? t("importers.loading_service_projects", { "serviceName": "Asana" }) : t("importers.select_service_project", { "serviceName": "Asana" })}
          onChange={(value: string | undefined) => handelData(value)}
          queryExtractor={(option) => option.name}
          disabled={!workspaceGid || isLoading}
        />
      )}
    </div>
  );
});
