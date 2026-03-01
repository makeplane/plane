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

import { useTheme } from "next-themes";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { CHART_COLOR_PALETTES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig, TWidgetChartColorScheme } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetConfigSelectButton } from "../../select-button";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function WidgetColorSchemeSelect(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();
  // next-themes
  const { resolvedTheme } = useTheme();

  return (
    <WidgetPropertyWrapper
      title={t("dashboards.widget.common.color_scheme.label")}
      input={
        <Controller
          control={control}
          name="config.color_scheme"
          render={({ field: { value, onChange } }) => {
            const selectedColorScheme = CHART_COLOR_PALETTES.find((p) => p.key === value);
            return (
              <CustomSelect
                customButton={
                  <WidgetConfigSelectButton
                    placeholder={t("dashboards.widget.common.color_scheme.placeholder")}
                    title={t(selectedColorScheme?.i18n_label ?? "")}
                    value={!!selectedColorScheme}
                  />
                }
                customButtonClassName="w-full"
                value={value}
                onChange={(val: TWidgetChartColorScheme) => {
                  onChange(val);
                  handleConfigUpdate({
                    color_scheme: val,
                  });
                }}
                optionsClassName="min-w-0"
              >
                {CHART_COLOR_PALETTES.map((palette) => (
                  <CustomSelect.Option key={palette.key} value={palette.key}>
                    <div className="flex items-center gap-2">
                      <p className="flex-shrink-0 w-24">{t(palette.i18n_label)}</p>
                      <div className="flex items-center gap-1">
                        {palette[resolvedTheme === "dark" ? "dark" : "light"].slice(0, 6).map((color) => (
                          <span
                            key={color}
                            className="flex-shrink-0 size-4 rounded"
                            style={{
                              backgroundColor: color,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </CustomSelect.Option>
                ))}
              </CustomSelect>
            );
          }}
        />
      }
    />
  );
}
