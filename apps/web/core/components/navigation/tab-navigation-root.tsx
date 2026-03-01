/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import React, { useCallback, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useLocation, Link, useNavigate } from "react-router";
import { EUserPermissionsLevel, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TabNavigationList, TabNavigationItem } from "@plane/propel/tab-navigation";
import { setPromiseToast } from "@plane/propel/toast";
import type { EUserProjectRoles } from "@plane/types";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useProject } from "@/hooks/store/use-project";
import { useUserPermissions } from "@/hooks/store/user";
// plane web imports
import { useNavigationItems } from "@/components/navigation";
import { LeaveProjectModal } from "@/components/projects/modals/leave-project-modal";
import { PublishProjectModal } from "@/components/projects/modals/publish-modal";
// local imports
import { ProjectActionsMenu } from "./project-actions-menu";
import { ProjectHeader } from "./project-header";
import { TabNavigationOverflowMenu } from "./tab-navigation-overflow-menu";
import { DEFAULT_TAB_KEY } from "./tab-navigation-utils";
import { TabNavigationVisibleItem } from "./tab-navigation-visible-item";
import { useActiveTab } from "./use-active-tab";
import { useProjectActions } from "./use-project-actions";
import { useResponsiveTabLayout } from "./use-responsive-tab-layout";
import { useTabPreferences } from "./use-tab-preferences";

// Local type definition for navigation items with app-specific fields
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

type TTabNavigationRootProps = {
  workspaceSlug: string;
  projectId: string;
};

