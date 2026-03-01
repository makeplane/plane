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
import { useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import type { TClickUpFolder } from "@plane/etl/clickup";
import { useTranslation } from "@plane/i18n";
import { ChevronDownIcon } from "@plane/propel/icons";
import { Loader, MultiSelectDropdown } from "@plane/ui";
// plane web components
import { cn } from "@plane/utils";
// plane web hooks
import { useClickUpImporter } from "@/plane-web/hooks/store";

type TConfigureClickUpSelectFolder = {
  value: string[];
  spaceId: string | undefined;
  handleFormData: (value: string[]) => void;
};

const COMMON_DROPDOWN_CONTAINER_CLASSNAME = "bg-surface-1 border border-subtle-1 rounded-md px-2 py-1";

export const ConfigureClickUpSelectFolder = observer(function ConfigureClickUpSelectFolder(
  props: TConfigureClickUpSelectFolder
) {
  // props
  const { value, handleFormData, spaceId } = props;

  // hooks
  const {
    workspace,
    user,
    handleSyncJobConfig,
    data: {
      fetchClickUpFolders,
      getClickUpFolderById,
      getClickUpFolderIdsBySpaceId,
      clickUpFolders: clickUpFoldersData,
    },
  } = useClickUpImporter();
  const { t } = useTranslation();

  // derived values
  const workspaceId = workspace?.id || undefined;
  const userId = user?.id || undefined;
  const clickUpFolderIds = spaceId ? getClickUpFolderIdsBySpaceId(spaceId) : [];
  const clickUpFolders = spaceId
    ? getClickUpFolderIdsBySpaceId(spaceId)
        .map((id) => (id ? getClickUpFolderById(spaceId, id) : undefined))
        .filter((project) => project != undefined && project != null)
    : [];

  // Add useEffect to handle prefilling
  useEffect(() => {
    if (clickUpFolderIds && clickUpFolderIds.length > 0) {
      handleData(clickUpFolderIds);
    }
  }, [clickUpFolderIds]);

  const handleData = (value: string[]) => {
    handleFormData(value);
    // updating the config data
    if (value && spaceId) {
      const folderData = value.map((id) => getClickUpFolderById(spaceId, id));
      handleSyncJobConfig(
        "folders",
        folderData.filter((folder) => folder !== undefined)
      );
    }
  };

  // fetching the clickup teams
  const { isLoading: isClickUpFolderLoading } = useSWR(
    workspaceId && userId && spaceId ? `IMPORTER_CLICKUP_FOLDERS_${workspaceId}_${spaceId}` : null,
    workspaceId && userId && spaceId ? async () => fetchClickUpFolders(workspaceId, userId, spaceId) : null,
    { errorRetryCount: 0 }
  );

  if (!spaceId) return null;

  const options = clickUpFolders.map((folder) => ({
    data: folder.id,
    value: folder.name,
  }));

  return (
    <div className="space-y-2">
      <div className="text-13 text-secondary">
        {t("clickup_importer.select_service_folder", { serviceName: "ClickUp" })}
      </div>
      {isClickUpFolderLoading && (!clickUpFolders || clickUpFolders.length === 0) ? (
        <Loader>
          <Loader.Item height="28px" width="100%" />
        </Loader>
      ) : (
        <MultiSelectDropdown
          value={value}
          options={options}
          onChange={(value) => handleData(value)}
          keyExtractor={(option) => option.data}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          buttonContent={(isOpen, val) => (
            <span className="flex items-center justify-between gap-1 text-13 text-secondary w-72">
              {val && val.length > 0
                ? `${val.length} ${t("clickup_importer.selected")}`
                : `${t("clickup_importer.select_service_folder", { serviceName: "ClickUp" })}`}
              <ChevronDownIcon
                height={16}
                width={16}
                className={cn(isOpen ? "rotate-180 ml-auto" : "rotate-0 ml-auto")}
              />
            </span>
          )}
          disableSearch
        />
      )}
    </div>
  );
});
