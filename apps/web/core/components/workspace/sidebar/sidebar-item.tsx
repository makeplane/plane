// SidebarItemBase.tsx
"use client";
import type { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
// plane imports
import type { IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { joinUrlPath } from "@plane/utils";
// components
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
import { NotificationAppSidebarOption } from "@/components/workspace-notifications/notification-app-sidebar-option";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser, useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { getSidebarNavigationItemIcon } from "@/plane-web/components/workspace/sidebar/helper";

type Props = {
  item: IWorkspaceSidebarNavigationItem;
  additionalRender?: (itemKey: string, workspaceSlug: string) => ReactNode;
  additionalStaticItems?: string[];
};

export const SidebarItemBase: FC<Props> = observer(({ item, additionalRender, additionalStaticItems }) => {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { workspaceSlug } = useParams();
  const { allowPermissions } = useUserPermissions();
  const { getNavigationPreferences } = useWorkspace(); // 获取当前工作空间的导航偏好设置
  const { data } = useUser(); // 获取当前用户的信息

  //toggleSidebar: 切换侧边栏的展开状态
  //isExtendedSidebarOpened: 检查当前是否有扩展侧边栏打开
  //toggleExtendedSidebar: 切换扩展侧边栏的展开状态
  const { toggleSidebar, isExtendedSidebarOpened, toggleExtendedSidebar } = useAppTheme();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) toggleSidebar(); // 当窗口宽度小于768px时，切换侧边栏的展开状态
    if (isExtendedSidebarOpened) toggleExtendedSidebar(false); // 当有扩展侧边栏打开时，关闭它
  };

  const staticItems = ["home", "inbox", "pi_chat", "projects", "your_work", ...(additionalStaticItems || [])]; // 静态导航项的列表，包括"home", "inbox", "pi_chat", "projects", "your_work"等
  const slug = workspaceSlug?.toString() || ""; // 当前工作空间的slug，用于构建导航链接

  if (!allowPermissions(item.access, EUserPermissionsLevel.WORKSPACE, slug)) return null; // 检查当前用户是否有访问该导航项的权限

  const sidebarPreference = getNavigationPreferences(slug);
  
  const isPinned = sidebarPreference?.[item.key]?.is_pinned;
  if (!isPinned && !staticItems.includes(item.key)) return null;

  const itemHref =
    item.key === "your_work" && data?.id ? joinUrlPath(slug, item.href, data?.id) : joinUrlPath(slug, item.href);
  const icon = getSidebarNavigationItemIcon(item.key);


  return (
    <Link href={itemHref} onClick={handleLinkClick}>
      {/* item.highlight显示高亮 */}
      <SidebarNavItem isActive={item.highlight(pathname, itemHref)}> 
        <div className="flex items-center gap-1.5 py-[1px]">
          {icon}
          <p className="text-sm leading-5 font-medium">{t(item.labelTranslationKey)}</p>
        </div>
        {item.key === "inbox" && <NotificationAppSidebarOption workspaceSlug={slug} />}
        {additionalRender?.(item.key, slug)}
      </SidebarNavItem>
    </Link>
  );
});
