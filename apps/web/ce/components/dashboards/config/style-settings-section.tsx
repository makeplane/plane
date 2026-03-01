/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Style settings: color preset, fill opacity, border, smoothing, line type,
 * bar orientation, and number widget text align/color.
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

const LINE_TYPE_OPTIONS = [
  { value: "solid", labelKey: "analytics_dashboard.line_type_solid" },
  { value: "dashed", labelKey: "analytics_dashboard.line_type_dashed" },
  { value: "stepped", labelKey: "analytics_dashboard.line_type_stepped" },
] as const;

const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "L" },
  { value: "center", label: "C" },
  { value: "right", label: "R" },
] as const;

export const StyleSettingsSection = observer(({ control, chartType }: StyleSettingsSectionProps) => {
  const { t } = useTranslation();
  const showFillOpacity = ["BAR_CHART", "AREA_CHART"].includes(chartType);
  const showSmoothing = ["LINE_CHART", "AREA_CHART"].includes(chartType);
  const showBorder = chartType === "BAR_CHART";
  const showLineType = chartType === "LINE_CHART";
  const showOrientation = chartType === "BAR_CHART";
  const isNumber = chartType === "NUMBER";

  return (
    <div className="space-y-4">
      {/* Color preset — hidden for NUMBER widget */}
      {!isNumber && (
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
      )}

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

      {/* M2: Line type selector for LINE_CHART */}
      {showLineType && (
        <div>
          <span className="mb-2 block text-sm font-medium text-color-secondary">
            {t("analytics_dashboard.line_type")}
          </span>
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
                        ? "border-color-accent-strong bg-accent-subtle text-color-accent-primary"
                        : "border-color-subtle bg-surface-1 text-color-secondary hover:bg-layer-1"
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

      {/* M1: Orientation toggle for BAR_CHART */}
      {showOrientation && (
        <div>
          <span className="mb-2 block text-sm font-medium text-color-secondary">
            {t("analytics_dashboard.orientation")}
          </span>
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
                        ? "border-color-accent-strong bg-accent-subtle text-color-accent-primary"
                        : "border-color-subtle bg-surface-1 text-color-secondary hover:bg-layer-1"
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

      {/* M4: Text align + color for NUMBER widget */}
      {isNumber && (
        <>
          <div>
            <span className="mb-2 block text-sm font-medium text-color-secondary">
              {t("analytics_dashboard.text_align")}
            </span>
            <Controller
              name="config.text_align"
              control={control}
              render={({ field }) => (
                <div className="flex gap-2">
                  {TEXT_ALIGN_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => field.onChange(opt.value)}
                      className={`flex-1 rounded border px-3 py-1.5 text-sm font-medium transition-colors ${
                        (field.value || "center") === opt.value
                          ? "border-color-accent-strong bg-accent-subtle text-color-accent-primary"
                          : "border-color-subtle bg-surface-1 text-color-secondary hover:bg-layer-1"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-color-secondary">
              {t("analytics_dashboard.text_color")}
            </span>
            <Controller
              name="config.text_color"
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={(field.value as string) || "#ffffff"}
                    onChange={(e) => field.onChange(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border border-color-subtle bg-transparent p-0.5"
                  />
                  <span className="text-sm text-color-tertiary">
                    {(field.value as string) || t("analytics_dashboard.text_color_default")}
                  </span>
                  {field.value && (
                    <button
                      type="button"
                      onClick={() => field.onChange(undefined)}
                      className="text-xs text-color-tertiary hover:text-color-secondary"
                    >
                      {t("common.reset")}
                    </button>
                  )}
                </div>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
});
