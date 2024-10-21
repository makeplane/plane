"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { Check, CheckCircle, Clock } from "lucide-react";
import { TNotificationFilter } from "@plane/types";
import { ArchiveIcon, PopoverMenu } from "@plane/ui";
// components
import { NotificationMenuOptionItem } from "@/components/workspace-notifications";
// constants
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";

export type TPopoverMenuOptions = {
  key: string;
  type: string;
  label?: string | undefined;
  isActive?: boolean | undefined;
  prependIcon?: ReactNode | undefined;
  appendIcon?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
};

export const NotificationHeaderMenuOption = observer(() => {
  // hooks
  const { filters, updateFilters, updateBulkFilters } = useWorkspaceNotifications();

  const handleFilterChange = (filterType: keyof TNotificationFilter, filterValue: boolean) =>
    updateFilters(filterType, filterValue);

  const handleBulkFilterChange = (filter: Partial<TNotificationFilter>) => updateBulkFilters(filter);

  const popoverMenuOptions: TPopoverMenuOptions[] = [
    {
      key: "menu-unread",
      type: "menu-item",
      label: "Show unread",
      isActive: filters?.read,
      prependIcon: <CheckCircle className="flex-shrink-0 h-3 w-3" />,
      appendIcon: filters?.read ? <Check className="w-3 h-3" /> : undefined,
      onClick: () => handleFilterChange("read", !filters?.read),
    },
    {
      key: "menu-archived",
      type: "menu-item",
      label: "Show archived",
      isActive: filters?.archived,
      prependIcon: <ArchiveIcon className="flex-shrink-0 h-3 w-3" />,
      appendIcon: filters?.archived ? <Check className="w-3 h-3" /> : undefined,
      onClick: () =>
        handleBulkFilterChange({
          archived: !filters?.archived,
          snoozed: false,
        }),
    },
    {
      key: "menu-snoozed",
      type: "menu-item",
      label: "Show snoozed",
      isActive: filters?.snoozed,
      prependIcon: <Clock className="flex-shrink-0 h-3 w-3" />,
      appendIcon: filters?.snoozed ? <Check className="w-3 h-3" /> : undefined,
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
      buttonClassName="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 bg-custom-background-100 rounded-sm outline-none"
      keyExtractor={(item: TPopoverMenuOptions) => item.key}
      panelClassName="p-0 py-2 rounded-md border border-custom-border-200 bg-custom-background-100 space-y-1"
      render={(item: TPopoverMenuOptions) => <NotificationMenuOptionItem {...item} />}
    />
  );
});
