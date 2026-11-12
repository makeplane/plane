/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { PreferencesOutline } from "@makeplane/propel/icons";
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
      checked: !!filters?.read,
      onChange: () => handleFilterChange("read", !filters?.read),
    },
    {
      key: "menu-archived",
      label: t("notification.options.show_archived"),
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
      checked: !!filters?.snoozed,
      onChange: () =>
        handleBulkFilterChange({
          snoozed: !filters?.snoozed,
          archived: false,
        }),
    },
  ];

  const activeOptionsCount = menuOptions.filter((option) => option.checked).length;

  return (
    // Toggle rows: checkbox items keep the menu open, as the legacy popover did.
    <Menu>
      <div className="relative inline-flex">
        <MenuTrigger
          render={
            <IconButton
              size="sm"
              variant="secondary"
              icon={<Icon icon={PreferencesOutline} />}
              aria-label={t("common.display")}
            />
          }
        />
        {activeOptionsCount > 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-accent-primary text-[10px] font-medium text-on-color"
          >
            {activeOptionsCount}
          </span>
        )}
      </div>
      <MenuContent side="bottom" align="end">
        {menuOptions.map((option) => (
          <MenuCheckboxItem
            key={option.key}
            label={option.label}
            checked={option.checked}
            onCheckedChange={option.onChange}
          />
        ))}
      </MenuContent>
    </Menu>
  );
});
