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
// store
import { store } from "@/lib/store-context";
// plane web types
import { EWorkspaceFeatures } from "@/types/workspace-feature";

const SidebarFeatureKeyToFeatureFlagMap: Record<string, E_FEATURE_FLAGS | undefined> = {
  home: undefined,
  "your-work": undefined,
  notifications: undefined,
  drafts: undefined,
  pi_chat: E_FEATURE_FLAGS.AI_CHAT,
  "workspace-dashboards": E_FEATURE_FLAGS.DASHBOARDS,
  projects: undefined,
  stickies: undefined,
  team_spaces: E_FEATURE_FLAGS.TEAMSPACES,
  "all-issues": undefined,
  active_cycles: E_FEATURE_FLAGS.WORKSPACE_ACTIVE_CYCLES,
  analytics: undefined,
  initiatives: E_FEATURE_FLAGS.INITIATIVES,
  customers: E_FEATURE_FLAGS.CUSTOMERS,
  releases: E_FEATURE_FLAGS.RELEASES,
};

export const isSidebarFeatureEnabled = (featureKey: string, workspaceSlug: string) => {
  // Check if we need to check for a feature flag, if not, return true
  const featureFlag = SidebarFeatureKeyToFeatureFlagMap[featureKey];
  if (!featureFlag) return true;
  // Check for the feature flag in the current workspace
  const isFeatureFlagEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, featureFlag, false);

  switch (featureKey) {
    case "workspace-dashboards":
      return isFeatureFlagEnabled;
    case "active-cycles":
      return isFeatureFlagEnabled && store.user.permission.workspaceUserInfo[workspaceSlug]?.active_cycles_count > 0;
    case "team_spaces":
      return (
        isFeatureFlagEnabled &&
        store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMSPACES_ENABLED)
      );
    case "initiatives":
      return (
        isFeatureFlagEnabled &&
        store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED)
      );
    case "customers":
      return (
        isFeatureFlagEnabled &&
        store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_CUSTOMERS_ENABLED)
      );
    case "releases":
      return store.releaseStore.isReleasesEnabled(workspaceSlug);
    default:
      return isFeatureFlagEnabled;
  }
};
