/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
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
  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-secondary">
          Widget Title <span className="text-red-500">*</span>
        </label>
        <Controller
          name="title"
          control={control}
          rules={{ required: "Title is required" }}
          render={({ field }) => (
            <Input
              id="title"
              {...field}
              placeholder="Issues by Priority"
              hasError={!!errors.title}
              className="w-full"
            />
          )}
        />
        {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message as string}</p>}
      </div>

      {/* Property (X-Axis) */}
      <div>
        <label htmlFor="chart_property" className="mb-1 block text-sm font-medium text-secondary">
          Property (X-Axis) <span className="text-red-500">*</span>
        </label>
        <Controller
          name="chart_property"
          control={control}
          rules={{ required: "Property is required" }}
          render={({ field }) => (
            <CustomSelect
              value={field.value as string}
              onChange={(val: string) => field.onChange(val)}
              label={
                ANALYTICS_CHART_PROPERTY_OPTIONS.find((o) => o.key === (field.value as string))?.label ||
                "Select property"
              }
              input
              buttonClassName={errors.chart_property ? "border-red-500" : ""}
            >
              {ANALYTICS_CHART_PROPERTY_OPTIONS.map((option) => (
                <CustomSelect.Option key={option.key} value={option.key}>
                  {option.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
        {errors.chart_property && (
          <p id="chart-property-error" className="mt-1 text-xs text-red-500">
            {errors.chart_property.message as string}
          </p>
        )}
      </div>

      {/* Metric (Y-Axis) */}
      <div>
        <label htmlFor="chart_metric" className="mb-1 block text-sm font-medium text-secondary">
          Metric (Y-Axis) <span className="text-red-500">*</span>
        </label>
        <Controller
          name="chart_metric"
          control={control}
          rules={{ required: "Metric is required" }}
          render={({ field }) => (
            <CustomSelect
              value={field.value as string}
              onChange={(val: string) => field.onChange(val)}
              label={
                ANALYTICS_CHART_METRIC_OPTIONS.find((o) => o.key === (field.value as string))?.label || "Select metric"
              }
              input
              buttonClassName={errors.chart_metric ? "border-red-500" : ""}
            >
              {ANALYTICS_CHART_METRIC_OPTIONS.map((option) => (
                <CustomSelect.Option key={option.key} value={option.key}>
                  {option.label}
                </CustomSelect.Option>
              ))}
            </CustomSelect>
          )}
        />
        {errors.chart_metric && (
          <p id="chart-metric-error" className="mt-1 text-xs text-red-500">
            {errors.chart_metric.message as string}
          </p>
        )}
      </div>
    </div>
  );
});
