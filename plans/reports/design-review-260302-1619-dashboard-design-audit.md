# Dashboard Design Audit Report

**Date:** 2026-03-02
**Reviewer:** Claude Code
**Scope:** All custom dashboard files in `apps/web/ce/components/dashboards/`, `apps/web/app/.../dashboards/`
**Files reviewed:** 21 files, ~4,452 LOC

---

## Summary

| Severity | Count | Category                                             |
| -------- | ----- | ---------------------------------------------------- |
| Critical | 3     | Wrong tokens, missing i18n, wrong backgrounds        |
| Moderate | 4     | File size, custom components, missing layout pattern |
| Minor    | 1     | Text scale inconsistency                             |

---

## Critical Issues

### C1: Hardcoded English Strings (Missing i18n)

**Impact:** Breaks internationalization, no Korean/Vietnamese support
**Files affected:** 8 files

| File                                    | Hardcoded Strings                                                                                                                                         |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboards/page.tsx`                   | "No dashboards created yet", "Create Dashboard", "Success!", "Dashboard created/updated/deleted successfully", "Failed to create/update/delete dashboard" |
| `[dashboardId]/page.tsx`                | "Dashboards", "/", "Add Widget", "No widgets yet. Add your first widget to get started.", "Widget deleted", "Failed to delete/save widget"                |
| `components/dashboard-card.tsx`         | "Public", "Private", "Edit", "Delete", "widget(s)"                                                                                                        |
| `components/dashboard-list-header.tsx`  | "Create and manage dashboards", "New Dashboard"                                                                                                           |
| `components/dashboard-delete-modal.tsx` | "Delete Dashboard", content text                                                                                                                          |
| `[dashboardId]/dashboard-toolbar.tsx`   | "Add Widget", "Refresh", "Done", "Edit"                                                                                                                   |
| `widget-adapter.tsx`                    | "No data available for these filters", "Chart type ... not supported yet"                                                                                 |
| `custom-dashboard-widget-card.tsx`      | "Loading..."                                                                                                                                              |

**Fix:** Add translation keys to `packages/i18n/src/locales/{en,ko,vi}/translations.ts` under `analytics_dashboard.*` namespace.

---

### C2: Wrong Color Token Names

**File:** `dashboard-toolbar.tsx` (lines 31, 37, 39, 43)

```diff
- border-subtle bg-surface-1
+ border-color-subtle bg-surface-1

- text-tertiary
+ text-color-tertiary

- text-accent-primary
+ text-color-accent-primary

- text-sm text-tertiary
+ text-sm text-color-tertiary
```

**Impact:** Tokens without `color-` prefix may not resolve correctly in all themes.

---

### C3: Wrong Input/List Backgrounds

**Files:**

- `filter-settings-section.tsx:77,84` — Date inputs use `bg-surface-1`
- `dashboard-form-modal.tsx:177` — Project list uses `bg-surface-1`

**Fix:** Change `bg-surface-1` → `bg-layer-2` for input/list containers inside modals.

---

## Moderate Issues

### M1: File Size Exceeded — `style-settings-section.tsx`

**Lines:** 254 (limit: 200)

**Fix:** Extract into sub-files:

- `style-color-preset-section.tsx` — Color preset + fill opacity
- `style-chart-options-section.tsx` — Border, smoothing, line type, orientation
- `style-number-widget-section.tsx` — Text align + color (NUMBER widget only)

---

### M2: Custom Dropdown Menu — `dashboard-card.tsx:65-94`

Custom hover-based dropdown with `hidden group-hover:block` pattern.

**Issue:** Not keyboard accessible, no focus trap, doesn't follow Plane's menu pattern.

**Fix:** Replace with `@plane/propel/menu` or `@plane/ui` `CustomMenu` component:

```tsx
import { Menu } from "@plane/propel/menu";

<Menu>
  <Menu.Trigger>
    <button>...</button>
  </Menu.Trigger>
  <Menu.Content>
    <Menu.Item onClick={() => onEdit(dashboard)}>Edit</Menu.Item>
    <Menu.Item onClick={() => onDelete(dashboard)}>Delete</Menu.Item>
  </Menu.Content>
</Menu>;
```

---

### M3: Missing Layout Pattern — `[dashboardId]/page.tsx`

**Issue:** Custom inline header (lines 67-82) instead of using Plane's standard layout:

- No `AppHeader` component
- No `ContentWrapper` for content area
- Custom breadcrumb instead of `@plane/ui` `Breadcrumbs`

**Standard Pattern:**

```tsx
// layout.tsx
import { AppHeader } from "@/components/core/app-header";
import { ContentWrapper } from "@plane/ui";

