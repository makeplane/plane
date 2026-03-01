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
import { EditIcon, TrashIcon } from "@plane/propel/icons";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TOperationMode } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

type TIssuePropertyQuickActions = {
  isPropertyDisabled: boolean;
  onDisable: () => Promise<void>;
  onDelete: () => Promise<void>;
  onIssuePropertyOperationMode: (mode: TOperationMode) => void;
};

export const IssuePropertyQuickActions = observer(function IssuePropertyQuickActions(
  props: TIssuePropertyQuickActions
) {
  const { isPropertyDisabled, onDisable, onDelete, onIssuePropertyOperationMode } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      action: () => {
        onIssuePropertyOperationMode("update");
      },
      title: t("common.actions.edit"),
      icon: EditIcon,
    },
    {
      key: "delete",
      action: () => {
        setIsDeleteModalOpen(true);
      },
      title: t("common.actions.delete"),
      icon: TrashIcon,
    },
  ];

  return (
    <>
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDisabledAlready={isPropertyDisabled}
        onClose={() => setIsDeleteModalOpen(false)}
        onDisable={onDisable}
        onDelete={onDelete}
      />
      <CustomMenu placement="bottom-end" menuItemsClassName="z-20" buttonClassName="p-0.5" closeOnSelect ellipsis>
        {MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={() => {
              item.action();
            }}
            className={cn("flex items-center gap-2")}
          >
            {item.icon && <item.icon className={cn("h-3 w-3")} />}
            <div className="text-caption-xs-regular">{item.title}</div>
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
