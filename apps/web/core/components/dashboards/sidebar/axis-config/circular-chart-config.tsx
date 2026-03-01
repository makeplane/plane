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
// plane ui
import { CHART_WIDGETS_Y_AXIS_METRICS_LIST, WIDGET_X_AXIS_DATE_PROPERTIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EWidgetYAxisMetric, TDashboardWidget } from "@plane/types";
import { EWidgetChartModels, EWidgetChartTypes } from "@plane/types";
// local components
import { WidgetDateGroupSelect } from "./date-group-select";
import { WidgetMetricSelect } from "./metric-select";
import { WidgetPropertySelect } from "./property-select";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

export function WidgetConfigSidebarCircularChartConfig(props: Props) {
  const { handleSubmit } = props;
  // translation
  const { t } = useTranslation();
  // form info
  const { control, watch } = useFormContext<TDashboardWidget>();
  // derived values
  const selectedChartType = watch("chart_type");
  const selectedChartModel = watch("chart_model");
  const selectedXAxisProperty = watch("x_axis_property");
  const isDateGroupingEnabled =
    !!selectedXAxisProperty && WIDGET_X_AXIS_DATE_PROPERTIES.includes(selectedXAxisProperty);
  const isPropertySelectEnabled = !(
    selectedChartType === EWidgetChartTypes.DONUT_CHART && selectedChartModel === EWidgetChartModels.PROGRESS
  );

  return (
    <div className="flex-shrink-0 space-y-1 text-13">
      {isPropertySelectEnabled && (
        <Controller
          control={control}
          name="x_axis_property"
          render={({ field: { value, onChange } }) => (
            <WidgetPropertySelect
              onChange={(val) => {
                onChange(val);
                handleSubmit({ x_axis_property: val });
              }}
              placeholder={t("dashboards.widget.common.add_property")}
              title={t("common.property")}
              value={value}
            />
          )}
        />
      )}
      {isDateGroupingEnabled && (
        <Controller
          control={control}
          name="x_axis_date_grouping"
          render={({ field: { onChange, value } }) => (
            <WidgetDateGroupSelect
              onChange={(val) => {
                onChange(val);
                handleSubmit({ x_axis_date_grouping: val });
              }}
              placeholder={t("dashboards.widget.common.date_group.placeholder")}
              title={t("dashboards.widget.common.date_group.label")}
              value={value}
            />
          )}
        />
      )}
      <Controller
        control={control}
        name="y_axis_metric"
        render={({ field: { value, onChange } }) => (
          <WidgetMetricSelect
            onChange={(val: EWidgetYAxisMetric) => {
              onChange(val);
              handleSubmit({ y_axis_metric: val });
            }}
            options={CHART_WIDGETS_Y_AXIS_METRICS_LIST}
            placeholder={t("dashboards.widget.common.add_metric")}
            title={t("chart.metric")}
            value={value}
          />
        )}
      />
    </div>
  );
}
