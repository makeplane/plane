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
import { PIE_CHART_VALUE_TYPE } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig, TWidgetPieChartValuesType } from "@plane/types";
import { CustomSelect } from "@plane/ui";
import { Switch } from "@plane/propel/switch";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetConfigSelectButton } from "../../select-button";
import { WidgetColorSchemeSelect } from "./color-scheme-select";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function PieChartAppearanceConfig(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const isShowValuesEnabled = !!watch("config.show_values");

  return (
    <>
      <WidgetPropertyWrapper
        title={t("dashboards.widget.chart_types.pie_chart.show_values")}
        input={
          <div className="flex items-center gap-3">
            <Controller
              control={control}
              name="config.show_values"
              render={({ field: { value, onChange } }) => (
                <div className="flex-shrink-0 px-2">
                  <Switch
                    value={!!value}
                    onChange={(val) => {
                      onChange(val);
                      handleConfigUpdate({ show_values: val });
                    }}
                  />
                </div>
              )}
            />
            {isShowValuesEnabled && (
              <>
                <span className="flex-shrink-0">as</span>
                <Controller
                  control={control}
                  name="config.value_type"
                  render={({ field: { value, onChange } }) => {
                    const selectedValueType = PIE_CHART_VALUE_TYPE.find((t) => t.key === value);
                    return (
                      <CustomSelect
                        className="flex-grow"
                        customButton={
                          <WidgetConfigSelectButton
                            placeholder={t("chart.metric")}
                            title={t(selectedValueType?.i18n_label ?? "")}
                            value={!!selectedValueType}
                          />
                        }
                        customButtonClassName="w-full"
                        value={value}
                        onChange={(val: TWidgetPieChartValuesType) => {
                          onChange(val);
                          handleConfigUpdate({ value_type: val });
                        }}
                      >
                        {PIE_CHART_VALUE_TYPE.map((type) => (
                          <CustomSelect.Option key={type.key} value={type.key}>
                            {t(type.i18n_label)}
                          </CustomSelect.Option>
                        ))}
                      </CustomSelect>
                    );
                  }}
                />
              </>
            )}
          </div>
        }
      />
      <WidgetColorSchemeSelect handleConfigUpdate={handleConfigUpdate} />
    </>
  );
}
