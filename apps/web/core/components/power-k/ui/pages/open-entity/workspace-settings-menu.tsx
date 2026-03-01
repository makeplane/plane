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

import { observer } from "mobx-react";
// plane types
import { EUserPermissionsLevel, WORKSPACE_SETTINGS } from "@plane/constants";
// components
import { useTranslation } from "@plane/i18n";
import type { TPowerKContext } from "@/components/power-k/core/types";
import { PowerKSettingsMenu } from "@/components/power-k/menus/settings";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";
// helpers
import { shouldRenderSettingLink } from "@/helpers/settings/workspace";
// hooks
import { useUserPermissions } from "@/hooks/store/user";

type Props = {
  context: TPowerKContext;
  handleSelect: (href: string) => void;
};

export const PowerKOpenWorkspaceSettingsMenu = observer(function PowerKOpenWorkspaceSettingsMenu(props: Props) {
  const { context, handleSelect } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const settingsList = Object.values(WORKSPACE_SETTINGS).filter(
    (setting) =>
      context.params.workspaceSlug &&
      shouldRenderSettingLink(context.params.workspaceSlug?.toString(), setting.key) &&
      allowPermissions(setting.access, EUserPermissionsLevel.WORKSPACE, context.params.workspaceSlug?.toString())
  );
  const settingsListWithIcons = settingsList.map((setting) => ({
    ...setting,
    label: t(setting.i18n_label),
    icon: WORKSPACE_SETTINGS_ICONS[setting.key],
  }));

  return <PowerKSettingsMenu settings={settingsListWithIcons} onSelect={(setting) => handleSelect(setting.href)} />;
});
