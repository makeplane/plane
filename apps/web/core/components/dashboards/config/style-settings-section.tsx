/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, type Control } from "react-hook-form";
import { ToggleSwitch } from "@plane/ui";
import { EAnalyticsWidgetType } from "@plane/types";
import { ColorPresetSelector } from "./color-preset-selector";

interface StyleSettingsSectionProps {
  control: Control<any>;
  widgetType: EAnalyticsWidgetType;
}

export const StyleSettingsSection = observer(
  ({ control, widgetType }: StyleSettingsSectionProps) => {
    const showFillOpacity = [
      EAnalyticsWidgetType.BAR,
      EAnalyticsWidgetType.AREA,
    ].includes(widgetType);
    const showSmoothing = [
      EAnalyticsWidgetType.LINE,
      EAnalyticsWidgetType.AREA,
    ].includes(widgetType);
    const showBorder = widgetType === EAnalyticsWidgetType.BAR;

    return (
      <div className="space-y-4">
        {/* Color Preset */}
        <div>
          <label className="mb-2 block text-sm font-medium text-custom-text-200">
            Color Preset
          </label>
          <Controller
            name="config.color_preset"
            control={control}
            render={({ field }) => (
              <ColorPresetSelector
                selectedPreset={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Fill Opacity */}
        {showFillOpacity && (
          <div>
            <label className="mb-2 block text-sm font-medium text-custom-text-200">
              Fill Opacity
            </label>
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
                    value={(field.value || 0) * 100}
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) / 100)
                    }
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-custom-background-80"
                    style={{
                      background: `linear-gradient(to right, rgb(var(--color-primary-100)) 0%, rgb(var(--color-primary-100)) ${
                        (field.value || 0) * 100
                      }%, rgb(var(--color-background-80)) ${
                        (field.value || 0) * 100
                      }%, rgb(var(--color-background-80)) 100%)`,
                    }}
                  />
                  <span className="text-sm text-custom-text-300 min-w-[3rem] text-right">
                    {Math.round((field.value || 0) * 100)}%
                  </span>
                </div>
              )}
            />
          </div>
        )}

        {/* Show Border */}
        {showBorder && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-custom-text-200">
              Show Border
            </label>
            <Controller
              name="config.show_border"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  value={field.value || false}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        {/* Smoothing */}
        {showSmoothing && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-custom-text-200">
              Smooth Lines
            </label>
            <Controller
              name="config.smoothing"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  value={field.value || false}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}
      </div>
    );
  }
);
