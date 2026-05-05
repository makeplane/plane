/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Color preset selector and fill opacity slider for chart style settings.
 */

import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import { ColorPresetSelector } from "./color-preset-selector";

interface StyleColorPresetSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  showFillOpacity: boolean;
}

export function StyleColorPresetSection({ control, showFillOpacity }: StyleColorPresetSectionProps) {
  const { t } = useTranslation();
  return (
    <>
      {/* Color preset */}
      <div>
        <span className="mb-2 block text-sm font-medium text-secondary">{t("analytics_dashboard.color_preset")}</span>
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

      {/* Fill opacity slider */}
      {showFillOpacity && (
        <div>
          <span className="mb-2 block text-sm font-medium text-secondary">{t("analytics_dashboard.fill_opacity")}</span>
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
                <span className="text-sm text-tertiary min-w-[3rem] text-right">
                  {Math.round(((field.value as number) || 0) * 100)}%
                </span>
              </div>
            )}
          />
        </div>
      )}
    </>
  );
}
