/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Chart options: border toggle, smoothing toggle, line type, bar orientation.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { ToggleSwitch } from "@plane/ui";

const LINE_TYPE_OPTIONS = [
  { value: "solid", labelKey: "analytics_dashboard.line_type_solid" },
  { value: "dashed", labelKey: "analytics_dashboard.line_type_dashed" },
  { value: "stepped", labelKey: "analytics_dashboard.line_type_stepped" },
] as const;

interface StyleChartOptionsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  showBorder: boolean;
  showSmoothing: boolean;
  showLineType: boolean;
  showOrientation: boolean;
}

export function StyleChartOptionsSection({
  control,
  showBorder,
  showSmoothing,
  showLineType,
  showOrientation,
}: StyleChartOptionsSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      {showBorder && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-secondary">{t("analytics_dashboard.show_border")}</span>
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
          <span className="text-sm font-medium text-secondary">{t("analytics_dashboard.smooth_lines")}</span>
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

      {/* Line type selector for LINE_CHART */}
      {showLineType && (
        <div>
          <span className="mb-2 block text-sm font-medium text-secondary">{t("analytics_dashboard.line_type")}</span>
          <Controller
            name="config.line_type"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {LINE_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => field.onChange(opt.value)}
                    className={`flex-1 rounded border px-3 py-1.5 text-sm transition-colors ${
                      (field.value || "solid") === opt.value
                        ? "border-accent-strong bg-accent-subtle text-accent-primary"
                        : "border-subtle bg-surface-1 text-secondary hover:bg-layer-1"
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      )}

      {/* Orientation toggle for BAR_CHART */}
      {showOrientation && (
        <div>
          <span className="mb-2 block text-sm font-medium text-secondary">{t("analytics_dashboard.orientation")}</span>
          <Controller
            name="config.orientation"
            control={control}
            render={({ field }) => (
              <div className="flex gap-2">
                {(["vertical", "horizontal"] as const).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => field.onChange(opt)}
                    className={`flex-1 rounded border px-3 py-1.5 text-sm capitalize transition-colors ${
                      (field.value || "vertical") === opt
                        ? "border-accent-strong bg-accent-subtle text-accent-primary"
                        : "border-subtle bg-surface-1 text-secondary hover:bg-layer-1"
                    }`}
                  >
                    {t(`analytics_dashboard.orientation_${opt}`)}
                  </button>
                ))}
              </div>
            )}
          />
        </div>
      )}
    </>
  );
}
