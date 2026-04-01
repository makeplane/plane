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

import { useMemo, useState } from "react";
import { PencilIcon } from "lucide-react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
// local imports
import { AddWorkItemTypeHierarchyLevelModal } from "./add-level-modal";

type Props = {
  level: number;
  workItemTypes: BaseWorkItemTypeInstanceSchema[];
};

export const WorkItemTypeHierarchyLevelQuickActions = observer(function WorkItemTypeHierarchyLevelQuickActions({
  level,
  workItemTypes,
}: Props) {
  // states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // translation
  const { t } = useTranslation();
  // derived values
  const MENU_ITEMS: TContextMenuItem[] = useMemo(() => {
    const allItems = [
      {
        key: "edit",
        title: t("common.edit"),
        icon: PencilIcon,
        action: () => setIsEditModalOpen(true),
        shouldRender: true,
      },
    ];
    const filteredMenuItems = allItems.filter((item) => item.shouldRender !== false);
    return filteredMenuItems;
  }, [t]);

  if (MENU_ITEMS.length === 0) return null;

  return (
    <>
      <AddWorkItemTypeHierarchyLevelModal
        handleClose={() => setIsEditModalOpen(false)}
        isOpen={isEditModalOpen}
        level={level}
        selectedWorkItemTypeIds={workItemTypes.map((t) => t.id)}
      />
      <CustomMenu className="shrink-0" ellipsis placement="bottom-end" closeOnSelect>
        {MENU_ITEMS.map((item) => (
          <CustomMenu.MenuItem key={item.key} onClick={item.action} className="flex items-center gap-2">
            {item.icon && <item.icon className="shrink-0 size-3" />}
            {item.title}
          </CustomMenu.MenuItem>
        ))}
      </CustomMenu>
    </>
  );
});
