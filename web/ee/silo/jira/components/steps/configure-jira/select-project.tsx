"use client";

import { FC } from "react";
// silo hooks
import { useImporter, useJiraProjects } from "@/plane-web/silo/jira/hooks";
// silo ui components
import { Dropdown } from "@/plane-web/silo/ui";

type TConfigureJiraSelectProject = {
  resourceId: string;
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureJiraSelectProject: FC<TConfigureJiraSelectProject> = (props) => {
  // props
  const { resourceId, value, handleFormData } = props;
  // hooks
  const { handleSyncJobConfig } = useImporter();
  const { data: jiraProjects, getById: getProjectById } = useJiraProjects(resourceId);

  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const projectData = getProjectById(value);
      if (projectData) handleSyncJobConfig("project", projectData);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select Jira project</div>
      <Dropdown
        dropdownOptions={(jiraProjects || [])?.map((project) => ({
          key: project.id,
          label: project.name,
          value: project.id,
          data: project,
        }))}
        value={value}
        placeHolder="Select jira project"
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
    </div>
  );
};
