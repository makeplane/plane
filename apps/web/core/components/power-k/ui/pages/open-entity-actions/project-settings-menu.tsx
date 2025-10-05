"use client";

import { observer } from "mobx-react";
// plane types
import { EUserPermissionsLevel } from "@plane/constants";
// components
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

  return <PowerKSettingsMenu settings={settingsList} onSelect={(setting) => handleSelect(setting.href)} />;
});
