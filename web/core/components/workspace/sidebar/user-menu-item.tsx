import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EUserPermissionsLevel, SIDEBAR_CLICKED, EUserWorkspaceRoles } from "@plane/constants";
import { usePlatformOS } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";
import { NotificationAppSidebarOption } from "@/components/workspace-notifications";
// hooks
import { useAppTheme, useEventTracker, useUserPermissions } from "@/hooks/store";

export interface SidebarUserMenuItemProps {
  item: {
    key: string;
    href: string;
    access: EUserWorkspaceRoles[];
    labelTranslationKey: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Icon: any;
  };
  draftIssueCount: number;
}

export const SidebarUserMenuItem: FC<SidebarUserMenuItemProps> = observer((props) => {
  const { item, draftIssueCount } = props;
  // nextjs hooks
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // package hooks
  const { t } = useTranslation();
  // store hooks
  const { captureEvent } = useEventTracker();
  const { allowPermissions } = useUserPermissions();
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const isActive = pathname === item.href;

  if (item.key === "drafts" && draftIssueCount === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) return null;

  const handleLinkClick = (itemKey: string) => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    captureEvent(SIDEBAR_CLICKED, {
      destination: itemKey,
    });
  };

  return (
    <Tooltip
      tooltipContent={t(item.labelTranslationKey)}
      position="right"
      className="ml-2"
      disabled={!sidebarCollapsed}
      isMobile={isMobile}
    >
      <Link href={item.href} onClick={() => handleLinkClick(item.key)}>
        <SidebarNavItem
          className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
          isActive={isActive}
        >
          <div className="flex items-center gap-1.5 py-[1px]">
            <item.Icon className="size-4 flex-shrink-0" />
            {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{t(item.labelTranslationKey)}</p>}
          </div>
          {item.key === "notifications" && (
            <NotificationAppSidebarOption
              workspaceSlug={workspaceSlug.toString()}
              isSidebarCollapsed={sidebarCollapsed ?? false}
            />
          )}
        </SidebarNavItem>
      </Link>
    </Tooltip>
  );
});
