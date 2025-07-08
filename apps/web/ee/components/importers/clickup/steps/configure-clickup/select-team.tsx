"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { TClickUpTeam } from "@plane/etl/clickup";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/plane-web/components/importers/ui";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";

type TConfigureClickUpSelectTeam = {
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureClickUpSelectTeam: FC<TConfigureClickUpSelectTeam> = observer((props) => {
  // props
  const { value, handleFormData } = props;

  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    data: { fetchClickUpTeams, getClickUpTeamById, clickUpTeamIds },
  } = useClickUpImporter();
  const { t } = useTranslation();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const clickUpTeams = (clickUpTeamIds || [])
    .map((id) => (id ? getClickUpTeamById(id) : undefined))
    .filter((project) => project != undefined && project != null) as TClickUpTeam[];

  const handleData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const teamData = getClickUpTeamById(value);
      if (teamData) handleSyncJobConfig("team", teamData);
    }
  };

  // fetching the clickup teams
  const { isLoading: isClickUpTeamLoading } = useSWR(
    workspaceId && userId ? `IMPORTER_CLICKUP_TEAMS_${workspaceId}` : null,
    workspaceId && userId ? async () => fetchClickUpTeams(workspaceId, userId) : null,
    { errorRetryCount: 0 }
  );

  return (
    <div className="space-y-2">
      <div className="text-sm text-custom-text-200">Select ClickUp team</div>
      {(isClickUpTeamLoading && (!clickUpTeams || clickUpTeams.length === 0)) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(clickUpTeams || [])?.map((project) => ({
            key: project.id,
            label: project.name,
            value: project.id,
            data: project,
          }))}
          value={value}
          placeHolder={t("importers.select_service_team", { serviceName: "ClickUp" })}
          onChange={(value: string | undefined) => handleData(value)}
          queryExtractor={(option) => option.name}
        />
      )}
    </div>
  );
});
