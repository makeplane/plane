/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Basic settings: name, x_axis_property, y_axis_metric, chart_model, group_by.
 * Field names match backend DashboardWidget model.
 */

import { observer } from "mobx-react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/propel/input";
import { CustomSelect } from "@plane/ui";
import {
  ANALYTICS_CHART_PROPERTY_OPTIONS,
  ANALYTICS_CHART_METRIC_OPTIONS,
  ANALYTICS_NUMBER_METRIC_OPTIONS,
} from "@plane/constants";

interface BasicSettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
  chartType?: string;
}

export const BasicSettingsSection = observer(({ control, errors, chartType }: BasicSettingsSectionProps) => {
  // NUMBER widgets support all 8 metrics; other chart types use the 2 standard metrics
  const metricOptions = chartType === "number" ? ANALYTICS_NUMBER_METRIC_OPTIONS : ANALYTICS_CHART_METRIC_OPTIONS;
  const { t } = useTranslation();

  const chartModelOptions = [
    { key: "BASIC", label: t("analytics_dashboard.chart_model_basic") },
    { key: "GROUPED", label: t("analytics_dashboard.chart_model_grouped") },
  ];

  return (
    <div className="space-y-4">
      {/* Widget Name */}
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-secondary">
          {t("analytics_dashboard.widget_name")} <span className="text-danger-primary">*</span>
        </label>
        <Controller
          name="name"
          control={control}
          rules={{ required: t("analytics_dashboard.name_required") }}
          render={({ field }) => (
            <Input
              id="name"
              {...field}
              placeholder={t("analytics_dashboard.widget_name_placeholder")}
              hasError={!!errors.name}
              className="w-full"
            />
          )}
        />
        {errors.name && <p className="mt-1 text-xs text-danger-primary">{errors.name.message as string}</p>}
      </div>

      {/* X-Axis Property */}
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t("analytics_dashboard.property_x_axis")} <span className="text-danger-primary">*</span>
        </label>
        <Controller
          name="x_axis_property"
          control={control}
          rules={{ required: t("analytics_dashboard.property_required") }}
          render={({ field }) => (
            <CustomSelect
              value={field.value as string}
              onChange={(val: string) => field.onChange(val)}
              label={
                ANALYTICS_CHART_PROPERTY_OPTIONS.find((o) => o.key === field.value)?.label ||
                t("analytics_dashboard.select_property")
              }
              input
            >
              {ANALYTICS_CHART_PROPERTY_OPTIONS.map((opt) => (
                <CustomSelect.Option key={opt.key} value={opt.key}>
                  {opt.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>

      {/* Y-Axis Metric */}
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t("analytics_dashboard.metric_y_axis")} <span className="text-danger-primary">*</span>
        </label>
        <Controller
          name="y_axis_metric"
          control={control}
          rules={{ required: t("analytics_dashboard.metric_required") }}
          render={({ field }) => (
            <CustomSelect
              value={field.value as string}
              onChange={(val: string) => field.onChange(val)}
              label={metricOptions.find((o) => o.key === field.value)?.label || t("analytics_dashboard.select_metric")}
              input
            >
              {metricOptions.map((opt) => (
                <CustomSelect.Option key={opt.key} value={opt.key}>
                  {opt.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>

      {/* Chart Model */}
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">{t("analytics_dashboard.chart_model")}</label>
        <Controller
          name="chart_model"
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={field.value as string}
              onChange={(val: string) => field.onChange(val)}
              label={
                chartModelOptions.find((o) => o.key === field.value)?.label ||
                t("analytics_dashboard.chart_model_basic")
              }
              input
            >
              {chartModelOptions.map((opt) => (
                <CustomSelect.Option key={opt.key} value={opt.key}>
                  {opt.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>

      {/* Group By (optional, only relevant for GROUPED model) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-secondary">
          {t("analytics_dashboard.group_by_optional")}
        </label>
        <Controller
          name="group_by"
          control={control}
          render={({ field }) => (
            <CustomSelect
              value={field.value as string}
              onChange={(val: string) => field.onChange(val)}
              label={
                ANALYTICS_CHART_PROPERTY_OPTIONS.find((o) => o.key === field.value)?.label ||
                t("analytics_dashboard.none")
              }
              input
            >
              <CustomSelect.Option value="">{t("analytics_dashboard.none")}</CustomSelect.Option>
              {ANALYTICS_CHART_PROPERTY_OPTIONS.map((opt) => (
                <CustomSelect.Option key={opt.key} value={opt.key}>
                  {opt.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
      </div>
    </div>
  );
});
