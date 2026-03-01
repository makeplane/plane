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
import type { TClickUpSpace } from "@plane/etl/clickup";
import { useTranslation } from "@plane/i18n";
import { Loader } from "@plane/ui";
// plane web components
import { Dropdown } from "@/components/importers/ui";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";
import { E_CLICKUP_IMPORTER_STEPS } from "@/types/importers/clickup";

type TConfigureClickUpSelectSpace = {
  value: string | undefined;
  teamId: string | undefined;
  handleFormData: (value: string | undefined) => void;
};

export const ConfigureClickUpSelectSpace = observer(function ConfigureClickUpSelectSpace(
  props: TConfigureClickUpSelectSpace
) {
  // props
  const { value, handleFormData, teamId } = props;

  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    importerData,
    data: { fetchClickUpSpaces, getClickUpSpaceById, clickUpSpaceIds },
  } = useClickUpImporter();
  const { t } = useTranslation();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const clickUpSpaces = (clickUpSpaceIds || [])
    .map((id) => (id ? getClickUpSpaceById(id) : undefined))
    .filter((project) => project != undefined && project != null);

  const handleData = (value: string | undefined) => {
    handleFormData(value);
    // updating the config data
    if (value) {
      const spaceData = getClickUpSpaceById(value);
      if (spaceData) handleSyncJobConfig("space", spaceData);
    }
  };

  // fetching the clickup teams
  const { isLoading: isClickUpSpaceLoading } = useSWR(
    workspaceId && userId && teamId ? `IMPORTER_CLICKUP_SPACES_${workspaceId}_${teamId}` : null,
    workspaceId && userId && teamId ? async () => fetchClickUpSpaces(workspaceId, userId, teamId) : null,
    { errorRetryCount: 0 }
  );

  if (!teamId) return null;

  return (
    <div className="space-y-2">
      <div className="text-13 text-secondary">
        {t("clickup_importer.select_service_space", { serviceName: "ClickUp" })}
      </div>
      {isClickUpSpaceLoading && (!clickUpSpaces || clickUpSpaces.length === 0) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <Dropdown
          dropdownOptions={(clickUpSpaces || [])?.map((project) => ({
            key: project.id,
            label: project.name,
            value: project.id,
            data: project,
          }))}
          value={value}
          placeHolder={t("clickup_importer.select_service_space", { serviceName: "ClickUp" })}
          onChange={(value: string | undefined) => handleData(value)}
          queryExtractor={(option) => option.name}
        />
      )}
    </div>
  );
});
