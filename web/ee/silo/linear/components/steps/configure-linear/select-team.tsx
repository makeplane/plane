"use client";

import { FC } from "react";
// silo hooks
import { useImporter, useLinearTeams } from "@/plane-web/silo/linear/hooks";
// silo ui components
import { Dropdown } from "@/plane-web/silo/ui";
import { useLinearOrg } from "../../../hooks/linear/use-org";

type TConfigureLinearSelectTeam = {
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureLinearSelectTeam: FC<TConfigureLinearSelectTeam> = (props) => {
  // props
  const { value, handleFormData } = props;
  // hooks
  const { handleSyncJobConfig } = useImporter();
  const { data: linearTeams, getById: getTeamById } = useLinearTeams();
  const { data: linearOrg } = useLinearOrg();

  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const teamData = getTeamById(value);
      if (teamData && teamData.id && linearOrg && linearOrg.name) {
        handleSyncJobConfig("teamId", teamData.id);
        handleSyncJobConfig("teamName", teamData.name);
        handleSyncJobConfig("workspace", linearOrg.name);
      }
      // if (teamData) handleSyncJobConfig("teamUrl", teamData.);
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select linear team</div>
      <Dropdown
        dropdownOptions={(linearTeams || [])?.map((resource) => ({
          key: resource.id,
          label: resource.name,
          value: resource.id,
          data: resource,
        }))}
        value={value}
        placeHolder="Select linear team"
        onChange={(value: string | undefined) => handelData(value)}
        // iconExtractor={(option) => (
        //   <div className="!w-4 !h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center rounded-sm">
        //     {option && option.avatarUrl && (
        //       <img src={option.avatarUrl} alt={option.name} className="w-full h-full object-contain object-center" />
        //     )}
        //   </div>
        // )}
        queryExtractor={(option) => option.name}
      />
    </div>
  );
};
