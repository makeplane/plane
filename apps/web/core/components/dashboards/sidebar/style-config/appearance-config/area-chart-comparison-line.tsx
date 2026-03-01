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

import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { LINE_CHART_LINE_TYPES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
// local components
import { WidgetColorPicker } from "./color-picker";
import { WidgetLineTypeSelect } from "./line-type-select";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function AreaChartComparisonLineAppearanceConfig(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control } = useFormContext<TDashboardWidget>();

  return (
    <div className="flex-shrink-0 space-y-1 text-13">
      <h6 className="font-medium text-secondary">{t("dashboards.widget.common.comparison_line_appearance")}</h6>
      <Controller
        control={control}
        name="config.line_color"
        render={({ field: { value, onChange } }) => (
          <WidgetColorPicker
            onChange={(val) => {
              onChange(val);
              handleConfigUpdate({ line_color: val });
            }}
            title={t("dashboards.widget.chart_types.line_chart.line_color")}
            value={value}
          />
        )}
      />
      <Controller
        control={control}
        name="config.line_type"
        render={({ field: { value, onChange } }) => {
          const selectedColorScheme = LINE_CHART_LINE_TYPES.find((p) => p.key === value);
          return (
            <WidgetLineTypeSelect
              value={selectedColorScheme?.key}
              onChange={(val) => {
                onChange(val);
                handleConfigUpdate({ line_type: val });
              }}
            />
          );
        }}
      />
    </div>
  );
}
