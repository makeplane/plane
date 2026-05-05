# Phase Implementation Report

## Executed Phase

- Phase: phase-08-implement-gaps (Steps 3–7)
- Plan: plans/260228-1034-dashboard-v2-test-plan/
- Status: completed

## Files Modified

### New files created

- `apps/web/ce/components/dashboards/chart-renderers/drill-down-bar-chart.tsx` (79 lines) — Recharts BarChart with per-bar onClick + M1 horizontal layout
- `apps/web/ce/components/dashboards/chart-renderers/drill-down-line-chart.tsx` (88 lines) — Recharts LineChart with activeDot onClick + M2 line_type (solid/dashed/stepped)
- `apps/web/ce/components/dashboards/chart-renderers/drill-down-area-chart.tsx` (74 lines) — Recharts AreaChart with activeDot onClick drill-down
- `apps/web/ce/components/dashboards/chart-renderers/drill-down-pie-chart.tsx` (79 lines) — Recharts PieChart/Donut with Pie onClick + M3 center value overlay

### Modified files

- `apps/web/ce/components/dashboards/widget-adapter.tsx` (138 lines) — Refactored to use drill-down renderers; added M4 number text_align/text_color; uses `useAppRouter` for navigation
- `apps/web/ce/components/dashboards/config/style-settings-section.tsx` (198 lines) — Added M2 line type buttons, M1 orientation toggle, M4 text_align buttons + color input for NUMBER type
- `packages/types/src/custom-dashboard.ts` — Added `line_type`, `orientation`, `text_align`, `text_color` to `IAnalyticsWidgetConfig`
- `packages/i18n/src/locales/en/translations.ts` — Added 11 new keys (line*type*\_, orientation\_\_, text_align, text_color\*)
- `packages/i18n/src/locales/ko/translations.ts` — Same keys in Korean
- `packages/i18n/src/locales/vi/translations.ts` — Same keys in Vietnamese

## Tasks Completed

- [x] H2: Chart click drill-down — all chart types (Bar, Line, Area, Pie, Donut) navigate to `/{workspaceSlug}/issues/?{x_axis_property}={value}`
- [x] M3: Donut center value — `config.center_value=true` shows total count as absolute-positioned overlay
- [x] M2: Line type setting — `config.line_type` maps solid→default, dashed→strokeDasharray "6 4", stepped→type="step"
- [x] M1: Bar horizontal variant — `config.orientation="horizontal"` passes `layout="vertical"` to Recharts BarChart with swapped axes
- [x] M4: Number text align + color — `config.text_align` controls flex justify; `config.text_color` applied as inline style only when set

## Tests Status

- Type check: pass (build succeeded cleanly)
- Build: `pnpm build --filter=web` → ✓ built in 4.14s, 11 tasks successful
- Unit tests: not run (no existing dashboard unit tests)

## Architecture Decisions

- Propel chart components don't expose `onClick` — extracted recharts-direct renderers into `chart-renderers/` subdir for drill-down capability while keeping `widget-adapter.tsx` clean (138 lines)
- Navigation uses `useAppRouter` → `router.push()` (Next.js pattern, consistent with codebase)
- NUMBER widget `text_color` uses inline style (only when set) — allows user-configured hex values while defaulting to `text-color-primary` via Tailwind class
- Center value overlay uses `pointer-events-none absolute inset-0` to not block chart interactions

## Issues Encountered

- Initial `@remix-run/react` import was wrong; corrected to `@/hooks/use-app-router` → `next/navigation`
- Propel `BarChart` wraps recharts internally with no click passthrough; solved by building thin recharts wrappers in `chart-renderers/`

## Next Steps

- Steps 1–2 (C1 project picker, C2 number metrics) and Step 8 (H1 drag-drop grid) remain pending
- Phase plan updated: Steps 3–7 checked off
