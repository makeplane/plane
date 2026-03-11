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

import { useTranslation } from "@plane/i18n";
import { EditIcon, HistoryIcon, TrashIcon } from "@plane/propel/icons";
import { Badge } from "@plane/propel/badge";
import { Menu } from "@plane/propel/menu";
import { Switch } from "@plane/propel/switch";
import type { TContextMenuItem } from "@plane/ui";
import { cn } from "@plane/utils";
import { observer } from "mobx-react";

type Props = {
  handleEdit: () => void;
  handleViewChangeHistory: () => void;
  isEnabled: boolean;
  onToggle: (isEnabled: boolean) => void;
  handleDelete: () => void;
  isDefault: boolean;
};

export const WorkflowActions = observer(function WorkflowActions(props: Props) {
  // props
  const { handleEdit, handleViewChangeHistory, isEnabled, onToggle, handleDelete, isDefault } = props;
  // hooks
  const { t } = useTranslation();

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: EditIcon,
      action: handleEdit,
    },
    {
      key: "view-history",
      title: "View change history",
      icon: HistoryIcon,
      action: handleViewChangeHistory,
    },
    {
      key: "delete",
      title: "Delete",
      icon: TrashIcon,
      className: "text-danger-primary",
      action: handleDelete,
      shouldRender: !isDefault,
    },
  ];
  return (
    <div className="flex items-center gap-3 cursor-default" onClick={(e) => e.stopPropagation()}>
      {isDefault && <Badge variant="brand">{t("common.default")}</Badge>}
      {isEnabled && <Badge variant="success">{t("common.active")}</Badge>}
      <Switch value={isEnabled} onChange={onToggle} />
      <Menu ellipsis closeOnSelect>
        {MENU_ITEMS.map((item) => {
          if (item.shouldRender === false) return null;
          return (
            <Menu.MenuItem
              key={item.key}
              className={cn("flex items-center gap-2", item.className)}
              onClick={item.action}
            >
              <div className="flex items-center gap-2">
                {item.icon && <item.icon className="h-3 w-3" />}
                <p className="text-caption-sm-medium">{item.title}</p>
              </div>
            </Menu.MenuItem>
          );
        })}
      </Menu>
    </div>
  );
});
