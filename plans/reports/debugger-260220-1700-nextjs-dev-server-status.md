# Next.js Dev Server Status & Error Report

**Date:** 2026-02-20
**Branch:** preview

---

## Executive Summary

Dev server is running and healthy (HTTP 200 on views route). Two TypeScript compilation errors found in modified dashboard files — not in views. The errors are non-blocking at runtime (Next.js dev server compiles on-demand) but would fail production builds.

---

## Findings

### 1. Server Status — RUNNING

- Port 3000: `node` process (PID 92362) listening
- Views page HTTP status: **200 OK** — server renders correctly
- The URL `http://localhost:3000/shinhan-bank-vn/projects/39f0c3e8.../views/` returns a full HTML page

### 2. TypeScript Errors — 2 errors (dashboard-related, not views)

#### Error 1 — `time-tracking/page.tsx:23`

```
Property 'displayName' does not exist on type '...'
```

File: `apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/page.tsx`

Root cause: `observer()` from `mobx-react` wraps the function component and returns a type that doesn't expose `.displayName` as a mutable property in TypeScript. Setting `displayName` on the result of `observer()` triggers TS2339.

Fix: Cast to `any` or use the function declaration name approach:

```ts
// Option A: cast
(TimeTrackingPage as any).displayName = "TimeTrackingPage";

// Option B: remove — MobX observer already uses the function name
```

#### Error 2 — `analytics-dashboard-widget-grid.tsx:130`

```
Property 'compactType' does not exist on type 'IntrinsicAttributes & ResponsiveGridLayoutProps<string>'
```

File: `apps/web/core/components/dashboards/analytics-dashboard-widget-grid.tsx`

Root cause: The project uses **react-grid-layout v2.2.2** which replaced the `compactType?: "vertical" | "horizontal" | null` prop with a `compactor?: Compactor` object API. The old `compactType="vertical"` string prop no longer exists in `ResponsiveGridLayoutProps`.

The package exports `verticalCompactor`, `horizontalCompactor`, `noCompactor` from `react-grid-layout`.

Fix:

```tsx
// Before (old API):
compactType = "vertical";

// After (v2.x API):
import { verticalCompactor } from "react-grid-layout";
// ...
compactor = { verticalCompactor };
```

### 3. Modified Files (git status)

All modified files are in the dashboards feature area:

- `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`
- `apps/web/core/components/dashboards/` — widget grid, widget cards, config modals, all widget types

No views-related files modified.

### 4. Views Directory Structure

The views route resolves to:
`apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/views/`

- `(list)/` — list page, header, layout, mobile-header
- `(detail)/[viewId]/` — detail layout

No TypeScript errors in views files.

---

## Recommendations

| Priority | Action                                                                      | File                                      |
| -------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| Medium   | Replace `compactType="vertical"` with `compactor={verticalCompactor}`       | `analytics-dashboard-widget-grid.tsx:130` |
| Low      | Remove or cast `.displayName` assignment for `observer()` wrapped component | `time-tracking/page.tsx:23`               |

Both errors are in the dashboard feature area (recently modified branch work). Neither affects views.

---

## Unresolved Questions

None. Root causes are clear and reproducible.
