/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { Clock } from "lucide-react";
import { EUserPermissionsLevel, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { CycleIcon, IntakeIcon, ModuleIcon, PageIcon, ViewsIcon, WorkItemsIcon } from "@plane/propel/icons";
import type { EUserProjectRoles } from "@plane/types";
// plane ui
// components
import { SidebarNavItem } from "@/components/sidebar/sidebar-navigation";
// hooks
import { useAppTheme } from "@/hooks/store/use-app-theme";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";

export type TNavigationItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  access: EUserPermissions[] | EUserProjectRoles[];
  shouldRender: boolean;
  sortOrder: number;
  i18n_key: string;
  key: string;
};

type TProjectItemsProps = {
  workspaceSlug: string;
  projectId: string;
  additionalNavigationItems?: (workspaceSlug: string, projectId: string) => TNavigationItem[];
};

export const ProjectNavigation = observer(function ProjectNavigation(props: TProjectItemsProps) {
  const { workspaceSlug, projectId, additionalNavigationItems } = props;
  const { workItem: workItemIdentifierFromRoute } = useParams();
  // store hooks
  const { t } = useTranslation();
  const { isExtendedProjectSidebarOpened, toggleExtendedProjectSidebar, toggleSidebar } = useAppTheme();
  const { getPartialProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const {
    issue: { getIssueIdByIdentifier, getIssueById },
  } = useIssueDetail();
  // pathname
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  // derived values
  const workItemId = workItemIdentifierFromRoute
    ? getIssueIdByIdentifier(workItemIdentifierFromRoute?.toString())
    : undefined;
  const workItem = workItemId ? getIssueById(workItemId) : undefined;
  const project = getPartialProjectById(projectId);
  const intakeHref = `/${workspaceSlug}/projects/${projectId}/intake`;
  // Remembers the last non-Intake page visited, so a second click on the
  // Intake nav item can return there in one step — Intake itself pushes a
  // new history entry per selected issue (see InboxSidebar), so plain
  // router.back() would only step through those instead of leaving Intake.
  const lastNonIntakePathRef = useRef<string | null>(null);
  useEffect(() => {
    if (!pathname.startsWith(intakeHref)) {
      const query = searchParams.toString();
      lastNonIntakePathRef.current = query ? `${pathname}?${query}` : pathname;
    }
  }, [pathname, searchParams, intakeHref]);
  // handlers
  const handleProjectClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
    // close the extended sidebar if it is open
    if (isExtendedProjectSidebarOpened) {
      toggleExtendedProjectSidebar(false);
    }
  };

  const baseNavigation = useCallback(
    (navWorkspaceSlug: string, navProjectId: string): TNavigationItem[] => [
      {
        i18n_key: "sidebar.work_items",
        key: "work_items",
        name: "Work items",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/issues`,
        icon: WorkItemsIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: true,
        sortOrder: 1,
      },
      {
        i18n_key: "sidebar.cycles",
        key: "cycles",
        name: "Cycles",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/cycles`,
        icon: CycleIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: project?.cycle_view ?? false,
        sortOrder: 2,
      },
      {
        i18n_key: "sidebar.modules",
        key: "modules",
        name: "Modules",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/modules`,
        icon: ModuleIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: project?.module_view ?? false,
        sortOrder: 3,
      },
      {
        i18n_key: "sidebar.views",
        key: "views",
        name: "Views",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/views`,
        icon: ViewsIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project?.issue_views_view ?? false,
        sortOrder: 4,
      },
      {
        i18n_key: "sidebar.pages",
        key: "pages",
        name: "Pages",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/pages`,
        icon: PageIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project?.page_view ?? false,
        sortOrder: 5,
      },
      {
        i18n_key: "sidebar.intake",
        key: "intake",
        name: "Intake",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/intake`,
        icon: IntakeIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project?.inbox_view ?? false,
        sortOrder: 6,
      },
      {
        i18n_key: "sidebar.reports",
        key: "reports",
        name: "Reports",
        href: `/${navWorkspaceSlug}/projects/${navProjectId}/reports`,
        icon: Clock,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: true,
        sortOrder: 7,
      },
    ],
    [project]
  );

  // memoized navigation items and adding additional navigation items
  const navigationItemsMemo = useMemo(() => {
    const navigationItems = (navWorkspaceSlug: string, navProjectId: string): TNavigationItem[] => {
      const navItems = baseNavigation(navWorkspaceSlug, navProjectId);

      if (additionalNavigationItems) {
        navItems.push(...additionalNavigationItems(navWorkspaceSlug, navProjectId));
      }

      return navItems;
    };

    // sort navigation items by sortOrder
    // eslint-disable-next-line unicorn/no-array-sort -- toSorted() is ES2023, unsupported by this app's tsconfig lib target
    const sortedNavigationItems = navigationItems(workspaceSlug, projectId).sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
    );

    return sortedNavigationItems;
  }, [workspaceSlug, projectId, baseNavigation, additionalNavigationItems]);

  const isActive = useCallback(
    (item: TNavigationItem) => {
      // work item condition
      const workItemCondition = workItemId && workItem && !workItem?.is_epic && workItem?.project_id === projectId;
      // epic condition
      const epicCondition = workItemId && workItem && workItem?.is_epic && workItem?.project_id === projectId;
      // is active
      const isWorkItemActive = item.key === "work_items" && workItemCondition;
      const isEpicActive = item.key === "epics" && epicCondition;
      // pathname condition
      const isPathnameActive = pathname.includes(item.href);
      // return
      return isWorkItemActive || isEpicActive || isPathnameActive;
    },
    [pathname, workItem, workItemId, projectId]
  );

  const handleNavItemClick = useCallback(
    (e: React.MouseEvent, item: TNavigationItem) => {
      handleProjectClick();
      if (item.key === "intake" && isActive(item)) {
        e.preventDefault();
        router.push(lastNonIntakePathRef.current ?? `/${workspaceSlug}/projects/${projectId}/issues`);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleProjectClick is a stable inline fn, redefined every render
    [isActive, router, workspaceSlug, projectId]
  );

  if (!project) return null;

  return (
    <>
      {navigationItemsMemo.map((item) => {
        if (!item.shouldRender) return;

        const hasAccess = allowPermissions(item.access, EUserPermissionsLevel.PROJECT, workspaceSlug, project.id);
        if (!hasAccess) return null;

        const shouldShowCount = item.key === "intake" && (project.intake_count ?? 0) > 0;

        return (
          <Link key={item.key} href={item.href} onClick={(e) => handleNavItemClick(e, item)}>
            <SidebarNavItem isActive={!!isActive(item)}>
              <div className="flex w-full items-center justify-between gap-1.5 py-[1px]">
                <div className="flex items-center gap-1.5">
                  <item.icon
                    className={`size-4 flex-shrink-0 ${item.name === "Intake" ? "stroke-1" : "stroke-[1.5]"}`}
                  />
                  <span className="text-11 font-medium">{t(item.i18n_key)}</span>
                </div>
                {shouldShowCount && <span className="text-11 font-medium text-tertiary">{project.intake_count}</span>}
              </div>
            </SidebarNavItem>
          </Link>
        );
      })}
    </>
  );
});
