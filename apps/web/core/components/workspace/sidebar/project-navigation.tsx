import React, { useCallback, useMemo } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
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
  const { toggleSidebar } = useAppTheme();
  const { getPartialProjectById } = useProject();
  const { allowPermissions } = useUserPermissions();
  const {
    issue: { getIssueIdByIdentifier, getIssueById },
  } = useIssueDetail();
  // pathname
  const pathname = usePathname();
  // derived values
  const workItemId = workItemIdentifierFromRoute
    ? getIssueIdByIdentifier(workItemIdentifierFromRoute?.toString())
    : undefined;
  const workItem = workItemId ? getIssueById(workItemId) : undefined;
  const project = getPartialProjectById(projectId);
  // handlers
  const handleProjectClick = () => {
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const baseNavigation = useCallback(
    (workspaceSlug: string, projectId: string): TNavigationItem[] => [
      {
        i18n_key: "sidebar.work_items",
        key: "work_items",
        name: "Work items",
        href: `/${workspaceSlug}/projects/${projectId}/issues`,
        icon: WorkItemsIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: true,
        sortOrder: 1,
      },
      {
        i18n_key: "sidebar.cycles",
        key: "cycles",
        name: "Cycles",
        href: `/${workspaceSlug}/projects/${projectId}/cycles`,
        icon: CycleIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: project?.cycle_view ?? false,
        sortOrder: 2,
      },
      {
        i18n_key: "sidebar.modules",
        key: "modules",
        name: "Modules",
        href: `/${workspaceSlug}/projects/${projectId}/modules`,
        icon: ModuleIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
        shouldRender: project?.module_view ?? false,
        sortOrder: 3,
      },
      {
        i18n_key: "sidebar.views",
        key: "views",
        name: "Views",
        href: `/${workspaceSlug}/projects/${projectId}/views`,
        icon: ViewsIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project?.issue_views_view ?? false,
        sortOrder: 4,
      },
      {
        i18n_key: "sidebar.pages",
        key: "pages",
        name: "Pages",
        href: `/${workspaceSlug}/projects/${projectId}/pages`,
        icon: PageIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project?.page_view ?? false,
        sortOrder: 5,
      },
      {
        i18n_key: "sidebar.intake",
        key: "intake",
        name: "Intake",
        href: `/${workspaceSlug}/projects/${projectId}/intake`,
        icon: IntakeIcon,
        access: [EUserPermissions.ADMIN, EUserPermissions.MEMBER, EUserPermissions.GUEST],
        shouldRender: project?.inbox_view ?? false,
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

  if (!project) return null;

  return (
    <>
      {navigationItemsMemo.map((item) => {
        if (!item.shouldRender) return;

        const hasAccess = allowPermissions(item.access, EUserPermissionsLevel.PROJECT, workspaceSlug, project.id);
        if (!hasAccess) return null;

        return (
          <Link key={item.key} href={item.href} onClick={handleProjectClick}>
            <SidebarNavItem isActive={!!isActive(item)}>
              <div className="flex items-center gap-1.5 py-[1px]">
                <item.icon className={`flex-shrink-0 size-4 ${item.name === "Intake" ? "stroke-1" : "stroke-[1.5]"}`} />
                <span className="text-11 font-medium">{t(item.i18n_key)}</span>
              </div>
            </SidebarNavItem>
          </Link>
        );
      })}
    </>
  );
});
