/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { ANALYTICS_COLOR_PRESETS } from "@plane/constants";
import { cn } from "@plane/utils";

interface ColorPresetSelectorProps {
  selectedPreset: string;
  onChange: (presetId: string) => void;
}

export const ColorPresetSelector = observer(
  ({ selectedPreset, onChange }: ColorPresetSelectorProps) => {
    return (
      <div className="space-y-3">
        {Object.values(ANALYTICS_COLOR_PRESETS).map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onChange(preset.id)}
            className={cn(
              "group flex w-full items-center gap-3 rounded-lg border-[1.5px] p-3 text-left transition-all",
              selectedPreset === preset.id
                ? "border-accent-strong bg-accent-subtle"
                : "border-subtle hover:border-accent-subtle hover:bg-layer-1-hover bg-surface-1"
            )}
          >
            {/* Color Swatches */}
            <div className="flex gap-1">
              {preset.colors.slice(0, 6).map((color, index) => (
                <div
                  key={index}
                  className="h-8 w-8 rounded"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>

            {/* Preset Info */}
            <div className="flex-1">
              <div className={cn("font-medium transition-colors", selectedPreset === preset.id ? "text-accent-primary" : "text-primary group-hover:text-accent-primary")}>
                {preset.name}
              </div>
              <div className="text-xs text-tertiary">
                {preset.description}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }
);
