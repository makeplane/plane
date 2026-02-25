# Phase 1: Replace Headless UI Components Inside Modal

## Context Links

- [Plan Overview](./plan.md)
- [widget-config-modal.tsx](../../apps/web/core/components/dashboards/widget-config-modal.tsx)
- [basic-settings-section.tsx](../../apps/web/core/components/dashboards/config/basic-settings-section.tsx)

## Overview

- **Priority:** P1 — Blocker
- **Status:** Complete
- **Description:** Replace CustomSelect (Headless UI Combobox) in BasicSettingsSection with plain HTML select elements to avoid Dialog focus trap conflicts

## Key Insights

- `CustomSelect` uses Headless UI `Combobox` which portals dropdown to `document.body` — outside Dialog.Panel
- Dialog's focus trap intercepts clicks on portaled elements, preventing selection
- Tab switching already fixed with useState (no Headless UI Tab.Group)
- WidgetTypeSelector uses plain `<button>` — should work after tab fix
- ColorPresetSelector uses plain `<button>` — should work
- ToggleSwitch is a custom component (no Headless UI) — should work
- Input from @plane/ui is a plain input wrapper — should work

## Requirements

- chart_property dropdown must allow selecting from 12 options
- chart_metric dropdown must allow selecting from 2 options
- Dropdowns must visually match existing Plane styling
- No changes to shared @plane/ui components

## Related Code Files

- **Modify:** `apps/web/core/components/dashboards/config/basic-settings-section.tsx`
- **Reference:** `packages/constants/src/analytics-dashboard.ts` (option lists)
- **DO NOT modify:** `packages/ui/src/dropdowns/custom-select.tsx`

## Implementation Steps

1. **Replace CustomSelect with native `<select>` in BasicSettingsSection**
   - Remove `CustomSelect` import from `@plane/ui`
   - Replace chart_property Controller render with styled `<select>` element
   - Replace chart_metric Controller render with styled `<select>` element
   - Apply Tailwind classes matching Plane's input styling: `w-full rounded border border-custom-border-200 bg-custom-background-100 px-3 py-2 text-sm text-custom-text-100`

2. **Verify widget-config-modal.tsx tab fix**
   - Confirm useState tabs render correctly
   - Confirm all 4 tab buttons switch content
   - Confirm form submission collects values from all tabs

3. **Test all interactive elements inside modal**
   - Widget type card buttons (WidgetTypeSelector)
   - Title input field
   - Property select dropdown
   - Metric select dropdown
   - Color preset buttons (ColorPresetSelector)
   - Range slider (fill opacity)
   - ToggleSwitch components (border, smoothing, legend, tooltip, etc.)

## Todo List

- [x] Replace CustomSelect with `<select>` for chart_property
- [x] Replace CustomSelect with `<select>` for chart_metric
- [x] Style selects to match Plane design
- [x] Verify tab switching works
- [x] Verify widget type selection works
- [x] Verify form submission works

## Success Criteria

- All widget type cards clickable with visual selection feedback
- Property/metric dropdowns open, show options, allow selection
- Tab switching works across all 4 tabs
- Style/Display toggles functional
- Form submits successfully via API

## Risk Assessment

- **Low:** Native `<select>` may look slightly different from CustomSelect — acceptable tradeoff for functionality
- **Low:** Removing observer wrapper if causing re-render issues

## Security Considerations

- No security impact — UI-only changes
- Form validation unchanged (react-hook-form rules)
