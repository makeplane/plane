"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { JiraResource } from "@plane/etl/jira";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";
import { useTranslation } from "@plane/i18n";

type TConfigureJiraSelectResource = {
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureJiraSelectResource: FC<TConfigureJiraSelectResource> = observer((props) => {
  // props
  const { value, handleFormData } = props;

  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    data: { jiraResourceIds, getJiraResourceById, fetchJiraResources },
  } = useJiraServerImporter();
  const { t } = useTranslation();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const jiraResources = (jiraResourceIds || [])
    .map((id) => getJiraResourceById(id))
    .filter((resource) => resource != undefined && resource != null) as JiraResource[];

  // handlers
  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const resourceData = getJiraResourceById(value);
      if (resourceData) handleSyncJobConfig("resource", resourceData);
    }
  };

  // fetching the jira resources
  const { isLoading } = useSWR(
    workspaceId && userId ? `IMPORTER_JIRA_RESOURCES_${workspaceId}` : null,
    workspaceId && userId ? async () => fetchJiraResources(workspaceId, userId) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">
        {t("importers.select_service_workspace", { serviceName: "Jira" })}
      </div>
      {isLoading && (!jiraResources || jiraResources.length === 0) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={jiraResources?.map((resource) => ({
            key: resource.id,
            label: resource.name,
            value: resource.id,
            data: resource,
          }))}
          value={value}
          placeHolder={t("importers.select_service_workspace", { serviceName: "Jira" })}
          onChange={(value: string | undefined) => handelData(value)}
          queryExtractor={(option) => option.name}
        />
      )}
    </div>
  );
});
