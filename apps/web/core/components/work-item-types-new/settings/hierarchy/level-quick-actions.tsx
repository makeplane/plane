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

import { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TrashIcon } from "@plane/propel/icons";
import type { BaseWorkItemTypeInstanceSchema } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
import { CustomMenu } from "@plane/ui";
import { cn } from "@plane/utils";

type Props = {
  level: number;
  workItemTypes: BaseWorkItemTypeInstanceSchema[];
};

export const WorkItemTypeHierarchyLevelQuickActions = observer(function WorkItemTypeHierarchyLevelQuickActions({
  workItemTypes,
}: Props) {
  // translation
  const { t } = useTranslation();
  // callbacks
  const handleRemove = useCallback(() => {
    const workItemTypeToRemoveFromLevel = workItemTypes[0];
    if (!workItemTypeToRemoveFromLevel) return;
    workItemTypeToRemoveFromLevel.updateType({ level: 0 });
  }, [workItemTypes]);
  // derived values
  const MENU_ITEMS: TContextMenuItem[] = useMemo(() => {
    return [
      {
        key: "remove",
        title: t("common.remove"),
        icon: TrashIcon,
        action: handleRemove,
        shouldRender: workItemTypes.length === 1 && workItemTypes[0].canEdit,
      },
    ];
  }, [handleRemove, t, workItemTypes]);

  return (
    <CustomMenu className="shrink-0" ellipsis placement="bottom-end">
      {MENU_ITEMS.map((item) => {
        if (item.shouldRender === false) return null;

        return (
          <CustomMenu.MenuItem
            key={item.key}
            onClick={item.action}
            className={cn("flex items-center gap-2", {
              "text-danger-secondary": item.key === "remove",
            })}
          >
            {item.icon && <item.icon className="shrink-0 size-3" />}
            {item.title}
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
});
