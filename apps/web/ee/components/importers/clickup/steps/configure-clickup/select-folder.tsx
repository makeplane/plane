"use client";

import { FC, useEffect } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
import { TClickUpFolder } from "@plane/etl/clickup";
import { useTranslation } from "@plane/i18n";
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

const COMMON_DROPDOWN_CONTAINER_CLASSNAME =
  "bg-custom-background-100 border border-custom-border-200 rounded-md px-2 py-1";

export const ConfigureClickUpSelectFolder: FC<TConfigureClickUpSelectFolder> = observer((props) => {
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
    ? (getClickUpFolderIdsBySpaceId(spaceId)
        .map((id) => (id ? getClickUpFolderById(spaceId, id) : undefined))
        .filter((project) => project != undefined && project != null) as TClickUpFolder[])
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
      handleSyncJobConfig("folders", folderData.filter((folder) => folder !== undefined) as TClickUpFolder[]);
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
      <div className="text-sm text-custom-text-200">
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
          onChange={(value) => handleData(value as string[])}
          keyExtractor={(option) => option.data}
          buttonContainerClassName={COMMON_DROPDOWN_CONTAINER_CLASSNAME}
          buttonContent={(isOpen, val) => (
            <span className="flex items-center justify-between gap-1 text-sm text-custom-text-200 w-72">
              {val && val.length > 0
                ? `${val.length} ${t("clickup_importer.selected")}`
                : `${t("clickup_importer.select_service_folder", { serviceName: "ClickUp" })}`}
              <ChevronDown size={16} className={cn(isOpen ? "rotate-180 ml-auto" : "rotate-0 ml-auto")} />
            </span>
          )}
          disableSearch
        />
      )}
    </div>
  );
});
