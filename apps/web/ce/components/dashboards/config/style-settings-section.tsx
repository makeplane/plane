/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Style settings: color preset, fill opacity, border, smoothing.
 * Uses plain string chart_type values matching backend model.
 */

import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";
import { ColorPresetSelector } from "./color-preset-selector";

interface StyleSettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  chartType: string;
}

export const StyleSettingsSection = observer(({ control, chartType }: StyleSettingsSectionProps) => {
  const { t } = useTranslation();
  const showFillOpacity = ["bar", "area"].includes(chartType);
  const showSmoothing = ["line", "area"].includes(chartType);
  const showBorder = chartType === "bar";

  return (
    <div className="space-y-4">
      <div>
        <span className="mb-2 block text-sm font-medium text-color-secondary">
          {t("analytics_dashboard.color_preset")}
        </span>
        <Controller
          name="config.color_preset"
          control={control}
          render={({ field }) => (
            <ColorPresetSelector
              selectedPreset={field.value as string}
              onChange={(val: string) => field.onChange(val)}
            />
          )}
        />
      </div>

      {showFillOpacity && (
        <div>
          <span className="mb-2 block text-sm font-medium text-color-secondary">
            {t("analytics_dashboard.fill_opacity")}
          </span>
          <Controller
            name="config.fill_opacity"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={((field.value as number) || 0) * 100}
                  onChange={(e) => field.onChange(parseInt(e.target.value) / 100)}
                  className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-layer-2"
                />
                <span className="text-sm text-color-tertiary min-w-[3rem] text-right">
                  {Math.round(((field.value as number) || 0) * 100)}%
                </span>
              </div>
            )}
          />
        </div>
      )}

      {showBorder && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.show_border")}</span>
          <Controller
            name="config.show_border"
            control={control}
            render={({ field }) => (
              <ToggleSwitch
                value={(field.value as boolean) || false}
                onChange={(val: boolean) => field.onChange(val)}
              />
            )}
          />
        </div>
      )}

      {showSmoothing && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.smooth_lines")}</span>
          <Controller
            name="config.smoothing"
            control={control}
            render={({ field }) => (
              <ToggleSwitch
                value={(field.value as boolean) || false}
                onChange={(val: boolean) => field.onChange(val)}
              />
            )}
          />
        </div>
      )}
    </div>
  );
});
