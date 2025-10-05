"use client";

import { observer } from "mobx-react";
// plane types
import { EUserPermissionsLevel, WORKSPACE_SETTINGS } from "@plane/constants";
// components
import { TPowerKContext } from "@/components/power-k/core/types";
import { PowerKSettingsMenu } from "@/components/power-k/menus/settings";
// hooks
import { useUserPermissions } from "@/hooks/store/user";
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

type Props = {
  context: TPowerKContext;
  handleSelect: (href: string) => void;
};

export const PowerKOpenWorkspaceSettingsMenu: React.FC<Props> = observer((props) => {
  const { context, handleSelect } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const settingsList = Object.values(WORKSPACE_SETTINGS).filter(
    (setting) =>
      context.params.workspaceSlug &&
      shouldRenderSettingLink(context.params.workspaceSlug?.toString(), setting.key) &&
      allowPermissions(setting.access, EUserPermissionsLevel.WORKSPACE, context.params.workspaceSlug?.toString())
  );

  return <PowerKSettingsMenu settings={settingsList} onSelect={(setting) => handleSelect(setting.href)} />;
});
