"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Loader } from "@plane/ui";
import { JiraResource } from "@silo/jira";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useJiraServerImporter } from "@/plane-web/hooks/store";

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
      <div className="text-sm text-custom-text-200">Select Jira workspace</div>
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
          placeHolder="Select jira workspace"
          onChange={(value: string | undefined) => handelData(value)}
          queryExtractor={(option) => option.name}
        />
      )}
    </div>
  );
});