export const TabNavigationRoot = observer(function TabNavigationRoot(props: TTabNavigationRootProps) {
  const { workspaceSlug, projectId } = props;
  const { workItem: workItemIdentifierFromRoute } = useParams();
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { t } = useTranslation();
  // states
  const [isFavoriteMenuOpen, setIsFavoriteMenuOpen] = useState(false);

  // Store hooks
  const { getProjectById, addProjectToFavorites, removeProjectFromFavorites } = useProject();
  const { allowPermissions } = useUserPermissions();
  const {
    issue: { getIssueIdByIdentifier, getIssueById },
  } = useIssueDetail();

  // Tab preferences hook
  const { tabPreferences, handleToggleDefaultTab, handleHideTab, handleShowTab } = useTabPreferences(
    workspaceSlug,
    projectId
  );

  // Derived values
  const workItemId = workItemIdentifierFromRoute
    ? getIssueIdByIdentifier(workItemIdentifierFromRoute?.toString())
    : undefined;
  const workItem = workItemId ? getIssueById(workItemId) : undefined;
  const project = getProjectById(projectId);

  const toggleFavoriteMenu = useCallback((value: boolean) => {
    setIsFavoriteMenuOpen(value);
  }, []);

  // Navigation items hook
  const navigationItems = useNavigationItems({
    workspaceSlug,
    projectId,
    project,
    allowPermissions,
  });

  // Active tab hook
  const { isActive, activeItem } = useActiveTab({
    navigationItems,
    pathname,
    workItemId,
    workItem,
    projectId,
  });

  // Project actions hook
  const {
    publishModalOpen,
    leaveProjectModalOpen,
    handleLeaveProject,
    handleCopyText,
    handlePublishModal,
    handleLeaveProjectModal,
  } = useProjectActions({
    workspaceSlug,
    projectId,
    activeItem,
  });

  // Filter and sort navigation items
  const allNavigationItems = navigationItems
    .filter((item) => item.shouldRender)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  // Split items into two categories:
  // 1. visibleNavigationItems: Items NOT user-hidden (may still overflow due to space)
  // 2. hiddenNavigationItems: Items user explicitly hid (always in overflow with "Show" icon)
  const visibleNavigationItems = allNavigationItems.filter((item) => !tabPreferences.hiddenTabs.includes(item.key));
  const hiddenNavigationItems = allNavigationItems.filter((item) => tabPreferences.hiddenTabs.includes(item.key));

  // Responsive tab layout hook
  const { visibleItems, overflowItems, hasOverflow, itemRefs, containerRef } = useResponsiveTabLayout({
    visibleNavigationItems,
    hiddenNavigationItems,
    isActive,
  });

  // Redirect to default tab when navigating to project root
  useEffect(() => {
    const projectRootPath = `/${workspaceSlug}/projects/${projectId}`;
    const isProjectRoot = pathname === projectRootPath || pathname === `${projectRootPath}/`;

    if (isProjectRoot && allNavigationItems.length > 0) {
      // Find the default tab in available items
      const defaultTabItem = allNavigationItems.find((item) => item.key === tabPreferences.defaultTab);

      // If default tab exists and is enabled, use it; otherwise fall back to work_items
      const targetItem = defaultTabItem || allNavigationItems.find((item) => item.key === DEFAULT_TAB_KEY);

      if (targetItem) {
        navigate(targetItem.href, { replace: true });
      }
    }
  }, [pathname, workspaceSlug, projectId, tabPreferences.defaultTab, allNavigationItems, navigate]);

  if (allNavigationItems.length === 0) return null;
  if (!project) return null;

  // Permission checks
  const isAdmin = allowPermissions(
    [EUserPermissions.ADMIN],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project?.id
  );

  const isAuthorized = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug.toString(),
    project?.id
  );

  const handleAddToFavorites = () => {
    if (!workspaceSlug) return;

    const addToFavoritePromise = addProjectToFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(addToFavoritePromise, {
      loading: "Adding project to favorites...",
      success: {
        title: "Success!",
        message: () => "Project added to favorites.",
        actionItems: () => {
          if (!isFavoriteMenuOpen) toggleFavoriteMenu(true);
          return <></>;
        },
      },
      error: {
        title: "Error!",
        message: () => "Couldn't add the project to favorites. Please try again.",
      },
    });
  };

  const handleRemoveFromFavorites = () => {
    if (!workspaceSlug) return;

    const removeFromFavoritePromise = removeProjectFromFavorites(workspaceSlug.toString(), project.id);
    setPromiseToast(removeFromFavoritePromise, {
      loading: "Removing project from favorites...",
      success: {
        title: "Success!",
        message: () => "Project removed from favorites.",
      },
      error: {
        title: "Error!",
        message: () => "Couldn't remove the project from favorites. Please try again.",
      },
    });
  };

  return (
    <>
      <PublishProjectModal isOpen={publishModalOpen} projectId={projectId} onClose={() => handlePublishModal(false)} />
      <LeaveProjectModal
        project={project}
        isOpen={leaveProjectModalOpen}
        onClose={() => handleLeaveProjectModal(false)}
      />

      {/* container for the tab navigation */}
      <div className="flex items-center gap-3 overflow-hidden size-full">
        <div className="flex items-center gap-2 shrink-0">
          <ProjectHeader workspaceSlug={workspaceSlug} projectId={projectId} />
          <div className="shrink-0">
            <ProjectActionsMenu
              workspaceSlug={workspaceSlug}
              project={project}
              isAdmin={isAdmin}
              isFavorite={project?.is_favorite || false}
              isAuthorized={isAuthorized}
              onCopyText={handleCopyText}
              onLeaveProject={handleLeaveProject}
              handleAddToFavorites={handleAddToFavorites}
              handleRemoveFromFavorites={handleRemoveFromFavorites}
              onPublishModal={() => handlePublishModal(true)}
            />
          </div>
        </div>

        <div className="shrink-0 h-5 w-1 border-l border-subtle" />

        <div ref={containerRef} className="flex items-center h-full flex-1 min-w-0 overflow-hidden">
          <TabNavigationList className="h-full">
            {/* Render visible tab items */}
            {visibleItems.map((item) => {
              const itemIsActive = isActive(item);
              const originalIndex = allNavigationItems.indexOf(item);

              return (
                <TabNavigationVisibleItem
                  key={item.key}
                  item={item}
                  isActive={itemIsActive}
                  tabPreferences={tabPreferences}
                  onToggleDefault={handleToggleDefaultTab}
                  onHide={handleHideTab}
                  itemRef={(el) => {
                    itemRefs.current[originalIndex] = el;
                  }}
                />
              );
            })}

            {/* Render overflow menu if needed */}
            {hasOverflow && (
              <TabNavigationOverflowMenu
                overflowItems={overflowItems}
                isActive={isActive}
                tabPreferences={tabPreferences}
                onToggleDefault={handleToggleDefaultTab}
                onShow={handleShowTab}
              />
            )}
          </TabNavigationList>

          {hasOverflow && (
            <div className="absolute opacity-0 pointer-events-none -z-10">
              {visibleNavigationItems.map((item) => {
                const itemIsActive = isActive(item);
                const originalIndex = allNavigationItems.indexOf(item);
                return (
                  <div
                    key={`measure-hidden-${item.key}`}
                    ref={(el) => {
                      itemRefs.current[originalIndex] = el;
                    }}
                    className="inline-block"
                  >
                    <Link to={item.href}>
                      <TabNavigationItem isActive={itemIsActive}>
                        <span>{t(item.i18n_key)}</span>
                      </TabNavigationItem>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
});
