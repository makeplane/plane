import { store } from "@/lib/store-context";
// plane web types
import { TSidebarUserMenuItemKeys } from "@/plane-web/types/dashboard";
// ee types
import { E_FEATURE_FLAGS } from "../hooks/store";

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
