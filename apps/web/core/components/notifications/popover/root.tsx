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

import { useWorkspaceNotifications } from "@/hooks/store/notifications";

import { InboxIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { AppSidebarItem } from "@/components/sidebar/sidebar-item";
import { NotificationsSidebarRoot } from "@/components/workspace-notifications/sidebar";
import { Popover } from "@plane/propel/popover";

type NotificationsPopoverRootProps = {
  workspaceSlug: string;
};

export function NotificationsPopoverRoot({ workspaceSlug }: NotificationsPopoverRootProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { unreadNotificationsCount, viewMode } = useWorkspaceNotifications();

  const isMentionsEnabled = unreadNotificationsCount.mention_unread_notifications_count > 0;
  const totalNotifications = isMentionsEnabled
    ? unreadNotificationsCount.mention_unread_notifications_count
    : unreadNotificationsCount.total_unread_notifications_count;
  const isNotificationsPath = pathname.includes(`/${workspaceSlug}/notifications/`);
  const shouldPopoverBeOpen = viewMode === "compact" && !isNotificationsPath && isOpen;

  const handleSidebarClick = () => {
    if (viewMode === "full") {
      setIsOpen(false);
      router.push(`/${workspaceSlug}/notifications/`);
    }
  };

  const handlePopoverChange = (open: boolean) => {
    if (!isNotificationsPath) {
      setIsOpen(open);
    } else {
      setIsOpen(false);
    }
  };

  return (
    <Popover open={shouldPopoverBeOpen} onOpenChange={handlePopoverChange}>
      <Popover.Button>
        <AppSidebarItem
          variant={"button"}
          item={{
            icon: (
              <div className="relative">
                <InboxIcon className="size-5" />
                {totalNotifications > 0 && (
                  <span className="absolute top-0 right-0 size-2 rounded-full bg-danger-primary" />
                )}
              </div>
            ),
            isActive: isOpen,
            onClick: handleSidebarClick,
          }}
        />
      </Popover.Button>
      <Popover.Panel side="bottom" align="start" positionerClassName={"z-30"} className={"h-[477px] w-[530px]"}>
        <NotificationsSidebarRoot
          viewMode="compact"
          onFullViewMode={() => setIsOpen(false)}
          onNotificationClick={() => setIsOpen(false)}
          onModeChange={(mode) => {
            if (mode === "full" && isOpen) {
              setIsOpen(false);
            }
          }}
        />
      </Popover.Panel>
    </Popover>
  );
}
