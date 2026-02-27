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
import { Input } from "@plane/propel/input";
import { CustomSelect } from "@plane/ui";
import { ANALYTICS_CHART_PROPERTY_OPTIONS, ANALYTICS_CHART_METRIC_OPTIONS } from "@plane/constants";

interface BasicSettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: FieldErrors<any>;
}

const CHART_MODEL_OPTIONS = [
  { key: "BASIC", label: "Basic" },
  { key: "GROUPED", label: "Grouped" },
];

export const BasicSettingsSection = observer(({ control, errors }: BasicSettingsSectionProps) => (
  <div className="space-y-4">
    {/* Widget Name */}
    <div>
      <label htmlFor="name" className="mb-1 block text-sm font-medium text-color-secondary">
        Widget Name <span className="text-color-danger-primary">*</span>
      </label>
      <Controller
        name="name"
        control={control}
        rules={{ required: "Name is required" }}
        render={({ field }) => (
          <Input id="name" {...field} placeholder="Issues by Priority" hasError={!!errors.name} className="w-full" />
        )}
      />
      {errors.name && <p className="mt-1 text-xs text-color-danger-primary">{errors.name.message as string}</p>}
    </div>

    {/* X-Axis Property */}
    <div>
      <label className="mb-1 block text-sm font-medium text-color-secondary">
        Property (X-Axis) <span className="text-color-danger-primary">*</span>
      </label>
      <Controller
        name="x_axis_property"
        control={control}
        rules={{ required: "Property is required" }}
        render={({ field }) => (
          <CustomSelect
            value={field.value as string}
            onChange={(val: string) => field.onChange(val)}
            label={ANALYTICS_CHART_PROPERTY_OPTIONS.find((o) => o.key === field.value)?.label || "Select property"}
            input
          >
            {ANALYTICS_CHART_PROPERTY_OPTIONS.map((opt) => (
              <CustomSelect.Option key={opt.key} value={opt.key}>{opt.label}</CustomSelect.Option>
            ))}
          </CustomSelect>
        )}
      />
    </div>

    {/* Y-Axis Metric */}
    <div>
      <label className="mb-1 block text-sm font-medium text-color-secondary">
        Metric (Y-Axis) <span className="text-color-danger-primary">*</span>
      </label>
      <Controller
        name="y_axis_metric"
        control={control}
        rules={{ required: "Metric is required" }}
        render={({ field }) => (
          <CustomSelect
            value={field.value as string}
            onChange={(val: string) => field.onChange(val)}
            label={ANALYTICS_CHART_METRIC_OPTIONS.find((o) => o.key === field.value)?.label || "Select metric"}
            input
          >
            {ANALYTICS_CHART_METRIC_OPTIONS.map((opt) => (
              <CustomSelect.Option key={opt.key} value={opt.key}>{opt.label}</CustomSelect.Option>
            ))}
          </CustomSelect>
        )}
      />
    </div>

    {/* Chart Model */}
    <div>
      <label className="mb-1 block text-sm font-medium text-color-secondary">Chart Model</label>
      <Controller
        name="chart_model"
        control={control}
        render={({ field }) => (
          <CustomSelect
            value={field.value as string}
            onChange={(val: string) => field.onChange(val)}
            label={CHART_MODEL_OPTIONS.find((o) => o.key === field.value)?.label || "Basic"}
            input
          >
            {CHART_MODEL_OPTIONS.map((opt) => (
              <CustomSelect.Option key={opt.key} value={opt.key}>{opt.label}</CustomSelect.Option>
            ))}
          </CustomSelect>
        )}
      />
    </div>

    {/* Group By (optional, only relevant for GROUPED model) */}
    <div>
      <label className="mb-1 block text-sm font-medium text-color-secondary">Group By (optional)</label>
      <Controller
        name="group_by"
        control={control}
        render={({ field }) => (
          <CustomSelect
            value={field.value as string}
            onChange={(val: string) => field.onChange(val)}
            label={ANALYTICS_CHART_PROPERTY_OPTIONS.find((o) => o.key === field.value)?.label || "None"}
            input
          >
            <CustomSelect.Option value="">None</CustomSelect.Option>
            {ANALYTICS_CHART_PROPERTY_OPTIONS.map((opt) => (
              <CustomSelect.Option key={opt.key} value={opt.key}>{opt.label}</CustomSelect.Option>
            ))}
          </CustomSelect>
        )}
      />
    </div>
  </div>
));
