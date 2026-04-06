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
import { AlertIcon, EditIcon, HistoryIcon, TrashIcon } from "@plane/propel/icons";
import { Badge } from "@plane/propel/badge";
import { Menu } from "@plane/propel/menu";
import { Switch } from "@plane/propel/switch";
import { Tooltip } from "@plane/propel/tooltip";
import type { TContextMenuItem } from "@plane/ui";
import { cn } from "@plane/utils";
import { observer } from "mobx-react";
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  handleEdit: () => void;
  handleViewChangeHistory: () => void;
  isEnabled: boolean;
  isActivationDisabled?: boolean;
  activationTooltipContent?: string;
  onToggle: (isEnabled: boolean) => void;
  handleDelete: () => void;
  isDefault: boolean;
  hasMissingStates: boolean;
};

export const WorkflowActions = observer(function WorkflowActions(props: Props) {
  // props
  const {
    handleEdit,
    handleViewChangeHistory,
    isEnabled,
    isActivationDisabled = false,
    activationTooltipContent,
    onToggle,
    handleDelete,
    isDefault,
    hasMissingStates,
  } = props;
  // hooks
  const { t } = useTranslation();
  const { isMobile } = usePlatformOS();

  const MENU_ITEMS: TContextMenuItem[] = [
    {
      key: "edit",
      title: "Edit",
      icon: EditIcon,
      action: handleEdit,
      shouldRender: !isDefault,
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
    <div
      className="flex items-center gap-3 cursor-default"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      {isDefault && <Badge variant="brand">{t("common.default")}</Badge>}
      {isEnabled && <Badge variant="success">{t("common.active")}</Badge>}
      {hasMissingStates && !isDefault && (
        <Tooltip tooltipContent={t("project_settings.workflows.detail.unmapped_states.tooltip")}>
          <span className="inline-flex">
            <AlertIcon className="size-4 text-warning-secondary" />
          </span>
        </Tooltip>
      )}
      <Tooltip tooltipContent={activationTooltipContent} disabled={!isActivationDisabled} isMobile={isMobile}>
        <span className="inline-flex">
          <Switch value={isEnabled} onChange={onToggle} disabled={isActivationDisabled} />
        </span>
      </Tooltip>
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
