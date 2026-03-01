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
// plane imports
import { useTranslation } from "@plane/i18n";
import { Switch } from "@plane/propel/switch";
// components
import { SettingsControlItem } from "@/components/settings/control-item";
// hooks
import { useUserProfile } from "@/hooks/store/use-user-profile";
// local imports
import { ThemeSwitcher } from "./theme-switcher";

export const ProfileSettingsDefaultPreferencesList = observer(function ProfileSettingsDefaultPreferencesList() {
  // store hooks
  const {
    data: { is_smooth_cursor_enabled },
    updateUserProfile,
  } = useUserProfile();
  // translation
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-y-1">
      <ThemeSwitcher
        option={{
          id: "theme",
          title: "theme",
          description: "select_or_customize_your_interface_color_scheme",
        }}
      />
      <SettingsControlItem
        title={t("smooth_cursor")}
        description={t("select_the_cursor_motion_style_that_feels_right_for_you")}
        control={
          <Switch
            value={is_smooth_cursor_enabled}
            onChange={(value) => {
              updateUserProfile({ is_smooth_cursor_enabled: value });
            }}
            label="smooth-cursor-toggle"
          />
        }
      />
    </div>
  );
});
