"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Check, ListFilter } from "lucide-react";
import { PopoverMenu, Tooltip } from "@plane/ui";
// constants
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@/constants/notification";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useWorkspaceNotifications } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";

export const NotificationFilter: FC = observer(() => {
  // hooks
  const { isMobile } = usePlatformOS();
  const { filters, updateFilters } = useWorkspaceNotifications();

  const handleFilterTypeChange = (filterType: ENotificationFilterType, filterValue: boolean) =>
    updateFilters("type", {
      ...filters.type,
      [filterType]: filterValue,
    });

  return (
    <PopoverMenu
      data={FILTER_TYPE_OPTIONS}
      button={
        <Tooltip tooltipContent="Notification Filters" isMobile={isMobile} position="bottom">
          <div className="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm outline-none">
            <ListFilter className="h-3 w-3" />
          </div>
        </Tooltip>
      }
      keyExtractor={(item: { label: string; value: ENotificationFilterType }) => item.value}
      render={(item) => {
        const isSelected = filters?.type?.[item?.value] || false;
        return (
          <div
            key={item.value}
            className="flex items-center gap-2 cursor-pointer px-2 p-1 transition-all hover:bg-custom-background-80 rounded-sm"
            onClick={() => handleFilterTypeChange(item?.value, !isSelected)}
          >
            <div
              className={cn(
                "flex-shrink-0 w-3 h-3 flex justify-center items-center rounded-sm transition-all",
                isSelected ? "bg-custom-primary-100" : "bg-custom-background-90"
              )}
            >
              {isSelected && <Check className="h-2 w-2" />}
            </div>
            <div
              className={cn("whitespace-nowrap text-sm", isSelected ? "text-custom-text-100" : "text-custom-text-200")}
            >
              {item.label}
            </div>
          </div>
        );
      }}
    />
  );
});
