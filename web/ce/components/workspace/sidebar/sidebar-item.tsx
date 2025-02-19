"use client";
import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { usePlatformOS } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";
import { NotificationAppSidebarOption } from "@/components/workspace-notifications";
// hooks
import { useAppTheme, useUser, useUserPermissions, useWorkspace } from "@/hooks/store";
// local imports
import { getSidebarNavigationItemIcon } from "./helper";

type TSidebarItemProps = {
  item: IWorkspaceSidebarNavigationItem;
};

export const SidebarItem: FC<TSidebarItemProps> = observer((props) => {
  const { item } = props;
  const { t } = useTranslation();
  // nextjs hooks
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { getNavigationPreferences } = useWorkspace();
  const { data } = useUser();

  // store hooks
  const { toggleSidebar, sidebarCollapsed, extendedSidebarCollapsed, toggleExtendedSidebar } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    if (extendedSidebarCollapsed) toggleExtendedSidebar();
  };

  const staticItems = ["home", "inbox", "pi-chat", "projects"];

  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) {
    return null;
  }

  const itemHref =
    item.key === "your_work"
      ? `/${workspaceSlug.toString()}${item.href}/${data?.id}`
      : `/${workspaceSlug.toString()}${item.href}`;

  const isActive = itemHref === pathname;

  const sidebarPreference = getNavigationPreferences(workspaceSlug.toString());
  const isPinned = sidebarPreference?.[item.key]?.is_pinned;
  if (!isPinned && !staticItems.includes(item.key)) return null;

  const icon = getSidebarNavigationItemIcon(item.key);

  return (
    <Tooltip
      tooltipContent={t(item.labelTranslationKey)}
      position="right"
      className="ml-2"
      disabled={!sidebarCollapsed}
      isMobile={isMobile}
    >
      <Link href={itemHref} onClick={() => handleLinkClick()}>
        <SidebarNavItem
          className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
          isActive={isActive}
        >
          <div className="flex items-center gap-1.5 py-[1px]">
            {icon}
            {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{t(item.labelTranslationKey)}</p>}
          </div>
          {item.key === "inbox" && (
            <NotificationAppSidebarOption
              workspaceSlug={workspaceSlug?.toString()}
              isSidebarCollapsed={sidebarCollapsed ?? false}
            />
          )}
        </SidebarNavItem>
      </Link>
    </Tooltip>
  );
});
