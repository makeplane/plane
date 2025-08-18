import { E_FEATURE_FLAGS } from "@plane/constants";
// store
import { store } from "@/lib/store-context";
import { EWorkspaceFeatures } from "@/plane-web/types/workspace-feature";

const SidebarFeatureKeyToFeatureFlagMap: Record<string, E_FEATURE_FLAGS | undefined> = {
  home: undefined,
  wiki: E_FEATURE_FLAGS.WORKSPACE_PAGES,
  "pi-chat": E_FEATURE_FLAGS.PI_CHAT,
};

export const isAppRailFeatureEnabled = (featureKey: string) => {
  // Check if we need to check for a feature flag, if not, return true
  const featureFlag = SidebarFeatureKeyToFeatureFlagMap[featureKey];
  if (!featureFlag) return true;
  // Check for the feature flag in the current workspace
  const isFeatureFlagEnabled = store.featureFlags.getFeatureFlagForCurrentWorkspace(featureFlag, false);

  switch (featureKey) {
    case "pi-chat":
      return (
        isFeatureFlagEnabled && store.workspaceFeatures.isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PI_ENABLED)
      );
    default:
      return isFeatureFlagEnabled;
  }
};
