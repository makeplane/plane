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

import { useMemo, useCallback } from "react";
// plane imports
import {
  CycleIcon,
  IntakeIcon,
  ModuleIcon,
  PageIcon,
  ViewsIcon,
  WorkItemsIcon,
  EpicIcon,
  OverviewIcon,
} from "@plane/propel/icons";
import type { TNavigationItem } from "@/components/navigation/tab-navigation-root";
import { useProjectAccess } from "@/hooks/permissions/use-project-access";

type UseNavigationItemsProps = {
  workspaceSlug: string;
  projectId: string;
};

export const useNavigationItems = ({ workspaceSlug, projectId }: UseNavigationItemsProps): TNavigationItem[] => {
  const { canAccessProjectResource } = useProjectAccess();

  // Base navigation items
  const baseNavigation = useCallback(
    (workspaceSlug: string, projectId: string): TNavigationItem[] => [
      {
        i18n_key: "sidebar.work_items",
        key: "work_items",
        name: "Work items",
        href: `/${workspaceSlug}/projects/${projectId}/issues`,
        icon: WorkItemsIcon,
        sortOrder: 1,
      },
      {
        i18n_key: "sidebar.cycles",
        key: "cycles",
        name: "Cycles",
        href: `/${workspaceSlug}/projects/${projectId}/cycles`,
        icon: CycleIcon,
        sortOrder: 2,
      },
      {
        i18n_key: "sidebar.modules",
        key: "modules",
        name: "Modules",
        href: `/${workspaceSlug}/projects/${projectId}/modules`,
        icon: ModuleIcon,
        sortOrder: 3,
      },
      {
        i18n_key: "sidebar.views",
        key: "views",
        name: "Views",
        href: `/${workspaceSlug}/projects/${projectId}/views`,
        icon: ViewsIcon,
        sortOrder: 4,
      },
      {
        i18n_key: "sidebar.pages",
        key: "pages",
        name: "Pages",
        href: `/${workspaceSlug}/projects/${projectId}/pages`,
        icon: PageIcon,
        sortOrder: 5,
      },
      {
        i18n_key: "sidebar.intake",
        key: "intake",
        name: "Intake",
        href: `/${workspaceSlug}/projects/${projectId}/intake`,
        icon: IntakeIcon,
        sortOrder: 6,
      },
    ],
    []
  );

  // Additional navigation items (Overview, Epics)
  const additionalNavigationItems = useCallback(
    (workspaceSlug: string, projectId: string): TNavigationItem[] => [
      {
        name: "Overview",
        key: "overview",
        href: `/${workspaceSlug}/projects/${projectId}/overview/`,
        icon: OverviewIcon,
        sortOrder: -2,
        i18n_key: "common.overview",
      },
      {
        name: "Epics",
        key: "epics",
        href: `/${workspaceSlug}/projects/${projectId}/epics`,
        icon: EpicIcon,
        sortOrder: -1,
        i18n_key: "sidebar.epics",
      },
    ],
    []
  );

  // Combine, filter, and sort navigation items
  const navigationItems = useMemo(() => {
    const navItems = baseNavigation(workspaceSlug, projectId);
    navItems.push(...additionalNavigationItems(workspaceSlug, projectId));

    // Filter by permissions and shouldRender
    const filteredItems = navItems.filter((item) => {
      return canAccessProjectResource(workspaceSlug, projectId, item.key);
    });

    // Sort by sortOrder
    return filteredItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [workspaceSlug, projectId, baseNavigation, additionalNavigationItems, canAccessProjectResource]);

  return navigationItems;
};
