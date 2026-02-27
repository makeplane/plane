/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Basic settings: title, chart_property, chart_metric.
 * Field names match backend AnalyticsDashboardWidget model.
 */

import { observer } from "mobx-react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { Input } from "@plane/propel/input";
import { CustomSelect } from "@plane/ui";
import { ANALYTICS_CHART_PROPERTY_OPTIONS, ANALYTICS_CHART_METRIC_OPTIONS } from "@plane/constants";

interface BasicSettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
}

export const BasicSettingsSection = observer(({ control, errors }: BasicSettingsSectionProps) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {/* Widget Title */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-color-secondary">
          {t("analytics_dashboard.widget_name")} <span className="text-color-danger-primary">*</span>
        </label>
        <Controller
          name="title"
          control={control}
          rules={{ required: t("analytics_dashboard.name_required") }}
          render={({ field }) => (
            <Input
              id="title"
              {...field}
              placeholder={t("analytics_dashboard.widget_name_placeholder")}
              hasError={!!errors.title}
              className="w-full"
            />
          )}
        />
        {errors.title && <p className="mt-1 text-xs text-color-danger-primary">{errors.title.message as string}</p>}
      </div>

      {/* Chart Property (X-Axis) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-color-secondary">
          {t("analytics_dashboard.property_x_axis")} <span className="text-color-danger-primary">*</span>
        </label>
        <Controller
          name="chart_property"
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

      {/* Chart Metric (Y-Axis) */}
      <div>
        <label className="mb-1 block text-sm font-medium text-color-secondary">
          {t("analytics_dashboard.metric_y_axis")} <span className="text-color-danger-primary">*</span>
        </label>
        <Controller
          name="chart_metric"
          control={control}
          rules={{ required: t("analytics_dashboard.metric_required") }}
          render={({ field }) => (
            <CustomSelect
              value={field.value as string}
              onChange={(val: string) => field.onChange(val)}
              label={
                ANALYTICS_CHART_METRIC_OPTIONS.find((o) => o.key === field.value)?.label ||
                t("analytics_dashboard.select_metric")
              }
              input
            >
              {ANALYTICS_CHART_METRIC_OPTIONS.map((opt) => (
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
