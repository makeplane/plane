"use client";

import { observer } from "mobx-react";
import { Inbox } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs, Header } from "@plane/ui";
// components
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SidebarHamburgerToggle } from "@/components/core/sidebar/sidebar-menu-hamburger-toggle";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
// local imports
import { NotificationSidebarHeaderOptions } from "./options";

type TNotificationSidebarHeader = {
  workspaceSlug: string;
};

export const NotificationSidebarHeader: React.FC<TNotificationSidebarHeader> = observer((props) => {
  const { workspaceSlug } = props;
  const { t } = useTranslation();
  const { sidebarCollapsed } = useAppTheme();

  if (!workspaceSlug) return <></>;
  return (
    <Header className="my-auto bg-custom-background-100">
      <Header.LeftItem>
        {sidebarCollapsed && <SidebarHamburgerToggle />}

        <Breadcrumbs>
          <Breadcrumbs.Item
            component={
              <BreadcrumbLink
                label={t("notification.label")}
                icon={<Inbox className="h-4 w-4 text-custom-text-300" />}
                disableTooltip
              />
            }
          />
        </Breadcrumbs>
      </Header.LeftItem>
      <Header.RightItem>
        <NotificationSidebarHeaderOptions workspaceSlug={workspaceSlug} />
      </Header.RightItem>
    </Header>
  );
});
