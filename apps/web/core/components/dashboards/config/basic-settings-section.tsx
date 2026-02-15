/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, type Control } from "react-hook-form";
import { Input, CustomSelect } from "@plane/ui";
import {
  ANALYTICS_CHART_PROPERTY_OPTIONS,
  ANALYTICS_CHART_METRIC_OPTIONS,
} from "@plane/constants";

interface BasicSettingsSectionProps {
  control: Control<any>;
  errors: any;
}

export const BasicSettingsSection = observer(
  ({ control, errors }: BasicSettingsSectionProps) => {
    return (
      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="mb-1 block text-sm font-medium text-custom-text-200">
            Widget Title <span className="text-red-500">*</span>
          </label>
          <Controller
            name="title"
            control={control}
            rules={{ required: "Title is required" }}
            render={({ field }) => (
              <Input
                {...field}
                placeholder="Issues by Priority"
                hasError={!!errors.title}
                className="w-full"
              />
            )}
          />
          {errors.title && (
            <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* Property (X-Axis) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-custom-text-200">
            Property (X-Axis) <span className="text-red-500">*</span>
          </label>
          <Controller
            name="chart_property"
            control={control}
            rules={{ required: "Property is required" }}
            render={({ field }) => (
              <CustomSelect
                value={field.value}
                onChange={field.onChange}
                label={
                  ANALYTICS_CHART_PROPERTY_OPTIONS.find(
                    (opt) => opt.key === field.value
                  )?.label || "Select property"
                }
                input
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
            <p className="mt-1 text-xs text-red-500">
              {errors.chart_property.message}
            </p>
          )}
        </div>

        {/* Metric (Y-Axis) */}
        <div>
          <label className="mb-1 block text-sm font-medium text-custom-text-200">
            Metric (Y-Axis) <span className="text-red-500">*</span>
          </label>
          <Controller
            name="chart_metric"
            control={control}
            rules={{ required: "Metric is required" }}
            render={({ field }) => (
              <CustomSelect
                value={field.value}
                onChange={field.onChange}
                label={
                  ANALYTICS_CHART_METRIC_OPTIONS.find(
                    (opt) => opt.key === field.value
                  )?.label || "Select metric"
                }
                input
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
            <p className="mt-1 text-xs text-red-500">
              {errors.chart_metric.message}
            </p>
          )}
        </div>
      </div>
    );
  }
);
