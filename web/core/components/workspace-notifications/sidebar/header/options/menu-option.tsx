"use client";

import { FC, Fragment } from "react";
import { observer } from "mobx-react";
import { Check, CheckCheck, CheckCircle, Clock, MoreVertical } from "lucide-react";
import { Popover, Transition } from "@headlessui/react";
import { TNotificationFilter } from "@plane/types";
import { ArchiveIcon, Spinner, Tooltip } from "@plane/ui";
// constants
import { NOTIFICATIONS_READ } from "@/constants/event-tracker";
import { ENotificationLoader } from "@/constants/notification";
import { cn } from "@/helpers/common.helper";
// hooks
import { useEventTracker, useWorkspaceNotifications } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

type TNotificationHeaderMenuOption = {
  workspaceSlug: string;
};

export const NotificationHeaderMenuOption: FC<TNotificationHeaderMenuOption> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const { captureEvent } = useEventTracker();
  const { isMobile } = usePlatformOS();
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

  return (
    <Popover className="relative">
      <Tooltip tooltipContent="Notification Filters" isMobile={isMobile} position="bottom">
        <Popover.Button
          className={cn(
            "flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm outline-none",
            ({ open }: { open: boolean }) => (open ? "bg-custom-background-80" : "")
          )}
        >
          <MoreVertical className="h-3 w-3" />
        </Popover.Button>
      </Tooltip>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute mt-2 right-0 z-10 min-w-44 select-none">
          <div className="py-2 rounded-md border border-custom-border-200 bg-custom-background-100 space-y-1">
            <div className="px-2">
              <div
                className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                onClick={() => {
                  handleMarkAllNotificationsAsRead();
                  captureEvent(NOTIFICATIONS_READ);
                }}
              >
                <CheckCheck className="h-3 w-3" />
                <div>Mark all as read</div>
                {loader === ENotificationLoader.MARK_ALL_AS_READY && (
                  <div className="ml-auto">
                    <Spinner height="14px" width="14px" />
                  </div>
                )}
              </div>
            </div>

            <div className="border-b border-custom-border-200 " />

            <div className="px-2">
              <div
                className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                onClick={() => handleFilterChange("read", !filters?.read)}
              >
                <CheckCircle className="flex-shrink-0 h-3 w-3" />
                <div
                  className={cn("whitespace-nowrap", filters?.read ? "text-custom-text-100" : "text-custom-text-200")}
                >
                  Show unread
                </div>
                {filters?.read && (
                  <div className="ml-auto">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                onClick={() =>
                  handleBulkFilterChange({
                    archived: !filters?.archived,
                    snoozed: false,
                  })
                }
              >
                <ArchiveIcon className="flex-shrink-0 h-3 w-3" />
                <div
                  className={cn(
                    "whitespace-nowrap",
                    filters?.archived ? "text-custom-text-100" : "text-custom-text-200"
                  )}
                >
                  Show Archived
                </div>
                {filters?.archived && (
                  <div className="ml-auto">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>

              <div
                className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
                onClick={() =>
                  handleBulkFilterChange({
                    snoozed: !filters?.snoozed,
                    archived: false,
                  })
                }
              >
                <Clock className="flex-shrink-0 h-3 w-3" />
                <div
                  className={cn(
                    "whitespace-nowrap",
                    filters?.snoozed ? "text-custom-text-100" : "text-custom-text-200"
                  )}
                >
                  Show Snoozed
                </div>
                {filters?.snoozed && (
                  <div className="ml-auto">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  );
});
