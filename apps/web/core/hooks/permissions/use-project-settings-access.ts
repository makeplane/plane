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
import { PROJECT_SETTINGS } from "@plane/constants";
import type { TProjectSettingsTabs } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useWorkflows } from "@/hooks/store/use-workflows";

/**
 * Project settings tab authorization helper.
 *
 * `hasProjectSettingPermission` performs raw permission checks for a setting key.
 * `canAccessProjectSetting` is the public access helper used by UI call sites.
 * `canAccessProjectSettingByAccessKey` resolves a route access key before checking.
 */
export const useProjectSettingsAccess = () => {
  // store hooks
  const { permissions: projectPermissions } = useProject();
  const { permissions: workflowPermissions } = useWorkflows();

  const hasProjectSettingPermission = (
    workspaceSlug: string,
    projectId: string,
    settingKey: TProjectSettingsTabs
  ): boolean => {
    const canManageProject = projectPermissions.getCanManage(workspaceSlug, projectId);

    const resourcePermissionChecks: Record<TProjectSettingsTabs, boolean> = {
      general: canManageProject,
      members: projectPermissions.getCanManageMembers(workspaceSlug, projectId),
      states: projectPermissions.getCanManageWorkItemStates(workspaceSlug, projectId),
      labels: projectPermissions.getCanManageLabels(workspaceSlug, projectId),
      estimates: projectPermissions.getCanManageEstimates(workspaceSlug, projectId),
      workflows: workflowPermissions.getCanManage(workspaceSlug, projectId),
      worklogs: canManageProject,
      features_cycles: canManageProject,
      features_modules: canManageProject,
      features_views: canManageProject,
      features_pages: canManageProject,
      features_intake: canManageProject,
      features_time_tracking: canManageProject,
      features_milestones: canManageProject,
      automations: canManageProject,
      "work-item-types": canManageProject,
      epics: canManageProject,
      project_updates: canManageProject,
      templates: canManageProject,
      recurring_work_items: canManageProject,
    };

    return resourcePermissionChecks[settingKey];
  };

  const canAccessProjectSetting = (
    workspaceSlug: string,
    projectId: string,
    settingKey: TProjectSettingsTabs
  ): boolean => hasProjectSettingPermission(workspaceSlug, projectId, settingKey);

  const canAccessProjectSettingByAccessKey = (workspaceSlug: string, projectId: string, accessKey: string): boolean => {
    // Match the longest-matching setting href first, and require an exact match or a
    // segment boundary so shorter hrefs (e.g. `general: ""`) don't swallow every
    // nested route.
    const settingKey = Object.values(PROJECT_SETTINGS)
      .slice()
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (setting) => accessKey === setting.href || (setting.href !== "" && accessKey.startsWith(`${setting.href}/`))
      )?.key;
    if (!settingKey) return false;
    return canAccessProjectSetting(workspaceSlug, projectId, settingKey);
  };

  return {
    hasProjectSettingPermission,
    canAccessProjectSetting,
    canAccessProjectSettingByAccessKey,
  };
};
