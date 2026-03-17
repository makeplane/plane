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

import { useCallback } from "react";
import { Controller, useFormContext } from "react-hook-form";
// plane ui
import { WIDGET_X_AXIS_DATE_PROPERTIES } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { EWidgetXAxisProperty, TDashboardWidget } from "@plane/types";
import { EWidgetChartTypes } from "@plane/types";
// local components
import { WidgetDateGroupSelect } from "./date-group-select";
import { WidgetPropertySelect } from "./property-select";

type Props = {
  handleSubmit: (data: Partial<TDashboardWidget>) => Promise<void>;
};

/** When updating one axis property, avoid duplicate with the other; returns payload and whether to clear the other field. */
function getAxisMutualExclusionPayload(
  field: "x_axis_property" | "group_by",
  newValue: EWidgetXAxisProperty | null,
  otherFieldValue: EWidgetXAxisProperty | null
): { payload: Partial<TDashboardWidget>; clearOther: boolean } {
  const clearOther = newValue != null && newValue === otherFieldValue;
  if (field === "x_axis_property") {
    return {
      payload: { x_axis_property: newValue, ...(clearOther && { group_by: null }) },
      clearOther,
    };
  }
  return {
    payload: { group_by: newValue, ...(clearOther && { x_axis_property: null }) },
    clearOther,
  };
}

export function WidgetConfigSidebarXAxisConfig(props: Props) {
  const { handleSubmit } = props;
  const { t } = useTranslation();
  const { control, watch, setValue } = useFormContext<TDashboardWidget>();

  const selectedChartType = watch("chart_type");
  const selectedXAxisProperty = watch("x_axis_property");
  const selectedGroupByProperty = watch("group_by");

  const isTableChart = selectedChartType === EWidgetChartTypes.TABLE_CHART;
  const isDateGroupingEnabled =
    selectedXAxisProperty != null && WIDGET_X_AXIS_DATE_PROPERTIES.includes(selectedXAxisProperty);

  const handleXAxisPropertyChange = useCallback(
    (val: EWidgetXAxisProperty | null, onChange: (val: EWidgetXAxisProperty | null) => void) => {
      const { payload, clearOther } = getAxisMutualExclusionPayload(
        "x_axis_property",
        val,
        selectedGroupByProperty ?? null
      );
      onChange(val);
      if (clearOther) setValue("group_by", null);
      void handleSubmit(payload);
    },
    [selectedGroupByProperty, setValue, handleSubmit]
  );

  const handleGroupByChange = useCallback(
    (val: EWidgetXAxisProperty | null, onChange: (val: EWidgetXAxisProperty | null) => void) => {
      const { payload, clearOther } = getAxisMutualExclusionPayload("group_by", val, selectedXAxisProperty ?? null);
      onChange(val);
      if (clearOther) setValue("x_axis_property", null);
      void handleSubmit(payload);
    },
    [selectedXAxisProperty, setValue, handleSubmit]
  );

  return (
    <div className="flex-shrink-0 space-y-1 text-13">
      <Controller
        control={control}
        name="x_axis_property"
        render={({ field: { value, onChange } }) => (
          <WidgetPropertySelect
            onChange={(val) => handleXAxisPropertyChange(val, onChange)}
            placeholder={t("dashboards.widget.common.add_property")}
            title={isTableChart ? t("dashboards.widget.chart_types.table_chart.columns") : t("chart.x_axis")}
            value={value}
          />
        )}
      />
      {isDateGroupingEnabled && (
        <Controller
          control={control}
          name="x_axis_date_grouping"
          render={({ field: { onChange, value } }) => (
            <WidgetDateGroupSelect
              onChange={(val) => {
                onChange(val);
                void handleSubmit({ x_axis_date_grouping: val });
              }}
              placeholder={t("dashboards.widget.common.date_group.placeholder")}
              title={t("dashboards.widget.common.date_group.label")}
              value={value}
            />
          )}
        />
      )}
      {isTableChart && (
        <Controller
          control={control}
          name="group_by"
          render={({ field: { value, onChange } }) => (
            <WidgetPropertySelect
              onChange={(val) => handleGroupByChange(val, onChange)}
              placeholder={t("dashboards.widget.chart_types.table_chart.rows_placeholder")}
              title={t("dashboards.widget.chart_types.table_chart.rows")}
              value={value}
            />
          )}
        />
      )}
    </div>
  );
}