export default function DashboardDetailLayout() {
  return (
    <>
      <AppHeader header={<DashboardDetailHeader />} />
      <ContentWrapper>
        <Outlet />
      </ContentWrapper>
    </>
  );
}
```

---

### M4: Missing ContentWrapper — `dashboards/page.tsx`

**Issue:** Dashboard list page doesn't use `ContentWrapper` from `@plane/ui`.

**Fix:** Wrap content area with `<ContentWrapper>` for consistent page padding.

---

## Minor Issues

### N1: Text Scale Inconsistency

Some files use Tailwind default text sizes (`text-sm`, `text-xs`, `text-base`, `text-xl`) vs Plane's custom scale (`text-11`, `text-13`, `text-16`).

**Note:** Core web app uses Tailwind defaults widely, so this is acceptable for web CE components. Only Propel dialogs/admin app strictly require Plane's custom scale. Low priority.

---

## Files Status Matrix

| File                               | i18n | Tokens          | Layout               | Size    | Components        |
| ---------------------------------- | ---- | --------------- | -------------------- | ------- | ----------------- |
| `page.tsx` (list)                  | ❌   | ✅              | ⚠️ no ContentWrapper | ✅ 169L | ✅                |
| `[dashboardId]/page.tsx`           | ❌   | ✅              | ⚠️ no AppHeader      | ✅ 150L | ✅                |
| `dashboard-toolbar.tsx`            | ❌   | ❌ wrong tokens | N/A                  | ✅ 67L  | ✅                |
| `dashboard-card.tsx`               | ❌   | ✅              | N/A                  | ✅ 110L | ⚠️ custom menu    |
| `dashboard-list-header.tsx`        | ❌   | ✅              | N/A                  | ✅ 31L  | ✅                |
| `dashboard-delete-modal.tsx`       | ❌   | ✅              | N/A                  | ✅ 58L  | ✅ AlertModalCore |
| `dashboard-form-modal.tsx`         | ✅   | ⚠️ bg-surface-1 | N/A                  | ⚠️ 249L | ✅                |
| `widget-config-modal.tsx`          | ✅   | ✅              | N/A                  | ✅ 185L | ✅                |
| `widget-adapter.tsx`               | ❌   | ✅              | N/A                  | ✅ 123L | ✅                |
| `custom-dashboard-widget-card.tsx` | ❌   | ✅              | N/A                  | ✅ 77L  | ✅                |
| `custom-dashboard-widget-grid.tsx` | N/A  | ✅              | N/A                  | ✅ 117L | ✅                |
| `widget-context-menu.tsx`          | ✅   | ✅              | N/A                  | ✅ 85L  | ✅                |
| `basic-settings-section.tsx`       | ✅   | ✅              | N/A                  | ✅ 177L | ✅                |
| `style-settings-section.tsx`       | ✅   | ✅              | N/A                  | ❌ 254L | ✅                |
| `display-settings-section.tsx`     | ✅   | ✅              | N/A                  | ✅ 96L  | ✅                |
| `filter-settings-section.tsx`      | ✅   | ⚠️ bg-surface-1 | N/A                  | ✅ 149L | ✅                |
| `widget-preview-panel.tsx`         | N/A  | ✅              | N/A                  | ✅ 160L | ✅ propel charts  |
| `widget-type-selector.tsx`         | ✅   | ✅              | N/A                  | ✅ 59L  | ✅                |
| `color-preset-selector.tsx`        | N/A  | ✅              | N/A                  | ✅ 41L  | ✅                |
| `widget-sample-data.ts`            | N/A  | N/A             | N/A                  | ✅ 133L | N/A               |
| `chart-color-utils.ts`             | N/A  | N/A             | N/A                  | ✅ 9L   | N/A               |

---

## Positive Findings

- ✅ Uses `@plane/propel/button`, `@plane/propel/input`, `@plane/propel/toast` correctly
- ✅ Uses `@plane/propel/charts/*` for preview panel
- ✅ Semantic color tokens used consistently (except toolbar)
- ✅ MobX `observer()` wrapper on all store-reading components
- ✅ `react-hook-form` + `Controller` pattern matches Plane standard
- ✅ API service follows Plane's `APIService` pattern
- ✅ MobX store uses `makeObservable`, `runInAction`, `set()` correctly
- ✅ CE override pattern followed (components in `ce/`, store in `ce/store/`)
- ✅ File sizes mostly under 200 lines (1 exception)
- ✅ Uses `ModalCore` from `@plane/ui` (correct for web app)
- ✅ Uses `AlertModalCore` for delete confirmation (correct pattern)
- ✅ Uses `PageHead` for page titles
- ✅ Propel charts used for preview (BarChart, LineChart, PieChart, AreaChart)

---

## Recommended Fix Priority

1. **P0:** C2 — Fix wrong color tokens in toolbar (may break themes)
2. **P1:** C3 — Fix `bg-surface-1` → `bg-layer-2` in inputs/lists
3. **P1:** C1 — Add all missing i18n translations
4. **P2:** M2 — Replace custom dropdown with Propel Menu
5. **P2:** M3/M4 — Add AppHeader + ContentWrapper layout pattern
6. **P3:** M1 — Split oversized style-settings file
7. **P4:** N1 — Text scale standardization (optional)

---

## Unresolved Questions

- Should `dashboard-form-modal.tsx` (249 lines) also be split? It's close to the 200-line limit but has clear structure.
- Should chart-renderers use Propel charts directly instead of wrapping them? Current drill-down wrappers add click handling.
