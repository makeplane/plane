"use client";

import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import { Check, CheckCheck, CheckCircle, Clock } from "lucide-react";
import { TNotificationFilter } from "@plane/types";
import { ArchiveIcon, PopoverMenu, Spinner } from "@plane/ui";
// components
import { NotificationMenuOptionItem } from "@/components/workspace-notifications";
// constants
import { NOTIFICATIONS_READ } from "@/constants/event-tracker";
import { ENotificationLoader } from "@/constants/notification";
// hooks
import { useEventTracker, useWorkspaceNotifications } from "@/hooks/store";

type TNotificationHeaderMenuOption = {
  workspaceSlug: string;
};

export type TPopoverMenuOptions = {
  key: string;
  type: string;
  label?: string | undefined;
  isActive?: boolean | undefined;
  prependIcon?: ReactNode | undefined;
  appendIcon?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
};

export const NotificationHeaderMenuOption: FC<TNotificationHeaderMenuOption> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { captureEvent } = useEventTracker();
  const { loader, filters, updateFilters, updateBulkFilters, markAllNotificationsAsRead } = useWorkspaceNotifications();

  const handleFilterChange = (filterType: keyof TNotificationFilter, filterValue: boolean) =>
    updateFilters(filterType, filterValue);

  const handleBulkFilterChange = (filter: Partial<TNotificationFilter>) => updateBulkFilters(filter);

  const handleMarkAllNotificationsAsRead = async () => {
    // NOTE: We are using loader to prevent continues request when we are making all the notification to read
    if (loader) return;
    try {
      await markAllNotificationsAsRead(workspaceSlug);
    } catch (error) {
      console.error(error);
    }
  };

  const popoverMenuOptions: TPopoverMenuOptions[] = [
    {
      key: "menu-mark-all-read",
      type: "menu-item",
      label: "Mark all as read",
      isActive: true,
      prependIcon: <CheckCheck className="h-3 w-3" />,
      appendIcon: loader === ENotificationLoader.MARK_ALL_AS_READY ? <Spinner height="14px" width="14px" /> : undefined,
      onClick: () => {
        captureEvent(NOTIFICATIONS_READ);
        handleMarkAllNotificationsAsRead();
      },
    },
    {
      key: "menu-divider",
      type: "divider",
    },
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
      buttonClassName="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm outline-none"
      keyExtractor={(item: TPopoverMenuOptions) => item.key}
      panelClassName="p-0 py-2 rounded-md border border-custom-border-200 bg-custom-background-100 space-y-1"
      render={(item: TPopoverMenuOptions) => <NotificationMenuOptionItem {...item} />}
    />
  );
});
