"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { Inbox } from "lucide-react";
import { Breadcrumbs } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common";
import { HeaderContainer } from "@/components/containers";
import { SidebarHamburgerToggle } from "@/components/core";
import { NotificationSidebarHeaderOptions } from "@/components/workspace-notifications";

type TNotificationSidebarHeader = {
  workspaceSlug: string;
};

export const NotificationSidebarHeader: FC<TNotificationSidebarHeader> = observer((props) => {
  const { workspaceSlug } = props;

  if (!workspaceSlug) return <></>;
  return (
    <HeaderContainer>
      <HeaderContainer.LeftItem>
        <div className="block bg-custom-sidebar-background-100 md:hidden">
          <SidebarHamburgerToggle />
        </div>
        <Breadcrumbs>
          <Breadcrumbs.BreadcrumbItem
            type="text"
            link={
              <BreadcrumbLink label="Inbox" icon={<Inbox className="h-4 w-4 text-custom-text-300" />} disableTooltip />
            }
          />
        </Breadcrumbs>
      </HeaderContainer.LeftItem>
      <HeaderContainer.RightItem>
        <NotificationSidebarHeaderOptions workspaceSlug={workspaceSlug} />
      </HeaderContainer.RightItem>
    </HeaderContainer>
  );
});
