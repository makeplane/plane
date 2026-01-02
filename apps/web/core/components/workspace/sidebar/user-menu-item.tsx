import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EUserWorkspaceRoles } from "@plane/types";
// components
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
import { NotificationAppSidebarOption } from "@/components/workspace-notifications/notification-app-sidebar-option";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useUserPermissions } from "@/hooks/store/user";

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

export const SidebarUserMenuItem = observer(function SidebarUserMenuItem(props: SidebarUserMenuItemProps) {
  const { item, draftIssueCount } = props;
  // nextjs hooks
  const { workspaceSlug } = useParams();
  const pathname = usePathname();
  // package hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  const { toggleSidebar } = useAppTheme();

  const isActive = pathname === item.href;

  if (item.key === "drafts" && draftIssueCount === 0) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) return null;

  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  return (
    <Link href={item.href} onClick={handleLinkClick}>
      <SidebarNavItem isActive={isActive}>
        <div className="flex items-center gap-1.5 py-[1px]">
          <item.Icon className="size-4 flex-shrink-0" />
          <p className="text-13 leading-5 font-medium">{t(item.labelTranslationKey)}</p>
        </div>
        {item.key === "notifications" && <NotificationAppSidebarOption workspaceSlug={workspaceSlug.toString()} />}
      </SidebarNavItem>
    </Link>
  );
});
