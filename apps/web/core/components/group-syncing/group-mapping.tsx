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

import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { GroupMap } from "@plane/types";
import { Button } from "@plane/ui";
import { PlusIcon } from "@plane/propel/icons";
import { EmptyStateCompact } from "@plane/propel/empty-state";
// components
import { SettingsHeading } from "@/components/settings/heading";
// hooks
import { useGroupSync } from "@/hooks/store/use-group-sync";

import { NewGroupSyncModal } from "./new-group-sync-modal";
import { GroupMappingTableRoot } from "./group-mapping-table";
import { DeleteGroupMappingModal } from "./delete-group-mapping-modal";
import { GroupMappingTableLoader } from "./loader";

type GroupMappingProps = { disabled: boolean; workspaceSlug: string };

export const GroupMapping = observer(function GroupMapping({ disabled, workspaceSlug }: GroupMappingProps) {
  const { t } = useTranslation();

  const {
    getLoader,
    getMappingsByWorkspaceSlug,
    createGroupMappingByWorkspaceSlug,
    updateGroupMappingByWorkspaceSlug,
    deleteGroupMappingByWorkspaceSlug,
  } = useGroupSync();

  const mappings = getMappingsByWorkspaceSlug(workspaceSlug);
  const loader = getLoader();

  // states
  const [groupSyncModalOpen, setGroupSyncModalOpen] = useState(false);
  const [preloadedData, setPreloadedData] = useState<GroupMap | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GroupMap | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleCreate = async (payload: Partial<GroupMap>) => {
    await createGroupMappingByWorkspaceSlug(workspaceSlug, payload);
  };

  const handleUpdate = async (mappingId: string, payload: Partial<GroupMap>) => {
    await updateGroupMappingByWorkspaceSlug(workspaceSlug, mappingId, payload);
    setPreloadedData(null);
  };

  const handleRowUpdate = (row: GroupMap) => {
    setPreloadedData(row);
    setGroupSyncModalOpen(true);
  };

  const handleRowDelete = (row: GroupMap) => {
    setDeleteTarget(row);
    setDeleteModalOpen(true);
  };

  return (
    <div className="mt-12">
      <NewGroupSyncModal
        isModalOpen={groupSyncModalOpen}
        handleOnClose={() => {
          setGroupSyncModalOpen(false);
          setPreloadedData(null);
        }}
        workspaceSlug={workspaceSlug}
        preloadedData={preloadedData ?? undefined}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />
      <DeleteGroupMappingModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        data={deleteTarget}
        onDelete={deleteGroupMappingByWorkspaceSlug}
        workspaceSlug={workspaceSlug}
      />
      <SettingsHeading
        title={t("workspace_settings.settings.group_syncing.group_mapping.title")}
        variant="h6"
        description={t("workspace_settings.settings.group_syncing.group_mapping.description")}
        control={
          <Button
            variant="neutral-primary"
            size="sm"
            onClick={() => {
              setPreloadedData(null);
              setGroupSyncModalOpen(true);
            }}
            disabled={disabled}
            prependIcon={<PlusIcon className="size-4" />}
          >
            {t("workspace_settings.settings.group_syncing.group_mapping.button_text")}
          </Button>
        }
      />

      <div className="mt-4 flex flex-col">
        {loader === "init-loader" || mappings === undefined ? (
          <GroupMappingTableLoader />
        ) : mappings && mappings.length > 0 ? (
          <GroupMappingTableRoot
            data={mappings}
            disabled={disabled}
            onUpdate={handleRowUpdate}
            onDelete={handleRowDelete}
          />
        ) : (
          <EmptyStateCompact
            assetKey="group-syncing"
            title={t("settings_empty_state.group_syncing.title")}
            align="center"
            rootClassName="py-20"
          />
        )}
      </div>
    </div>
  );
});
