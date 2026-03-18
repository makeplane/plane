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
import { Tooltip } from "@plane/propel/tooltip";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";
// local imports
import { WorkItemTypeDeleteConfirmationModal } from "./delete-confirmation-modal";

type WorkItemTypeQuickActionsProps = {
  isDefault: boolean;
  isDisabled: boolean;
  onDisable: () => Promise<void>;
  onDelete: () => Promise<void>;
  onEdit: () => void;
  canEdit: boolean;
  canDelete: boolean;
};

export const WorkItemTypeQuickActions = observer(function WorkItemTypeQuickActions(
  props: WorkItemTypeQuickActionsProps
) {
  const { isDefault, isDisabled, onDisable, onDelete, onEdit, canEdit, canDelete } = props;
  // plane hooks
  const { t } = useTranslation();
  // states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const MENU_ITEMS: (TContextMenuItem & { tooltipContent?: string })[] = [
    {
      key: "edit",
      action: () => {
        onEdit();
      },
      title: t("common.actions.edit"),
      icon: EditIcon,
      shouldRender: canEdit,
    },
    {
      key: "delete",
      action: () => {
        setIsDeleteModalOpen(true);
      },
      title: t("common.actions.delete"),
      tooltipContent: isDefault ? t("work_item_types.settings.cant_delete_default_message") : undefined,
      icon: TrashIcon,
      shouldRender: canDelete,
      disabled: isDefault,
    },
  ];

  const filteredMenuItems = MENU_ITEMS.filter((item) => item.shouldRender);

  if (filteredMenuItems.length === 0) return null;

  return (
    <>
      <WorkItemTypeDeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        isDefault={isDefault}
        isDisabledAlready={isDisabled}
        onClose={() => setIsDeleteModalOpen(false)}
        onDisable={onDisable}
        onDelete={onDelete}
      />
      <CustomMenu placement="bottom-end" menuItemsClassName="z-20" buttonClassName="p-0.5" closeOnSelect ellipsis>
        {filteredMenuItems.map((item) => (
          <Tooltip key={item.key} tooltipContent={item.tooltipContent} position="right" disabled={!item.tooltipContent}>
            <span>
              <CustomMenu.MenuItem
                key={item.key}
                onClick={() => {
                  item.action();
                }}
                className={cn("flex items-center gap-2")}
                disabled={item.disabled}
              >
                {item.icon && <item.icon className={cn("h-3 w-3")} />}
                <div className="text-caption-xs-regular">{item.title}</div>
              </CustomMenu.MenuItem>
            </span>
          </Tooltip>
        ))}
      </CustomMenu>
    </>
  );
});
