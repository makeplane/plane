import { E_FEATURE_FLAGS } from "@plane/constants";
import { TRenderSettingsLink } from "@/ce/helpers/workspace.helper";
import { store } from "@/lib/store-context";

export const shouldRenderSettingLink: TRenderSettingsLink = (workspaceSlug, settingKey) => {
  const isApplicationsEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.APPLICATIONS, false);
  const isPiChatEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.PI_CHAT, false);
  const isEditorOPSEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.EDITOR_AI_OPS, false);
  const isPiDedupeEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.PI_DEDUPE, false);
  switch (settingKey) {
    case "applications":
      return isApplicationsEnabled;
    case "plane-intelligence":
      return isPiChatEnabled || isEditorOPSEnabled || isPiDedupeEnabled;
    default:
      return true;
  }
};
