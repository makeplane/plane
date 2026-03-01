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

import { useCallback, useEffect } from "react";
import { debounce } from "lodash-es";
import { Controller, useFormContext } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { EWidgetChartModels } from "@plane/types";
import { Input } from "@plane/ui";
import { Switch } from "@plane/propel/switch";
// local components
import { WidgetPropertyWrapper } from "../../property-wrapper";
import { WidgetColorPicker } from "./color-picker";
import { WidgetColorSchemeSelect } from "./color-scheme-select";

type Props = {
  handleConfigUpdate: (data: Partial<TDashboardWidgetConfig>) => Promise<void>;
};

export function AreaChartAppearanceConfig(props: Props) {
  const { handleConfigUpdate } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedModel = watch("chart_model");

  const debouncedConfigUpdate = useCallback(
    // eslint-disable-next-line react-hooks/use-memo
    debounce((updateData: Partial<TDashboardWidgetConfig>) => {
      handleConfigUpdate(updateData);
    }, 500),
    [handleConfigUpdate]
  );

  useEffect(
    () => () => {
      debouncedConfigUpdate.cancel();
    },
    [debouncedConfigUpdate]
  );

  return (
    <>
      {selectedModel && [EWidgetChartModels.BASIC, EWidgetChartModels.COMPARISON].includes(selectedModel) && (
        <Controller
          control={control}
          name="config.fill_color"
          render={({ field: { value, onChange } }) => (
            <WidgetColorPicker
              onChange={(val) => {
                onChange(val);
                handleConfigUpdate({ fill_color: val });
              }}
              title={t("dashboards.widget.chart_types.area_chart.fill_color")}
              value={value}
            />
          )}
        />
      )}
      {selectedModel === EWidgetChartModels.STACKED && (
        <WidgetColorSchemeSelect handleConfigUpdate={handleConfigUpdate} />
      )}
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.opacity.label")}
        input={
          <Controller
            control={control}
            name="config.opacity"
            render={({ field: { value, onChange } }) => (
              <Input
                type="number"
                value={value ?? 0.6}
                onChange={(e) => {
                  onChange(e.target.value);
                  debouncedConfigUpdate({ opacity: Number(e.target.value) });
                }}
                className="hide-arrows w-full px-2 py-1 rounded-sm border-subtle-1 text-11"
                placeholder={t("dashboards.widget.common.opacity.placeholder")}
                min={0.1}
                max={1}
                step={0.1}
              />
            )}
          />
        }
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.border")}
        input={
          <Controller
            control={control}
            name="config.show_border"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <Switch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ show_border: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.smoothing")}
        input={
          <Controller
            control={control}
            name="config.smoothing"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <Switch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ smoothing: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.markers")}
        input={
          <Controller
            control={control}
            name="config.show_markers"
            render={({ field: { value, onChange } }) => (
              <div className="px-2">
                <Switch
                  value={!!value}
                  onChange={(val) => {
                    onChange(val);
                    handleConfigUpdate({ show_markers: val });
                  }}
                />
              </div>
            )}
          />
        }
      />
    </>
  );
}
