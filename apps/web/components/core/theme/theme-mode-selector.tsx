/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
// plane imports
import type { IUserTheme } from "@plane/types";

type Props = {
  control: Control<IUserTheme>;
};

export const CustomThemeModeSelector = observer(function CustomThemeModeSelector(props: Props) {
  const { t } = useTranslation();

  const { control } = props;

  return (
    <div>
      <h6 className="text-h6-medium">
        {t("web_ui.choose_color_mode")}
        <span className="text-danger-primary">*</span>
      </h6>
      <Controller
        control={control}
        name="darkPalette"
        render={({ field: { value, onChange } }) => (
          <div className="mt-2 flex items-center gap-3">
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-subtle-1 bg-layer-2 px-3 py-2 text-body-sm-regular transition-colors hover:bg-layer-2-hover">
              <input
                type="radio"
                name="darkPalette"
                value="false"
                checked={value === false}
                onChange={() => onChange(false)}
                className="cursor-pointer"
              />
              {t("web_ui.light_mode")}{" "}
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-subtle-1 bg-layer-2 px-3 py-2 text-body-sm-regular transition-colors hover:bg-layer-2-hover">
              <input
                type="radio"
                name="darkPalette"
                value="true"
                checked={value === true}
                onChange={() => onChange(true)}
                className="cursor-pointer"
              />
              {t("web_ui.dark_mode")}{" "}
            </label>
          </div>
        )}
      />
    </div>
  );
});
