import { E_FEATURE_FLAGS } from "@plane/constants";
import { TRenderSettingsLink } from "@/ce/helpers/workspace.helper";
import { store } from "@/lib/store-context";

export const shouldRenderSettingLink: TRenderSettingsLink = (workspaceSlug, settingKey) => {
  const isApplicationsEnabled = store.featureFlags.getFeatureFlag(workspaceSlug, E_FEATURE_FLAGS.APPLICATIONS, false);
  switch (settingKey) {
    case "applications":
      return isApplicationsEnabled;
    default:
      return true;
  }
};
