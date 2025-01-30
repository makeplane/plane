"use client";

import React, { FC, useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Layers } from "lucide-react";
import { EUserPermissionsLevel, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
// plane ui
import { Tooltip, DiceIcon, ContrastIcon, LayersIcon, Intake } from "@plane/ui";
// components
import { SidebarNavItem } from "@/components/sidebar";
// hooks
import { useAppTheme, useProject, useUserPermissions } from "@/hooks/store";
import { usePlatformOS } from "@/hooks/use-platform-os";
// plane-web constants

export type TNavigationItem = {
  key: string;
  name: string;
  href: string;
  icon: React.ElementType;
  access: EUserPermissions[];
  shouldRender: boolean;
  sortOrder: number;
};

type TProjectItemsProps = {
  workspaceSlug: string;
  projectId: string;
  additionalNavigationItems?: (workspaceSlug: string, projectId: string) => TNavigationItem[];
};

export const ProjectNavigation: FC<TProjectItemsProps> = observer((props) => {
  const { workspaceSlug, projectId, additionalNavigationItems } = props;
  // store hooks
  const { t } = useTranslation();
  const { sidebarCollapsed: isSidebarCollapsed, toggleSidebar } = useAppTheme();
  const { getProjectById } = useProject();
  const { isMobile } = usePlatformOS();
  const { allowPermissions } = useUserPermissions();
  // pathname
  const pathname = usePathname();
  // derived values
  const project = getProjectById(projectId);
  // handlers
  const handleProjectClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  if (!project) return null;

  const baseNavigation = useCallback(
    (workspaceSlug: string, projectId: string): TNavigationItem[] => [
      {
        key: "issues",
        name: "Issues",
        href: `/${workspaceSlug}/projects/${projectId}/issues`,
        icon: LayersIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: true,
        sortOrder: 1,
      },
      {
        key: "cycles",
        name: "Cycles",
        href: `/${workspaceSlug}/projects/${projectId}/cycles`,
        icon: ContrastIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: project.cycle_view,
        sortOrder: 2,
      },
      {
        key: "modules",
        name: "Modules",
        href: `/${workspaceSlug}/projects/${projectId}/modules`,
        icon: DiceIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: project.module_view,
        sortOrder: 3,
      },
      {
        key: "views",
        name: "Views",
        href: `/${workspaceSlug}/projects/${projectId}/views`,
        icon: Layers,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project.issue_views_view,
        sortOrder: 4,
      },
      {
        key: "pages",
        name: "Pages",
        href: `/${workspaceSlug}/projects/${projectId}/pages`,
        icon: FileText,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project.page_view,
        sortOrder: 5,
      },
      {
        key: "intake",
        name: "Intake",
        href: `/${workspaceSlug}/projects/${projectId}/inbox`,
        icon: Intake,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project.inbox_view,
        sortOrder: 6,
      },
    ],
    [project]
  );

  // memoized navigation items and adding additional navigation items
  const navigationItemsMemo = useMemo(() => {
    const navigationItems = (workspaceSlug: string, projectId: string): TNavigationItem[] => {
      const navItems = baseNavigation(workspaceSlug, projectId);

      if (additionalNavigationItems) {
        navItems.push(...additionalNavigationItems(workspaceSlug, projectId));
      }

      return navItems;
    };

    // sort navigation items by sortOrder
    const sortedNavigationItems = navigationItems(workspaceSlug, projectId).sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    return sortedNavigationItems;
  }, [workspaceSlug, projectId, baseNavigation, additionalNavigationItems]);

  return (
    <>
      {navigationItemsMemo.map((item) => {
        if (!item.shouldRender) return;

        const hasAccess = allowPermissions(item.access, EUserPermissionsLevel.PROJECT, workspaceSlug, project.id);
        if (!hasAccess) return null;

        return (
          <Tooltip
            key={item.name}
            isMobile={isMobile}
            tooltipContent={`${project?.name}: ${t(item.key)}`}
            position="right"
            className="ml-2"
            disabled={!isSidebarCollapsed}
          >
            <Link href={item.href} onClick={handleProjectClick}>
              <SidebarNavItem
                className={`pl-[18px] ${isSidebarCollapsed ? "p-0 size-7 justify-center mx-auto" : ""}`}
                isActive={pathname.includes(item.href)}
              >
                <div className="flex items-center gap-1.5 py-[1px]">
                  <item.icon
                    className={`flex-shrink-0 size-4 ${item.name === "Intake" ? "stroke-1" : "stroke-[1.5]"}`}
                  />
                  {!isSidebarCollapsed && <span className="text-xs font-medium">{t(item.key)}</span>}
                </div>
              </SidebarNavItem>
            </Link>
          </Tooltip>
        );
      })}
    </>
  );
});
