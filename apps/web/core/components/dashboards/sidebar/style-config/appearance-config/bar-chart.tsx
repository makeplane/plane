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
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { EWidgetChartModels } from "@plane/types";
// local components
import { WidgetColorPicker } from "./color-picker";
import { WidgetColorSchemeSelect } from "./color-scheme-select";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function BarChartAppearanceConfig(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartModel = watch("chart_model");
  const showCOlorPicker = selectedChartModel === EWidgetChartModels.BASIC;

  return (
    <>
      {showCOlorPicker ? (
        <Controller
          control={control}
          name="config.bar_color"
          render={({ field: { value, onChange } }) => (
            <WidgetColorPicker
              onChange={(val) => {
                onChange(val);
                handleConfigUpdate({ bar_color: val });
              }}
              title={t("dashboards.widget.chart_types.bar_chart.bar_color")}
              value={value}
            />
          )}
        />
      ) : (
        <WidgetColorSchemeSelect handleConfigUpdate={handleConfigUpdate} />
      )}
      {/* <WidgetPropertyWrapper
        title={t("dashboards.widget.chart_types.bar_chart.orientation.label")}
        input={
          <Controller
            control={control}
            name="config.orientation"
            render={({ field: { value, onChange } }) => {
              const selectedOrientation = BAR_CHART_ORIENTATIONS.find((p) => p.key === value);
              return (
                <CustomSelect
                  customButton={
                    <WidgetConfigSelectButton
                      placeholder={t("dashboards.widget.chart_types.bar_chart.orientation.placeholder")}
                      title={t(selectedOrientation?.i18n_label ?? "")}
                      value={!!selectedOrientation}
                    />
                  }
                  customButtonClassName="w-full"
                  value={value}
                  onChange={onChange}
                >
                  {BAR_CHART_ORIENTATIONS.map((orientation) => (
                    <CustomSelect.Option key={orientation.key} value={orientation.key}>
                      {t(orientation.i18n_label)}
                    </CustomSelect.Option>
                  ))}
                </CustomSelect>
              );
            }}
          />
        }
      /> */}
    </>
  );
}
