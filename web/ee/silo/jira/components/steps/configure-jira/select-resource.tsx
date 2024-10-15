"use client";

import { FC } from "react";
// silo hooks
import { useImporter, useJiraResources } from "@/plane-web/silo/jira/hooks";
// silo ui components
import { Dropdown } from "@/plane-web/silo/ui";

type TConfigureJiraSelectResource = {
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureJiraSelectResource: FC<TConfigureJiraSelectResource> = (props) => {
  // props
  const { value, handleFormData } = props;
  // hooks
  const { handleSyncJobConfig } = useImporter();
  const { data: jiraResources, getById: getResourceById } = useJiraResources();

  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const resourceData = getResourceById(value);
      if (resourceData) handleSyncJobConfig("resource", resourceData);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select Jira workspace</div>
      <Dropdown
        dropdownOptions={(jiraResources || [])?.map((resource) => ({
          key: resource.id,
          label: resource.name,
          value: resource.id,
          data: resource,
        }))}
        value={value}
        placeHolder="Select jira workspace"
        onChange={(value: string | undefined) => handelData(value)}
        iconExtractor={(option) => (
          <div className="!w-4 !h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center rounded-sm">
            {option && option.avatarUrl && (
              <img src={option.avatarUrl} alt={option.name} className="w-full h-full object-contain object-center" />
            )}
          </div>
        )}
        queryExtractor={(option) => option.name}
      />
    </div>
  );
};
