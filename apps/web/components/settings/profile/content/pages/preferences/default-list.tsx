/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
// components
import { ThemeSwitcher } from "@/components/appearance";

export const ProfileSettingsDefaultPreferencesList = observer(function ProfileSettingsDefaultPreferencesList() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-y-1">
      <ThemeSwitcher
        option={{
          id: "theme",
          title: t("theme"),
          description: "select_or_customize_your_interface_color_scheme",
        }}
      />
    </div>
  );
});
