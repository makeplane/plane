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

// plane imports
import type { ProjectResourceKey } from "@plane/types";
import { isGuestRole } from "@plane/utils";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useFeatureFlags } from "@/plane-web/hooks/store/use-feature-flags";
import { useIssueTypes } from "@/plane-web/hooks/store/issue-types/use-issue-types";
import { useProject } from "@/hooks/store/use-project";
import { useIssues } from "@/hooks/store/use-issues";
import { useCycle } from "@/hooks/store/use-cycle";
import { useModule } from "@/hooks/store/use-module";
import { useProjectView } from "@/hooks/store/use-project-view";
import { useProjectInbox } from "@/hooks/store/use-project-inbox";
import { useEpics } from "@/plane-web/hooks/store/epics/use-epics";

export const useProjectAccess = () => {
  // store hooks
  const { getCurrentUserProjectRoleSlug } = usePermissionAccess();
  const { getFeatureFlag } = useFeatureFlags();
  const { getPartialProjectById, permissions: projectPermissions } = useProject();
  const { permissions: workItemPermissions } = useIssues();
  const { permissions: epicPermissions } = useEpics();
  const { permissions: cyclePermissions } = useCycle();
  const { permissions: modulePermissions } = useModule();
  const { permissions: projectViewPermissions } = useProjectView();
  const { permissions: intakeWorkItemPermissions } = useProjectInbox();
  const { isEpicEnabledForProject } = useIssueTypes();

  const isProjectFeatureEnabled = (workspaceSlug: string, projectId: string, featureKey: ProjectResourceKey) => {
    const project = getPartialProjectById(projectId);

    if (!project) return false;
    const resourceFeatureChecks: Record<ProjectResourceKey, boolean> = {
      overview: getFeatureFlag(workspaceSlug, "PROJECT_OVERVIEW", false),
      work_items: true,
      epics: isEpicEnabledForProject(workspaceSlug, projectId),
      cycles: project.cycle_view,
      modules: project.module_view,
      views: project.issue_views_view,
      pages: project.page_view,
      intake: project.inbox_view,
      archives: true,
    };
    return Boolean(resourceFeatureChecks[featureKey]);
  };

  const hasProjectResourcePermission = (workspaceSlug: string, projectId: string, resourceKey: ProjectResourceKey) => {
    const currentUserProjectRoleSlug = getCurrentUserProjectRoleSlug(projectId);

    const resourcePermissionChecks: Record<ProjectResourceKey, boolean> = {
      overview: projectPermissions.getCanView(workspaceSlug, projectId),
      work_items: workItemPermissions.getCanView(workspaceSlug, projectId),
      epics: epicPermissions.getCanView(workspaceSlug, projectId),
      cycles: cyclePermissions.getCanViewCycle(workspaceSlug, projectId),
      modules: modulePermissions.getCanViewModule(workspaceSlug, projectId),
      views: projectViewPermissions.getCanViewViews(workspaceSlug, projectId),
      pages: true, // TODO: <PermissionEngine> Update permission check for this (no previous check)
      intake: intakeWorkItemPermissions.getCanView(workspaceSlug, projectId),
      archives: !isGuestRole(currentUserProjectRoleSlug),
    };

    // Always check if the user has view permission for the workspace
    return projectPermissions.getCanView(workspaceSlug, projectId) && Boolean(resourcePermissionChecks[resourceKey]);
  };

  const canAccessProjectResource = (
    workspaceSlug: string,
    projectId: string,
    resourceKey: ProjectResourceKey
  ): boolean => {
    return (
      hasProjectResourcePermission(workspaceSlug, projectId, resourceKey) &&
      isProjectFeatureEnabled(workspaceSlug, projectId, resourceKey)
    );
  };

  return {
    isProjectFeatureEnabled,
    hasProjectResourcePermission,
    canAccessProjectResource,
  };
};
