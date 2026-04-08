/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Text align and color settings for NUMBER widget type.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@plane/i18n";

const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "L" },
  { value: "center", label: "C" },
  { value: "right", label: "R" },
] as const;

interface StyleNumberWidgetSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
}

export function StyleNumberWidgetSection({ control }: StyleNumberWidgetSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <span className="mb-2 block text-sm font-medium text-secondary">{t("analytics_dashboard.text_align")}</span>
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
                      ? "border-accent-strong bg-accent-subtle text-accent-primary"
                      : "border-subtle bg-surface-1 text-secondary hover:bg-layer-1"
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
        <span className="mb-2 block text-sm font-medium text-secondary">{t("analytics_dashboard.text_color")}</span>
        <Controller
          name="config.text_color"
          control={control}
          render={({ field }) => (
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={(field.value as string) || "#ffffff"}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-8 w-10 cursor-pointer rounded border border-subtle bg-transparent p-0.5"
              />
              <span className="text-sm text-tertiary">
                {(field.value as string) || t("analytics_dashboard.text_color_default")}
              </span>
              {field.value && (
                <button
                  type="button"
                  onClick={() => field.onChange(undefined)}
                  className="text-xs text-tertiary hover:text-secondary"
                >
                  {t("common.reset")}
                </button>
              )}
            </div>
          )}
        />
      </div>
    </>
  );
}
