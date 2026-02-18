/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { GroupMap } from "@plane/types";
import { PopoverMenu } from "@plane/ui";
import { EditIcon, TrashIcon } from "@plane/propel/icons";
import { cn } from "@plane/utils";

export type TGroupMappingMenuOption = {
  key: string;
  type: string;
  label: string;
  prependIcon?: ReactNode;
  onClick?: () => void;
  isDanger?: boolean;
};

type GroupMappingMenuItemProps = TGroupMappingMenuOption;

function GroupMappingMenuItem({ label, prependIcon, onClick, isDanger }: GroupMappingMenuItemProps) {
  return (
    <button
      className={cn(
        "flex items-center gap-2 px-2.5 py-2 hover:bg-layer-transparent-hover w-full",
        isDanger ? "text-danger-primary border-t border-subtle" : "text-primary"
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {prependIcon}
      <span>{label}</span>
    </button>
  );
}

export type GroupMappingRowMenuProps = {
  rowData: GroupMap;
  onUpdate: (row: GroupMap) => void;
  onDelete: (row: GroupMap) => void;
};

export const GroupMappingRowMenu = observer(function GroupMappingRowMenu({
  rowData,
  onUpdate,
  onDelete,
}: GroupMappingRowMenuProps) {
  const { t } = useTranslation();

  const popoverMenuOptions: TGroupMappingMenuOption[] = [
    {
      key: "menu-edit",
      type: "menu-item",
      label: t("edit"),
      prependIcon: <EditIcon className="size-3.5 align-middle flex-shrink-0" />,
      onClick: () => onUpdate(rowData),
    },
    {
      key: "menu-delete",
      type: "menu-item",
      label: t("delete"),
      prependIcon: <TrashIcon className="size-3.5 align-middle flex-shrink-0" />,
      onClick: () => onDelete(rowData),
      isDanger: true,
    },
  ];

  return (
    <PopoverMenu
      popperPosition="auto-start"
      data={popoverMenuOptions}
      keyExtractor={(item) => item.key}
      popoverClassName="shrink-0 max-w-8"
      buttonClassName="outline-none origin-center rotate-90 size-8 aspect-square flex-shrink-0 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity"
      panelClassName="p-0"
      render={(item) => <GroupMappingMenuItem {...item} />}
    />
  );
});
