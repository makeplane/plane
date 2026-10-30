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
import { InputColorPicker } from "./input-color-picker";

const handleValueChange = (val: string | undefined, onChange: (...args: unknown[]) => void) => {
  let hex = val;
  // prepend a hashtag if it doesn't exist
  if (val && val[0] !== "#") hex = `#${val}`;
  onChange(hex);
};

type Props = {
  control: Control<IUserTheme>;
};

export const CustomThemeColorInputs = observer(function CustomThemeColorInputs(props: Props) {
  const { t } = useTranslation();

  const { control } = props;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {/* Neutral Color */}
      <div className="flex flex-col gap-2">
        <h3 className="text-body-sm-medium">
          {t("web_ui.neutral_color")}
          <span className="text-danger-primary">*</span>
        </h3>
        <div className="w-full">
          <Controller
            control={control}
            name="background"
            rules={{
              required: t("web_ui.neutral_color_is_required"),
              pattern: {
                value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                message: t("web_ui.enter_a_valid_hex_code"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <InputColorPicker
                name="background"
                value={value}
                onChange={(val) => handleValueChange(val, onChange)}
                placeholder="#1a1a1a"
                className="w-full placeholder:text-placeholder"
                style={{
                  backgroundColor: value,
                  color: "#ffffff",
                }}
                hasError={false}
              />
            )}
          />
        </div>
      </div>
      {/* Brand Color */}
      <div className="flex flex-col gap-2">
        <h3 className="text-body-sm-medium">
          {t("web_ui.brand_color")}
          <span className="text-danger-primary">*</span>
        </h3>
        <div className="w-full">
          <Controller
            control={control}
            name="primary"
            rules={{
              required: t("web_ui.brand_color_is_required"),
              pattern: {
                value: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
                message: t("web_ui.enter_a_valid_hex_code"),
              },
            }}
            render={({ field: { value, onChange } }) => (
              <InputColorPicker
                name="primary"
                value={value}
                onChange={(val) => handleValueChange(val, onChange)}
                placeholder="#3f76ff"
                className="w-full placeholder:text-placeholder"
                style={{
                  backgroundColor: value,
                  color: "#ffffff",
                }}
                hasError={false}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
});
