import { E_FEATURE_FLAGS } from "@plane/constants";

import { useFlag } from "../hooks/store";
import { TRenderSettingsLink } from "@/ce/helpers/workspace.helper";

export const shouldRenderSettingLink: TRenderSettingsLink = (workspaceSlug, settingKey) => {
  const isApplicationsEnabled = useFlag(workspaceSlug?.toString(), E_FEATURE_FLAGS.APPLICATIONS);
  switch (settingKey) {
    case "applications":
      return isApplicationsEnabled;
    default:
      return true;
  }
};
