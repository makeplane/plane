/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Controller } from "react-hook-form";
import type { Control } from "react-hook-form";
import {
  ANALYTICS_PRIORITY_OPTIONS,
  ANALYTICS_STATE_GROUP_OPTIONS,
  ANALYTICS_DATE_FILTER_OPTIONS,
} from "@plane/constants";

type FilterSettingsSectionProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
};

// Reusable multi-select chip component for entity filters
function MultiSelectChips({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[];
  value: string[];
  onChange: (val: string[]) => void;
}) {
  const toggle = (key: string) => {
    onChange(value.includes(key) ? value.filter((v) => v !== key) : [...value, key]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const selected = value.includes(opt.key);
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => toggle(opt.key)}
            className={`rounded-md border px-2 py-1 text-xs transition-colors ${
              selected
                ? "border-custom-primary-100 bg-custom-primary-100/10 text-custom-primary-100"
                : "border-custom-border-200 text-custom-text-300 hover:bg-custom-background-80"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// Date range picker row with after/before inputs
function DateRangeRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { after?: string; before?: string } | undefined;
  onChange: (val: { after?: string; before?: string }) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-custom-text-300">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value?.after ?? ""}
          onChange={(e) => onChange({ ...value, after: e.target.value || undefined })}
          className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5 text-xs text-custom-text-200 outline-none focus:border-custom-primary-100"
          placeholder="After"
        />
        <span className="text-xs text-custom-text-400">to</span>
        <input
          type="date"
          value={value?.before ?? ""}
          onChange={(e) => onChange({ ...value, before: e.target.value || undefined })}
          className="w-full rounded-md border border-custom-border-200 bg-custom-background-100 px-2.5 py-1.5 text-xs text-custom-text-200 outline-none focus:border-custom-primary-100"
          placeholder="Before"
        />
      </div>
    </div>
  );
}

export function FilterSettingsSection({ control }: FilterSettingsSectionProps) {
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs text-custom-text-400">
        Filter widget data by specific dimensions. Only matching issues will be included in the chart.
      </p>

      {/* Priority filter */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-custom-text-300">Priority</span>
        <Controller
          name="config.filters.priority"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <MultiSelectChips
              options={ANALYTICS_PRIORITY_OPTIONS}
              value={(field.value as string[]) ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* State Group filter */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-custom-text-300">State Group</span>
        <Controller
          name="config.filters.state_group"
          control={control}
          defaultValue={[]}
          render={({ field }) => (
            <MultiSelectChips
              options={ANALYTICS_STATE_GROUP_OPTIONS}
              value={(field.value as string[]) ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </div>

      {/* Date range filters */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-custom-text-200">Date Ranges</span>
        {ANALYTICS_DATE_FILTER_OPTIONS.map((opt) => (
          <Controller
            key={opt.key}
            name={`config.filters.${opt.key}` as const}
            control={control}
            defaultValue={{}}
            render={({ field }) => (
              <DateRangeRow
                label={opt.label}
                value={field.value as { after?: string; before?: string } | undefined}
                onChange={field.onChange}
              />
            )}
          />
        ))}
      </div>
    </div>
  );
}
