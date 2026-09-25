/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import { ArchiveOutline, ClockOutline, MoreVerticalOutline, TickCircleOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { TNotificationFilter } from "@plane/types";
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Menu, MenuCheckboxItem, MenuContent, MenuTrigger } from "@makeplane/propel/components/menu";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";

type TNotificationMenuOption = {
  key: string;
  label: string;
  icon: ReactNode;
  checked: boolean;
  onChange: () => void;
};

export const NotificationHeaderMenuOption = observer(function NotificationHeaderMenuOption() {
  // hooks
  const { filters, updateFilters, updateBulkFilters } = useWorkspaceNotifications();
  const { t } = useTranslation();

  const handleFilterChange = (filterType: keyof TNotificationFilter, filterValue: boolean) =>
    updateFilters(filterType, filterValue);

  const handleBulkFilterChange = (filter: Partial<TNotificationFilter>) => updateBulkFilters(filter);

  const menuOptions: TNotificationMenuOption[] = [
    {
      key: "menu-unread",
      label: t("notification.options.show_unread"),
      icon: <Icon icon={TickCircleOutline} />,
      checked: !!filters?.read,
      onChange: () => handleFilterChange("read", !filters?.read),
    },
    {
      key: "menu-archived",
      label: t("notification.options.show_archived"),
      icon: <Icon icon={ArchiveOutline} />,
      checked: !!filters?.archived,
      onChange: () =>
        handleBulkFilterChange({
          archived: !filters?.archived,
          snoozed: false,
        }),
    },
    {
      key: "menu-snoozed",
      label: t("notification.options.show_snoozed"),
      icon: <Icon icon={ClockOutline} />,
      checked: !!filters?.snoozed,
      onChange: () =>
        handleBulkFilterChange({
          snoozed: !filters?.snoozed,
          archived: false,
        }),
    },
  ];

  return (
    // Toggle rows: checkbox items keep the menu open, as the legacy popover did.
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            size="sm"
            variant="ghost"
            icon={<Icon icon={MoreVerticalOutline} />}
            aria-label="Notification options"
          />
        }
      />
      <MenuContent side="bottom" align="end">
        {menuOptions.map((option) => (
          <MenuCheckboxItem
            key={option.key}
            icon={option.icon}
            label={option.label}
            checked={option.checked}
            onCheckedChange={option.onChange}
          />
        ))}
      </MenuContent>
    </Menu>
  );
});
