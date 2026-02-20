/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Controller, type Control } from "react-hook-form";
import { ToggleSwitch } from "@plane/ui";
import { EAnalyticsWidgetType } from "@plane/types";

interface DisplaySettingsSectionProps {
  control: Control<any>;
  widgetType: EAnalyticsWidgetType;
}

export const DisplaySettingsSection = observer(
  ({ control, widgetType }: DisplaySettingsSectionProps) => {
    const showLegend = widgetType !== EAnalyticsWidgetType.NUMBER;
    const showTooltip = widgetType !== EAnalyticsWidgetType.NUMBER;
    const showCenterValue = [
      EAnalyticsWidgetType.DONUT,
      EAnalyticsWidgetType.PIE,
    ].includes(widgetType);
    const showMarkers = widgetType === EAnalyticsWidgetType.LINE;

    return (
      <div className="space-y-4">
        {/* Legend */}
        {showLegend && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-secondary">
              Show Legend
            </label>
            <Controller
              name="config.show_legend"
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

        {/* Tooltip */}
        {showTooltip && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-secondary">
              Show Tooltip
            </label>
            <Controller
              name="config.show_tooltip"
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

        {/* Center Value */}
        {showCenterValue && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-secondary">
              Show Center Value
            </label>
            <Controller
              name="config.center_value"
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

        {/* Markers */}
        {showMarkers && (
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-secondary">
              Show Data Points
            </label>
            <Controller
              name="config.show_markers"
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
