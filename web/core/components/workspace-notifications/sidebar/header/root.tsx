"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Bell } from "lucide-react";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { SidebarHamburgerToggle } from "@/components/core";
import { NotificationSidebarHeaderOptions } from "@/components/workspace-notifications";
// helpers
import { getNumberCount } from "@/helpers/string.helper";

type TNotificationSidebarHeader = {
  workspaceSlug: string;
  notificationsCount: number;
};

export const NotificationSidebarHeader: FC<TNotificationSidebarHeader> = observer((props) => {
  const { workspaceSlug, notificationsCount } = props;

  if (!workspaceSlug) return <></>;
  return (
    <div className="relative z-10 flex h-[3.75rem] w-full flex-shrink-0 flex-row items-center justify-between gap-x-2 gap-y-4 bg-custom-sidebar-background-100 p-4">
      <div className="flex w-full flex-grow items-center gap-2 overflow-ellipsis whitespace-nowrap">
        <div className="block bg-custom-sidebar-background-100 md:hidden">
          <SidebarHamburgerToggle />
        </div>
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink
                label={
                  <div className="flex items-center gap-2">
                    <div className="font-medium">Notifications</div>
                    <div className="rounded-full text-xs px-1.5 py-0.5 bg-custom-primary-100 text-white">
                      {getNumberCount(notificationsCount)}
                    </div>
                  </div>
                }
                icon={<Bell className="h-4 w-4 text-custom-text-300" />}
                disableTooltip
              />
            }
          />
        </Breadcrumbs>
      </div>

      <NotificationSidebarHeaderOptions workspaceSlug={workspaceSlug} />
    </div>
  );
});
