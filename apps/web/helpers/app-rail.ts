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

import { E_FEATURE_FLAGS } from "@plane/constants";
// store
import { store } from "@/lib/store-context";
import { EWorkspaceFeatures } from "@/types/workspace-feature";

const SidebarFeatureKeyToFeatureFlagMap: Record<string, E_FEATURE_FLAGS | undefined> = {
  home: undefined,
  wiki: E_FEATURE_FLAGS.WORKSPACE_PAGES,
  "pi-chat": E_FEATURE_FLAGS.AI_CHAT,
};

export const isAppRailFeatureEnabled = (workspaceSlug: string, featureKey: string) => {
  // Check if we need to check for a feature flag, if not, return true
  const featureFlag = SidebarFeatureKeyToFeatureFlagMap[featureKey];
  if (!featureFlag) return true;
  // Check for the feature flag in the current workspace
  const isFeatureFlagEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, featureFlag, false);

  switch (featureKey) {
    case "pi-chat":
      return (
        isFeatureFlagEnabled &&
        store.workspaceFeatures.isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_PI_ENABLED)
      );
    case "wiki":
      return (
        store.workspaceFeatures.isWorkspaceFeatureEnabled(workspaceSlug, EWorkspaceFeatures.IS_WIKI_ENABLED) &&
        !!store.permissionAccessStore.can({
          action: "view",
          resource: "wiki",
          workspaceSlug,
        })
      );
    default:
      return isFeatureFlagEnabled;
  }
};

export const isAppRailFeatureConfigured = (workspaceSlug: string, featureKey: string) => {
  switch (featureKey) {
    case "pi-chat":
      return store.aiFeatureFlags.getAiFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.AI_CHAT, false);
    default:
      return true;
  }
};
