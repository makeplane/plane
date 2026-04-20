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
import { E_FEATURE_FLAGS } from "@plane/constants";
import type { WorkspaceResourceKey } from "@plane/constants";
import { isGuestRole } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePermissionAccess } from "@/hooks/store/use-permission-access";
import { useWorkspaceDraftIssues } from "@/hooks/store/workspace-draft";
import {
  useCustomers,
  useDashboards,
  useFeatureFlags,
  useTeamspaces,
  useWorkspaceFeatures,
} from "@/plane-web/hooks/store";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { useWorkspacePreferences } from "@/hooks/store/use-workspace-preferences";
import { useProject } from "@/hooks/store/use-project";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

export const useWorkspaceAccess = () => {
  // store hooks
  const { getPreferencesBySlug } = useWorkspacePreferences();
  const { permissions: workspacePermissions } = useWorkspace();
  const { permissions: workspaceDraftWorkItemsPermissions } = useWorkspaceDraftIssues();
  const {
    workspaceDashboards: { getCanViewDashboard },
  } = useDashboards();
  const {
    initiative: { permissions: initiativePermissions },
  } = useInitiatives();
  const { permissions: customerPermissions } = useCustomers();
  const { permissions: teamspacePermissions } = useTeamspaces();
  const { can, getCurrentUserWorkspaceRoleSlug } = usePermissionAccess();
  const { getFeatureFlag } = useFeatureFlags();
  const { isWorkspaceFeatureEnabled: isWorkspaceFeatureEnabledForStore } = useWorkspaceFeatures();
  const { permissions: projectPermissions } = useProject();

  const isWorkspaceFeatureEnabled = (workspaceSlug: string, featureKey: WorkspaceResourceKey): boolean => {
    const resourceFeatureChecks: Record<WorkspaceResourceKey, boolean> = {
      home: true,
      your_work: true,
      drafts: true,
      projects: true,
      stickies: true,
      views: true,
      analytics: true,
      inbox: true,
      archives: true,
      pi_chat: getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.AI_CHAT, false),
      dashboards: getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.DASHBOARDS, false),
      "active-cycles":
        getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.WORKSPACE_ACTIVE_CYCLES, false) &&
        (getPreferencesBySlug(workspaceSlug)?.active_cycles_count ?? 0) > 0,
      team_spaces:
        getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.TEAMSPACES, false) &&
        isWorkspaceFeatureEnabledForStore(workspaceSlug, EWorkspaceFeatures.IS_TEAMSPACES_ENABLED),
      initiatives:
        getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.INITIATIVES, false) &&
        isWorkspaceFeatureEnabledForStore(workspaceSlug, EWorkspaceFeatures.IS_INITIATIVES_ENABLED),
      customers:
        getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.CUSTOMERS, false) &&
        isWorkspaceFeatureEnabledForStore(workspaceSlug, EWorkspaceFeatures.IS_CUSTOMERS_ENABLED),
      releases:
        getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.RELEASES, false) &&
        isWorkspaceFeatureEnabledForStore(workspaceSlug, EWorkspaceFeatures.IS_RELEASES_ENABLED),
    };
    return resourceFeatureChecks[featureKey];
  };

  const hasWorkspaceResourcePermission = (workspaceSlug: string, resourceKey: WorkspaceResourceKey) => {
    const workspaceRoleSlug = getCurrentUserWorkspaceRoleSlug(workspaceSlug);
    const resourcePermissionChecks: Record<WorkspaceResourceKey, boolean> = {
      home: true,
      inbox: true,
      your_work: !isGuestRole(workspaceRoleSlug),
      stickies: true,
      drafts: workspaceDraftWorkItemsPermissions.getCanCreate(workspaceSlug),
      projects: projectPermissions.getCanBrowse(workspaceSlug),
      dashboards: getCanViewDashboard(workspaceSlug),
      views: true,
      "active-cycles": true,
      analytics: can({ resource: "analytics", action: "view", workspaceSlug }),
      archives: !isGuestRole(workspaceRoleSlug),
      initiatives: initiativePermissions.getCanView(workspaceSlug),
      team_spaces: teamspacePermissions.getCanBrowse(workspaceSlug),
      customers: customerPermissions.getCanView(workspaceSlug),
      pi_chat: true,
      releases: true, // TODO: <PermissionEngine> Update permission check for this (previous member check)
    };
    // Always check if the user has view permission for the workspace
    return workspacePermissions.getCanView(workspaceSlug) && Boolean(resourcePermissionChecks[resourceKey]);
  };

  const canAccessWorkspaceResource = (workspaceSlug: string, resourceKey: WorkspaceResourceKey): boolean => {
    return (
      hasWorkspaceResourcePermission(workspaceSlug, resourceKey) &&
      isWorkspaceFeatureEnabled(workspaceSlug, resourceKey)
    );
  };

  return {
    isWorkspaceFeatureEnabled,
    hasWorkspaceResourcePermission,
    canAccessWorkspaceResource,
  };
};
