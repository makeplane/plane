// SidebarItemBase.tsx
"use client";
import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { EUserPermissionsLevel, IWorkspaceSidebarNavigationItem } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { SidebarNavItem } from "@/components/sidebar";
import { NotificationAppSidebarOption } from "@/components/workspace-notifications";
import { useAppTheme, useUser, useUserPermissions, useWorkspace } from "@/hooks/store";
import { getSidebarNavigationItemIcon } from "@/plane-web/components/workspace";

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
  const { getNavigationPreferences } = useWorkspace();
  const { data } = useUser();

  const { toggleSidebar, isExtendedSidebarOpened, toggleExtendedSidebar } = useAppTheme();

  const handleLinkClick = () => {
    if (window.innerWidth < 768) toggleSidebar();
    if (isExtendedSidebarOpened) toggleExtendedSidebar(false);
  };

  const staticItems = ["home", "inbox", "pi_chat", "projects", "your_work", ...(additionalStaticItems || [])];
  const slug = workspaceSlug?.toString() || "";

  if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, slug)) return null;

  const sidebarPreference = getNavigationPreferences(slug);
  const isPinned = sidebarPreference?.[item.key]?.is_pinned;
  if (!isPinned && !staticItems.includes(item.key)) return null;

  const itemHref = item.key === "your_work" ? `/${slug}${item.href}${data?.id}/` : `/${slug}${item.href}`;
  const isActive = itemHref === pathname;
  const icon = getSidebarNavigationItemIcon(item.key);

  return (
    <Link href={itemHref} onClick={handleLinkClick}>
      <SidebarNavItem isActive={isActive}>
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
