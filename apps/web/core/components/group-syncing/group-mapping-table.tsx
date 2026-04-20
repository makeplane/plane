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

import { useMemo } from "react";
import { observer } from "mobx-react";
import { Table } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { Logo } from "@plane/propel/emoji-icon-picker";
import { useProject } from "@/hooks/store/use-project";
import type { GroupMap } from "@plane/types";
import { GroupMappingRowMenu } from "./menu-options";

type GroupMappingTableRootProps = {
  data: GroupMap[];
  disabled?: boolean;
  onUpdate: (row: GroupMap) => void;
  onDelete: (row: GroupMap) => void;
};

export const GroupMappingTableRoot = observer(function GroupMappingTableRoot({
  data,
  disabled = false,
  onUpdate,
  onDelete,
}: GroupMappingTableRootProps) {
  const { t } = useTranslation();
  const { getProjectById } = useProject();

  const tableColumns = useMemo(
    () => [
      {
        key: "user_group",
        content: t("workspace_settings.settings.group_syncing.modal.idp_group_name.text"),
        tdRender: (rowData: GroupMap) => (
          <div className="relative group flex items-center gap-x-4 gap-y-2 w-full">
            <div className="">
              <span className="truncate">{rowData?.idp_group_name}</span>
            </div>
            {!disabled && <GroupMappingRowMenu rowData={rowData} onUpdate={onUpdate} onDelete={onDelete} />}
          </div>
        ),
      },
      {
        key: "project",
        content: t("workspace_settings.settings.group_syncing.modal.project.text"),
        tdRender: (rowData: GroupMap) => {
          const project = rowData.project == null ? undefined : getProjectById(rowData.project);
          return (
            <div className="flex items-center gap-2 w-full">
              <span className="grid place-items-center shrink-0 h-4 w-4">
                <Logo logo={project?.logo_props} size={12} />
              </span>
              <p className="grow truncate flex items-center justify-between gap-3">
                <span>{project?.name}</span>
              </p>
            </div>
          );
        },
      },
      {
        key: "project_role",
        content: t("workspace_settings.settings.group_syncing.modal.default_role.text"),
        tdRender: (rowData: GroupMap) => <div className="truncate w-full">{rowData.role_detail?.name ?? "—"}</div>,
      },
    ],
    [t, getProjectById, disabled, onUpdate, onDelete]
  );

  return (
    <div className="overflow-x-auto">
      <Table
        columns={tableColumns}
        data={data}
        keyExtractor={(rowData: GroupMap) => rowData.id ?? ""}
        tHeadClassName="border-b border-subtle"
        thClassName="text-left font-medium divide-x-0 text-placeholder"
        tBodyClassName="divide-y-0"
        tBodyTrClassName="divide-x-0 p-2 h-[40px] text-secondary"
        tHeadTrClassName="divide-x-0"
      />
    </div>
  );
});
