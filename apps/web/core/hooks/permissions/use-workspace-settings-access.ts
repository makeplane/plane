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
import { WORKSPACE_SETTINGS } from "@plane/constants";
import type { TWorkspaceSettingsTabs } from "@plane/types";
// hooks
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useRelationDefinition } from "@/hooks/store/use-relation-definition";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useIntegrationPermissions } from "@/hooks/store/integrations/use-integration-permissions";
import { useFeatureFlags, useTeamspaces } from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useWorkspaceWorkItemTypes } from "@/plane-web/hooks/store/work-item-types/use-workspace-work-item-types";

/**
 * Workspace settings tab authorization helper.
 *
 * `hasWorkspaceSettingPermission` performs raw permission checks for a setting key.
 * `canAccessWorkspaceSetting` is the public access helper used by UI call sites.
 * `canAccessWorkspaceSettingByRoute` resolves a route access key before checking.
 */
export const useWorkspaceSettingsAccess = () => {
  // store hooks
  const { can } = usePermissionAccess();
  const { getFeatureFlag } = useFeatureFlags();
  const { permissions: workspacePermissions } = useWorkspace();
  const { permissions: relationDefinitionPermissions } = useRelationDefinition();
  const integrationPermissions = useIntegrationPermissions();
  const { permissions: teamspacePermissions } = useTeamspaces();
  const {
    initiative: { permissions: initiativePermissions },
  } = useInitiatives();
  const { canCreate: canCreateWorkItemTypes } = useWorkspaceWorkItemTypes();

  const hasWorkspaceSettingPermission = (workspaceSlug: string, settingKey: TWorkspaceSettingsTabs): boolean => {
    const canManageWorkspace = workspacePermissions.getCanManage(workspaceSlug);
    const isCustomRolesAndPermissionsEnabled = getFeatureFlag(workspaceSlug, "CUSTOM_ROLES_AND_PERMISSIONS", false);
    const canViewCustomRoles =
      isCustomRolesAndPermissionsEnabled && can({ resource: "custom_role", action: "view", workspaceSlug });

    const resourcePermissionChecks: Record<TWorkspaceSettingsTabs, boolean> = {
      general: workspacePermissions.getCanView(workspaceSlug),
      members: workspacePermissions.getCanViewMembers(workspaceSlug),
      permissions: isCustomRolesAndPermissionsEnabled,
      "billing-and-plans": workspacePermissions.getCanViewBilling(workspaceSlug),
      webhooks: canManageWorkspace,
      connections: integrationPermissions.getCanCreate(workspaceSlug),
      integrations: integrationPermissions.getCanCreate(workspaceSlug),
      teamspaces: teamspacePermissions.getCanCreate(workspaceSlug),
      initiatives: initiativePermissions.getCanCreate(workspaceSlug),
      project_roles_and_schemes: canViewCustomRoles,
      workspace_roles_and_schemes: canViewCustomRoles,
      relations: relationDefinitionPermissions.getCanCreate(workspaceSlug),
      work_item_types: canCreateWorkItemTypes(workspaceSlug),
      export: canManageWorkspace,
      import: canManageWorkspace,
      worklogs: canManageWorkspace,
      identity: canManageWorkspace,
      project_states: canManageWorkspace,
      customers: canManageWorkspace,
      templates: canManageWorkspace,
      "plane-intelligence": canManageWorkspace,
      scripts: canManageWorkspace,
      "access-tokens": canManageWorkspace,
      releases: canManageWorkspace, // TODO: <PermissionEngine> Update permission check for this (previous admin check)
      "group-syncing": canManageWorkspace,
      automations: canManageWorkspace,
    };

    return resourcePermissionChecks[settingKey];
  };

  const canAccessWorkspaceSetting = (workspaceSlug: string, settingKey: TWorkspaceSettingsTabs): boolean =>
    hasWorkspaceSettingPermission(workspaceSlug, settingKey);

  const canAccessWorkspaceSettingByRoute = (workspaceSlug: string, accessKey: string): boolean => {
    // Match the longest-matching setting href first, and require an exact match or a
    // segment boundary so shorter hrefs (e.g. `general: "/settings"`) don't swallow
    // every nested route.
    const settingKey = Object.values(WORKSPACE_SETTINGS)
      .slice()
      .sort((a, b) => b.href.length - a.href.length)
      .find(
        (setting) => accessKey === setting.href || (setting.href !== "" && accessKey.startsWith(`${setting.href}/`))
      )?.key;
    if (!settingKey) return false;
    return canAccessWorkspaceSetting(workspaceSlug, settingKey);
  };

  return {
    hasWorkspaceSettingPermission,
    canAccessWorkspaceSetting,
    canAccessWorkspaceSettingByRoute,
  };
};
