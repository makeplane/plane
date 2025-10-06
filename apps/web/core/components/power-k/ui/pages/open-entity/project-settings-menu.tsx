"use client";

import { observer } from "mobx-react";
// plane types
import { EUserPermissionsLevel } from "@plane/constants";
// components
import { useTranslation } from "@plane/i18n";
import { TPowerKContext } from "@/components/power-k/core/types";
import { PowerKSettingsMenu } from "@/components/power-k/menus/settings";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { PROJECT_SETTINGS } from "@/plane-web/constants/project";

type Props = {
  context: TPowerKContext;
  handleSelect: (href: string) => void;
};

export const PowerKOpenProjectSettingsMenu: React.FC<Props> = observer((props) => {
  const { context, handleSelect } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const settingsList = Object.values(PROJECT_SETTINGS).filter(
    (setting) =>
      context.params.workspaceSlug &&
      context.params.projectId &&
      allowPermissions(
        setting.access,
        EUserPermissionsLevel.PROJECT,
        context.params.workspaceSlug?.toString(),
        context.params.projectId?.toString()
      )
  );
  const settingsListWithIcons = settingsList.map((setting) => ({
    ...setting,
    label: t(setting.i18n_label),
    icon: setting.Icon,
  }));

  return <PowerKSettingsMenu settings={settingsListWithIcons} onSelect={(setting) => handleSelect(setting.href)} />;
});
