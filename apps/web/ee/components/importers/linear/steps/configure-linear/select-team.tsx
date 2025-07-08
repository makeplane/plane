"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { LinearTeam } from "@plane/etl/linear";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
import { useTranslation } from "@plane/i18n";

type TConfigureLinearSelectTeam = {
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureLinearSelectTeam: FC<TConfigureLinearSelectTeam> = observer((props) => {
  // props
  const { value, handleFormData } = props;

  // hooks
  const {
    workspace,
    user,
    handleTeamSyncJobConfig,
    data: {
      fetchLinearOrganizations,
      linearOrganizationId,
      getLinearOrganizationById,
      fetchLinearTeams,
      linearTeamIds,
      getLinearTeamById,
    },
  } = useLinearImporter();
  const { t } = useTranslation();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const linearTeams = (linearTeamIds || [])
    .map((id) => (id ? getLinearTeamById(id) : undefined))
    .filter((project) => project != undefined && project != null) as LinearTeam[];
  const linearOrganization = linearOrganizationId && getLinearOrganizationById(linearOrganizationId);

  const handelData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const teamData = getLinearTeamById(value);
      if (teamData && linearOrganization)
        handleTeamSyncJobConfig({
          teamId: teamData.id,
          teamName: teamData.name,
          teamUrl: `https://linear.app/${linearOrganization?.urlKey}`,
          workspace: linearOrganization?.id,
          workspaceDetail: linearOrganization,
          teamDetail: teamData,
        });
    }
  };

  // fetching the linear organization
  const { isLoading: isLinearOrganizationLoading } = useSWR(
    workspaceId && userId ? `IMPORTER_LINEAR_ORGANIZATION_${workspaceId}` : null,
    workspaceId && userId ? async () => fetchLinearOrganizations(workspaceId, userId) : null,
    { errorRetryCount: 0 }
  );

  // fetching the linear teams
  const { isLoading: isLinearTeamLoading } = useSWR(
    workspaceId && userId ? `IMPORTER_LINEAR_TEAMS_${workspaceId}` : null,
    workspaceId && userId ? async () => fetchLinearTeams(workspaceId, userId) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select Linear team</div>
      {(isLinearTeamLoading && (!linearTeams || linearTeams.length === 0)) ||
      (isLinearOrganizationLoading && !linearOrganization) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(linearTeams || [])?.map((project) => ({
            key: project.id,
            label: project.name,
            value: project.id,
            data: project,
          }))}
          value={value}
          placeHolder={t("importers.select_service_team", { serviceName: "Linear" })}
          onChange={(value: string | undefined) => handelData(value)}
          // iconExtractor={(option) => (
          //   <div className="!w-4 !h-4 flex-shrink-0 overflow-hidden relative flex justify-center items-center rounded-sm">
          //     {option && option.avatarUrls?.["48x48"] ? (
          //       <img
          //         src={option.avatarUrls?.["48x48"]}
          //         alt={`Linear Project ${option.name}`}
          //         className="w-full h-full object-contain object-center"
          //       />
          //     ) : (
          //       <></>
          //     )}
          //   </div>
          // )}
          queryExtractor={(option) => option.name}
        />
      )}
    </div>
  );
});
