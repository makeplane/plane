import { store } from "@/lib/store-context";
// plane web hooks
import { E_FEATURE_FLAGS } from "@/plane-web/hooks/store";
// plane web types
import { TSidebarUserMenuItemKeys, TSidebarWorkspaceMenuItemKeys } from "@/plane-web/types/dashboard";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const UserFeatureKeyToFeatureFlagMap: Record<TSidebarUserMenuItemKeys, E_FEATURE_FLAGS | undefined> = {
  home: undefined,
  "your-work": undefined,
  notifications: undefined,
  drafts: undefined,
  "pi-chat": E_FEATURE_FLAGS.PI_CHAT,
};

export const isUserFeatureEnabled = (featureKey: TSidebarUserMenuItemKeys) => {
  // Check if we need to check for a feature flag, if not, return true
  const featureFlag = UserFeatureKeyToFeatureFlagMap[featureKey];
  if (!featureFlag) return true;
  // Check for the feature flag in the current workspace
  return store.featureFlags.getFeatureFlagForCurrentWorkspace(featureFlag, false);
};

const WorkspaceFeatureKeyToFeatureFlagMap: Record<TSidebarWorkspaceMenuItemKeys, E_FEATURE_FLAGS | undefined> = {
  projects: undefined,
  teams: E_FEATURE_FLAGS.TEAMS,
  "all-issues": undefined,
  "active-cycles": E_FEATURE_FLAGS.WORKSPACE_ACTIVE_CYCLES,
  analytics: undefined,
  initiatives: E_FEATURE_FLAGS.INITIATIVES,
};

export const isWorkspaceFeatureEnabled = (featureKey: TSidebarWorkspaceMenuItemKeys, workspaceSlug: string) => {
  // Check if we need to check for a feature flag, if not, return true
  const featureFlag = WorkspaceFeatureKeyToFeatureFlagMap[featureKey];
  if (!featureFlag) return true;
  // Check for the feature flag in the current workspace
  const isFeatureFlagEnabled = store.featureFlags.getFeatureFlagForCurrentWorkspace(featureFlag, false);

  switch (featureKey) {
    case "active-cycles":
      return isFeatureFlagEnabled && store.user.permission.workspaceUserInfo[workspaceSlug]?.active_cycles_count > 0;
    case "teams":
      return (
        isFeatureFlagEnabled && store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_TEAMS_ENABLED)
      );
    case "initiatives":
      return (
        isFeatureFlagEnabled &&
        store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_INITIATIVES_ENABLED)
      );
    default:
      return isFeatureFlagEnabled;
  }
};
