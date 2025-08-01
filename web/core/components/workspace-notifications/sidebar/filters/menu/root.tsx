"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
import { PopoverMenu, Tooltip } from "@plane/ui";
// components
import { NotificationFilterOptionItem } from "@/components/workspace-notifications";
// constants
import { ENotificationFilterType, FILTER_TYPE_OPTIONS } from "@/constants/notification";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

export const NotificationFilter: FC = observer(() => {
  // hooks
  const { isMobile } = usePlatformOS();

  return (
    <PopoverMenu
      data={FILTER_TYPE_OPTIONS}
      button={
        <Tooltip tooltipContent="Inbox Filters" isMobile={isMobile} position="bottom">
          <div className="flex-shrink-0 w-5 h-5 flex justify-center items-center overflow-hidden cursor-pointer transition-all hover:bg-custom-background-80 rounded-sm outline-none">
            <ListFilter className="h-3 w-3" />
          </div>
        </Tooltip>
      }
      keyExtractor={(item: { label: string; value: ENotificationFilterType }) => item.value}
      render={(item) => <NotificationFilterOptionItem {...item} />}
    />
  );
});
