# Phase 05: Split Oversized style-settings-section.tsx

## Context Links

- [Design Audit Report](../reports/design-review-260302-1619-dashboard-design-audit.md) — M1
- [Current file](../../apps/web/ce/components/dashboards/config/style-settings-section.tsx) — 254 lines

## Overview

- **Priority:** P3
- **Status:** pending
- **Description:** Split `style-settings-section.tsx` (254 lines, limit 200) into focused sub-modules

## Key Insights

- File has 3 logical sections: color/opacity (charts), border/smoothing/line/orientation (charts), text align/color (NUMBER widget)
- The parent component `StyleSettingsSection` conditionally renders sections based on `chartType`
- Each section is self-contained with its own `Controller` fields
- `observer()` wraps the parent but sub-sections don't need it (no direct store reads)

## Requirements

- All code files under 200 lines
- No behavioral changes — pure refactor
- Existing imports in `widget-config-tab-content.tsx` continue to work

## Related Code Files

### Files to modify

1. `apps/web/ce/components/dashboards/config/style-settings-section.tsx` — split into coordinator + sub-modules

### Files to create

2. `apps/web/ce/components/dashboards/config/style-color-preset-section.tsx` — color preset + fill opacity
3. `apps/web/ce/components/dashboards/config/style-chart-options-section.tsx` — border, smoothing, line type, orientation
4. `apps/web/ce/components/dashboards/config/style-number-widget-section.tsx` — text align + color (NUMBER only)

### Files that import from modified file

- `apps/web/ce/components/dashboards/config/index.ts` or `widget-config-tab-content.tsx` — verify import path

## Embedded Rules

- **File size:** <200 lines code, <150 lines components
- **File naming:** kebab-case, descriptive names
- **Exports:** Named exports, keep same public API from parent
- **DRY:** Shared button-group pattern appears in line type, orientation, text align — could extract a helper, but YAGNI for 3 small usages

## Implementation Steps

### Step 1: Create `style-color-preset-section.tsx`

**File (NEW):** `apps/web/ce/components/dashboards/config/style-color-preset-section.tsx`

Extract lines 47-92 (color preset + fill opacity):

```tsx
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

      {/* Fill opacity slider */}
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
    </>
  );
}
```

~65 lines.

### Step 2: Create `style-chart-options-section.tsx`

**File (NEW):** `apps/web/ce/components/dashboards/config/style-chart-options-section.tsx`

Extract lines 94-186 (border, smoothing, line type, orientation):

```tsx
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
  // ... border toggle, smoothing toggle, line type buttons, orientation buttons
  // (copy from original lines 94-186)
}
```

~95 lines.

### Step 3: Create `style-number-widget-section.tsx`

**File (NEW):** `apps/web/ce/components/dashboards/config/style-number-widget-section.tsx`

Extract lines 188-251 (text align + color for NUMBER):

```tsx
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
  // ... text align buttons + color picker
  // (copy from original lines 188-251)
}
```

~65 lines.

### Step 4: Refactor `style-settings-section.tsx` as coordinator

**File:** `apps/web/ce/components/dashboards/config/style-settings-section.tsx`

Reduce to a thin coordinator (~50 lines):

```tsx
import { observer } from "mobx-react";
import type { Control } from "react-hook-form";
import { StyleColorPresetSection } from "./style-color-preset-section";
import { StyleChartOptionsSection } from "./style-chart-options-section";
import { StyleNumberWidgetSection } from "./style-number-widget-section";

interface StyleSettingsSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  chartType: string;
}

export const StyleSettingsSection = observer(({ control, chartType }: StyleSettingsSectionProps) => {
  const isNumber = chartType === "NUMBER";
  const showFillOpacity = ["BAR_CHART", "AREA_CHART"].includes(chartType);
  const showSmoothing = ["LINE_CHART", "AREA_CHART"].includes(chartType);
  const showBorder = chartType === "BAR_CHART";
  const showLineType = chartType === "LINE_CHART";
  const showOrientation = chartType === "BAR_CHART";

  return (
    <div className="space-y-4">
      {!isNumber && <StyleColorPresetSection control={control} showFillOpacity={showFillOpacity} />}
      <StyleChartOptionsSection
        control={control}
        showBorder={showBorder}
        showSmoothing={showSmoothing}
        showLineType={showLineType}
        showOrientation={showOrientation}
      />
      {isNumber && <StyleNumberWidgetSection control={control} />}
    </div>
  );
});
```

### Step 5: Update `config/index.ts` if needed

Check if `config/index.ts` re-exports `StyleSettingsSection`. If so, no change needed since the public API remains the same. Sub-modules are internal.

## Post-Phase Checklist

- [ ] `style-settings-section.tsx` under 200 lines (target ~50)
- [ ] All 3 new sub-modules under 100 lines each
- [ ] No behavioral changes — same rendering output
- [ ] `StyleSettingsSection` export unchanged (no breaking imports)
- [ ] `observer()` preserved on coordinator
- [ ] Sub-modules don't need `observer()` (no store reads)
- [ ] `useTranslation()` in each sub-module that uses `t()`
- [ ] `pnpm check:lint` passes
- [ ] Widget config modal still renders style tab correctly

## Todo

- [ ] Create `style-color-preset-section.tsx`
- [ ] Create `style-chart-options-section.tsx`
- [ ] Create `style-number-widget-section.tsx`
- [ ] Refactor `style-settings-section.tsx` as coordinator
- [ ] Verify `config/index.ts` exports
- [ ] Lint check passes

## Success Criteria

- All files under 200 lines
- Style tab in widget config modal works identically
- No visual regression for any chart type

## Risk Assessment

- **Low:** Pure refactor, no logic changes
- Props drilling adds minor complexity but keeps components simple
- If `config/index.ts` barrel exports all config components, new files may need to be added there

## Security Considerations

- N/A — refactor only

## Next Steps

- All phases complete. Run full lint + visual QA.
