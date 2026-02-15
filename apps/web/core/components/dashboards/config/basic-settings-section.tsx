/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller } from "react-hook-form";
import type { Control, FieldErrors } from "react-hook-form";
import { Input } from "@plane/ui";
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
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-custom-text-200">
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
        <label htmlFor="chart_property" className="mb-1 block text-sm font-medium text-custom-text-200">
          Property (X-Axis) <span className="text-red-500">*</span>
        </label>
        <Controller
          name="chart_property"
          control={control}
          rules={{ required: "Property is required" }}
          render={({ field }) => (
            <select
              id="chart_property"
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              aria-invalid={!!errors.chart_property}
              aria-describedby={errors.chart_property ? "chart-property-error" : undefined}
              className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 outline-none focus:border-custom-primary-100 focus:ring-1 focus:ring-custom-primary-100"
            >
              <option value="" disabled>
                Select property
              </option>
              {ANALYTICS_CHART_PROPERTY_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
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
        <label htmlFor="chart_metric" className="mb-1 block text-sm font-medium text-custom-text-200">
          Metric (Y-Axis) <span className="text-red-500">*</span>
        </label>
        <Controller
          name="chart_metric"
          control={control}
          rules={{ required: "Metric is required" }}
          render={({ field }) => (
            <select
              id="chart_metric"
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              aria-invalid={!!errors.chart_metric}
              aria-describedby={errors.chart_metric ? "chart-metric-error" : undefined}
              className="w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100 outline-none focus:border-custom-primary-100 focus:ring-1 focus:ring-custom-primary-100"
            >
              <option value="" disabled>
                Select metric
              </option>
              {ANALYTICS_CHART_METRIC_OPTIONS.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
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
