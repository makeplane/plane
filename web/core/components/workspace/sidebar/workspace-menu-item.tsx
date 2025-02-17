import { FC } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EUserWorkspaceRoles, EUserPermissionsLevel } from "@plane/constants";
import { usePlatformOS } from "@plane/hooks";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/ui";
import { cn } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar";
// hooks
import { useAppTheme, useUserPermissions } from "@/hooks/store";
// plane web imports
import { UpgradeBadge } from "@/plane-web/components/workspace";

export type SidebarWorkspaceMenuItemProps = {
  item: {
    labelTranslationKey: string;
    key: string;
    href: string;
    Icon: any;
    access: EUserWorkspaceRoles[];
  };
};

export const SidebarWorkspaceMenuItem: FC<SidebarWorkspaceMenuItemProps> = observer((props) => {
  const { item } = props;

  const { t } = useTranslation();
  // nextjs hooks
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  // store hooks
  const { toggleSidebar, sidebarCollapsed } = useAppTheme();
  const { isMobile } = usePlatformOS();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) {
    return null;
  }

  const isActive = item.href === pathname;

  return (
    <Tooltip
      tooltipContent={t(item.labelTranslationKey)}
      position="right"
      className="ml-2"
      disabled={!sidebarCollapsed}
      isMobile={isMobile}
    >
      <Link href={item.href} onClick={() => handleLinkClick()}>
        <SidebarNavItem
          className={`${sidebarCollapsed ? "p-0 size-8 aspect-square justify-center mx-auto" : ""}`}
          isActive={isActive}
        >
          <div className="flex items-center gap-1.5 py-[1px]">
            <item.Icon
              className={cn("size-4", {
                "rotate-180": item.key === "active-cycles",
              })}
            />
            {!sidebarCollapsed && <p className="text-sm leading-5 font-medium">{t(item.labelTranslationKey)}</p>}
          </div>
          {!sidebarCollapsed && item.key === "active-cycles" && (
            <div className="flex-shrink-0">
              <UpgradeBadge />
            </div>
          )}
        </SidebarNavItem>
      </Link>
    </Tooltip>
  );
});
