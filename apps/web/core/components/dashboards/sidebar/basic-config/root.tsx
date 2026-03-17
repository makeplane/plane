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
import {
  CHART_WIDGETS_Y_AXIS_METRICS_LIST,
  DEFAULT_WIDGET_CHART_TYPE_PAYLOAD,
  NUMBER_WIDGET_Y_AXIS_METRICS_LIST,
} from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TDashboardWidget, TDashboardWidgetConfig } from "@plane/types";
import { EWidgetChartModels, EWidgetChartTypes, EWidgetXAxisProperty, EWidgetYAxisMetric } from "@plane/types";
// local components
import { WidgetChartTypeIcon } from "../../widgets";
import { DashboardWidgetChartTypesDropdown } from "../../widgets/dropdown";
import { WidgetPropertyWrapper } from "../property-wrapper";
import { WidgetConfigSidebarTitle } from "./title";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export function WidgetConfigSidebarBasicConfig(props: Props) {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, getValues, setValue, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const selectedChartModel = watch("chart_model");
  const selectedTypeLabel = t(
    `dashboards.widget.chart_types.${selectedChartType?.toLowerCase()}.chart_models.${selectedChartModel?.toLowerCase()}.long_label`
  );

  // update other form values to the default ones when chart type changes
  const getUpdatedConfig = useCallback(
    (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
      const chartTypeDefaultDetails = DEFAULT_WIDGET_CHART_TYPE_PAYLOAD[chartType];
      const defaultModelPayload = chartTypeDefaultDetails[chartModel];
      if (!defaultModelPayload) return;
      const currentConfig = getValues("config") ?? {};
      defaultModelPayload.config = {
        ...chartTypeDefaultDetails.config,
        ...defaultModelPayload.config,
      };
      const defaultConfig = defaultModelPayload.config;
      const updatedConfig = Object.keys(defaultConfig).reduce<Partial<TDashboardWidgetConfig>>(
        (acc, key) => {
          const configKey = key as keyof TDashboardWidgetConfig;
          if (!acc) acc = {};
          acc[configKey] = configKey in currentConfig ? currentConfig[configKey] : defaultConfig[configKey];
          return acc;
        },
        { ...defaultConfig }
      );
      return updatedConfig;
    },
    [getValues]
  );

  const getYAxisMetricForChartType = useCallback(
    (chartType: EWidgetChartTypes): EWidgetYAxisMetric | undefined => {
      if (chartType === EWidgetChartTypes.TABLE_CHART) {
        return EWidgetYAxisMetric.WORK_ITEM_COUNT;
      }
      const current = getValues("y_axis_metric");
      if (current == null) return undefined;
      if (chartType === EWidgetChartTypes.NUMBER) {
        return NUMBER_WIDGET_Y_AXIS_METRICS_LIST.includes(current) ? current : NUMBER_WIDGET_Y_AXIS_METRICS_LIST[0];
      }
      return CHART_WIDGETS_Y_AXIS_METRICS_LIST.includes(current) ? current : CHART_WIDGETS_Y_AXIS_METRICS_LIST[0];
    },
    [getValues]
  );

  const handleChartTypeChange = useCallback(
    async (chartType: EWidgetChartTypes, chartModel: EWidgetChartModels) => {
      const updatedConfig = getUpdatedConfig(chartType, chartModel);
      const payload: Partial<TDashboardWidget> = {
        chart_type: chartType,
        chart_model: chartModel,
        config: updatedConfig,
      };

      const yAxisMetric = getYAxisMetricForChartType(chartType);
      if (yAxisMetric != null) payload.y_axis_metric = yAxisMetric;

      if (chartModel === EWidgetChartModels.BASIC && chartType !== EWidgetChartTypes.TABLE_CHART) {
        payload.group_by = null;
      }
      if (chartType === EWidgetChartTypes.DONUT_CHART && chartModel === EWidgetChartModels.PROGRESS) {
        payload.x_axis_property = EWidgetXAxisProperty.STATE_GROUPS;
      }
      if (chartType === EWidgetChartTypes.TABLE_CHART && !getValues("x_axis_property")) {
        payload.x_axis_property = EWidgetXAxisProperty.STATES;
      }

      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined) setValue(key as keyof TDashboardWidget, value);
      }
      await handleSubmit(payload);
    },
    [getUpdatedConfig, handleSubmit]
  );

  // oxlint-disable-next-line react-hooks/exhaustive-deps
  const debouncedHandleSubmit = useCallback(
    debounce((data: Partial<TDashboardWidget>) => {
      handleSubmit(data);
    }, 500),
    [handleSubmit]
  );

  // Clean up the debounced function on unmount
  useEffect(
    () => () => {
      debouncedHandleSubmit.cancel();
    },
    [debouncedHandleSubmit]
  );

  return (
    <div className="flex-shrink-0 space-y-3 text-13">
      <Controller
        control={control}
        name="name"
        render={({ field: { onChange, value } }) => (
          <WidgetConfigSidebarTitle
            onChange={(val) => {
              onChange(val);
              if (!val || val.trim().length === 0) return;
              debouncedHandleSubmit({ name: val });
            }}
            value={value}
          />
        )}
      />
      <WidgetPropertyWrapper
        title={t("dashboards.widget.common.widget_type")}
        input={
          <DashboardWidgetChartTypesDropdown
            buttonClassName="py-0"
            buttonContent={
              <>
                {selectedChartModel && selectedChartType && (
                  <span className="flex-shrink-0 h-6 aspect-square bg-layer-1 rounded-sm grid place-items-center">
                    <WidgetChartTypeIcon
                      chartModel={selectedChartModel}
                      chartType={selectedChartType}
                      className="size-4 text-tertiary"
                    />
                  </span>
                )}
                {selectedTypeLabel}
              </>
            }
            onSelect={(val) => {
              handleChartTypeChange(val.chartType, val.chartModel);
            }}
            placement="bottom-end"
            selectedChartModel={selectedChartModel}
            selectedChartType={selectedChartType}
          />
        }
      />
    </div>
  );
}
