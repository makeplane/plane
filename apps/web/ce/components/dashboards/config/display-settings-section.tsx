/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Display settings: legend, tooltip, center value, markers toggles.
 * Uses plain string chart_type values matching backend model.
 */

import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";

interface DisplaySettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  chartType: string;
}

export const DisplaySettingsSection = observer(({ control, chartType }: DisplaySettingsSectionProps) => {
  const { t } = useTranslation();
  const showLegend = chartType !== "NUMBER";
  const showTooltip = chartType !== "NUMBER";
  const showCenterValue = ["DONUT_CHART", "PIE_CHART"].includes(chartType);
  const showMarkers = chartType === "LINE_CHART";

  return (
    <div className="space-y-4">
      {showLegend && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.show_legend")}</span>
          <Controller
            name="config.show_legend"
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

      {showTooltip && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.show_tooltip")}</span>
          <Controller
            name="config.show_tooltip"
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

      {showCenterValue && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.show_center_value")}</span>
          <Controller
            name="config.center_value"
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

      {showMarkers && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-color-secondary">{t("analytics_dashboard.show_data_points")}</span>
          <Controller
            name="config.show_markers"
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
