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
import type { TClickUpTeam } from "@plane/etl/clickup";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";

type TConfigureClickUpSelectTeam = {
  value: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureClickUpSelectTeam = observer(function ConfigureClickUpSelectTeam(
  props: TConfigureClickUpSelectTeam
) {
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
    .filter((project) => project != undefined && project != null);

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
      <div className="text-13 text-secondary">Select ClickUp team</div>
      {isClickUpTeamLoading && (!clickUpTeams || clickUpTeams.length === 0) ? (
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
