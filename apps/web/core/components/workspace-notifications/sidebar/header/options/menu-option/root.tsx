/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { ReactNode } from "react";
import { observer } from "mobx-react";
import {
  ArchiveOutline,
  ClockOutline,
  MoreVerticalOutline,
  TickCircleOutline,
  TickOutline,
} from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
// plane imports
import type { TNotificationFilter } from "@plane/types";
import { PopoverMenu } from "@plane/blocks/popovers";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store/notifications";
// local imports
import { NotificationMenuOptionItem } from "./menu-item";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { Icon } from "@makeplane/propel/components/icon";

export type TPopoverMenuOptions = {
  key: string;
  type: string;
  label?: string | undefined;
  isActive?: boolean | undefined;
  prependIcon?: ReactNode | undefined;
  appendIcon?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
};

export const NotificationHeaderMenuOption = observer(function NotificationHeaderMenuOption() {
  // hooks
  const { filters, updateFilters, updateBulkFilters } = useWorkspaceNotifications();
  const { t } = useTranslation();

  const handleFilterChange = (filterType: keyof TNotificationFilter, filterValue: boolean) =>
    updateFilters(filterType, filterValue);

  const handleBulkFilterChange = (filter: Partial<TNotificationFilter>) => updateBulkFilters(filter);

  const popoverMenuOptions: TPopoverMenuOptions[] = [
    {
      key: "menu-unread",
      type: "menu-item",
      label: t("notification.options.show_unread"),
      isActive: filters?.read,
      prependIcon: <TickCircleOutline className="h-3 w-3 flex-shrink-0" />,
      appendIcon: filters?.read ? <TickOutline className="h-3 w-3" /> : undefined,
      onClick: () => handleFilterChange("read", !filters?.read),
    },
    {
      key: "menu-archived",
      type: "menu-item",
      label: t("notification.options.show_archived"),
      isActive: filters?.archived,
      prependIcon: <ArchiveOutline className="h-3 w-3 flex-shrink-0" />,
      appendIcon: filters?.archived ? <TickOutline className="h-3 w-3" /> : undefined,
      onClick: () =>
        handleBulkFilterChange({
          archived: !filters?.archived,
          snoozed: false,
        }),
    },
    {
      key: "menu-snoozed",
      type: "menu-item",
      label: t("notification.options.show_snoozed"),
      isActive: filters?.snoozed,
      prependIcon: <ClockOutline className="h-3 w-3 flex-shrink-0" />,
      appendIcon: filters?.snoozed ? <TickOutline className="h-3 w-3" /> : undefined,
      onClick: () =>
        handleBulkFilterChange({
          snoozed: !filters?.snoozed,
          archived: false,
        }),
    },
  ];

  return (
    <PopoverMenu
      data={popoverMenuOptions}
      button={
        <IconButton
          size="sm"
          variant="ghost"
          icon={<Icon icon={MoreVerticalOutline} />}
          aria-label="Notification options"
        />
      }
      keyExtractor={(item: TPopoverMenuOptions) => item.key}
      panelClassName="p-0 py-2 rounded-md border border-subtle bg-surface-1 space-y-1"
      render={(item: TPopoverMenuOptions) => <NotificationMenuOptionItem {...item} />}
    />
  );
});
