# Phase 02: Add i18n Translations

## Context Links

- [Design Audit Report](../reports/design-review-260302-1619-dashboard-design-audit.md) — C1
- [i18n keys file](../../packages/i18n/src/locales/en/translations.ts) — line 3144+

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Replace all hardcoded English strings in 8 dashboard files with `t()` calls. Many keys already exist in `analytics_dashboard.*` namespace — this phase wires them up and adds missing ones.

## Key Insights

- Many translation keys already exist (added during initial implementation) but some page/component files don't use `useTranslation()`
- Files that already import `useTranslation`: `dashboard-list-header.tsx`, `dashboard-form-modal.tsx`, `widget-config-modal.tsx`, `filter-settings-section.tsx`, `style-settings-section.tsx`, `display-settings-section.tsx`, `widget-context-menu.tsx`, `widget-type-selector.tsx`
- Files missing `useTranslation`: `page.tsx` (list), `[dashboardId]/page.tsx`, `dashboard-toolbar.tsx`, `dashboard-card.tsx`, `dashboard-delete-modal.tsx`, `widget-adapter.tsx`, `custom-dashboard-widget-card.tsx`

## Requirements

- Zero hardcoded user-facing English strings in dashboard files
- All new keys added under `analytics_dashboard.*` namespace in EN translations
- Existing keys reused where possible

## Related Code Files

### Files to modify

| File                               | Location                                                                                         | Hardcoded strings                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| `dashboards/page.tsx`              | `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`                              | Toast messages, empty state text                       |
| `[dashboardId]/page.tsx`           | `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`                | Breadcrumb, button labels, empty state, toasts         |
| `dashboard-toolbar.tsx`            | `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/dashboard-toolbar.tsx`   | Button labels: "Add Widget", "Refresh", "Done", "Edit" |
| `dashboard-card.tsx`               | `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx`         | "Public", "Private", "Edit", "Delete", widget count    |
| `dashboard-list-header.tsx`        | `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-list-header.tsx`  | "Create and manage dashboards", "New Dashboard"        |
| `dashboard-delete-modal.tsx`       | `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-delete-modal.tsx` | "Delete Dashboard", confirmation text                  |
| `widget-adapter.tsx`               | `apps/web/ce/components/dashboards/widget-adapter.tsx`                                           | "No data available...", "Chart type...not supported"   |
| `custom-dashboard-widget-card.tsx` | `apps/web/ce/components/dashboards/custom-dashboard-widget-card.tsx`                             | "Loading..."                                           |
| `translations.ts`                  | `packages/i18n/src/locales/en/translations.ts`                                                   | Add missing keys                                       |

## Embedded Rules

- **i18n pattern:** `import { useTranslation } from "@plane/i18n"` → `const { t } = useTranslation()` → `t("analytics_dashboard.key")`
- For non-hook contexts (observer arrow functions), call `useTranslation()` inside the component body
- Namespace: all dashboard keys under `analytics_dashboard.*`
- Pluralization: use ICU format `{count, plural, one {# widget} other {# widgets}}`
- Import order: `@plane/i18n` goes in group 3 (@plane/\* packages)

## Implementation Steps

### Step 1: Add missing translation keys to EN

**File:** `packages/i18n/src/locales/en/translations.ts` — inside `analytics_dashboard: {}`

Add these keys (some already exist — verify before adding):

```typescript
// page.tsx (list) — toasts already exist as created_success, create_failed, etc.
// page.tsx (list) — empty state
empty_title: "No dashboards created yet",
create_first: "Create your first dashboard to get started.",
create_dashboard: "Create Dashboard",
success: "Success!",

// [dashboardId]/page.tsx — breadcrumb + buttons + empty
breadcrumb_dashboards: "Dashboards",
add_widget: "Add Widget",
no_data_filters: "No data available for these filters.",
chart_type_unsupported: "Chart type \"{type}\" is not supported yet.",

// dashboard-card.tsx
access_public: "Public",
access_private: "Private",
widget_count: "{count, plural, one {# widget} other {# widgets}}",

// dashboard-list-header.tsx — keys exist: list_description, but button text missing
new_dashboard: "New Dashboard",

// dashboard-delete-modal.tsx
delete_title: "Delete Dashboard",

// custom-dashboard-widget-card.tsx
loading: "Loading...",
```

**Important:** Check which keys already exist before adding. Existing keys found:

- `add_widget` → line 3177
- `empty_widgets` → line 3233
- `created_success`, `create_failed`, `updated_success`, `update_failed`, `deleted_success`, `delete_failed` → lines 3235-3240
- `empty_description` → line 3241 (similar but not exact match)
- `list_description` → line 3242
- `delete_confirm_prefix`, `delete_confirm_suffix` → lines 3243-3244
- `refresh`, `done`, `edit_mode` → lines 3218-3220
- `context_edit`, `context_delete` → lines 3211, 3214
- `widget_deleted`, `delete_widget_failed` → lines 3224-3225

### Step 2: Wire up `dashboards/page.tsx` (list page)

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/page.tsx`

Already imports `useTranslation`. Replace:

1. Line 46-48: Toast success → `t("analytics_dashboard.success")`, `t("analytics_dashboard.created_success")`
2. Line 50: Toast error → `t("analytics_dashboard.create_failed")`
3. Line 63-66: Toast success → `t("analytics_dashboard.success")`, `t("analytics_dashboard.updated_success")`
4. Line 69: Toast error → `t("analytics_dashboard.update_failed")`
5. Line 81-84: Toast success → `t("analytics_dashboard.success")`, `t("analytics_dashboard.deleted_success")`
6. Line 87: Toast error → `t("analytics_dashboard.delete_failed")`
7. Lines 116-118: Empty state text → `t("analytics_dashboard.empty_title")` + `t("analytics_dashboard.create_first")`
8. Line 121: Button text → `t("analytics_dashboard.create_dashboard")`

### Step 3: Wire up `[dashboardId]/page.tsx` (detail page)

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`

Add `import { useTranslation } from "@plane/i18n"` and `const { t } = useTranslation()`.

1. Line 73: "Dashboards" → `t("analytics_dashboard.breadcrumb_dashboards")`
2. Line 80: "Add Widget" → `t("analytics_dashboard.add_widget")`
3. Line 54: Toast "Widget deleted" → `t("analytics_dashboard.widget_deleted")`
4. Line 56: Toast "Failed to delete widget" → `t("analytics_dashboard.delete_widget_failed")`
5. Line 97: Empty state text → `t("analytics_dashboard.empty_widgets")`
6. Line 98: "Add Widget" button → `t("analytics_dashboard.add_widget")`
7. Line 141: Toast "Failed to save widget" → `t("analytics_dashboard.update_widget_failed")`

### Step 4: Wire up `dashboard-toolbar.tsx`

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/dashboard-toolbar.tsx`

Add `import { useTranslation } from "@plane/i18n"`. Convert from arrow expression to body with `const { t } = useTranslation()`.

1. Line 50: "Add Widget" → `t("analytics_dashboard.add_widget")`
2. Line 54: "Refresh" → `t("analytics_dashboard.refresh")`
3. Line 63: "Done"/"Edit" → `t("analytics_dashboard.done")` / `t("analytics_dashboard.edit_mode")`

### Step 5: Wire up `dashboard-card.tsx`

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx`

Add `import { useTranslation } from "@plane/i18n"` and `const { t } = useTranslation()`.

1. Line 52: "Public" → `t("analytics_dashboard.access_public")`
2. Line 57: "Private" → `t("analytics_dashboard.access_private")`
3. Line 81: "Edit" → `t("analytics_dashboard.context_edit")`
4. Line 91: "Delete" → `t("analytics_dashboard.context_delete")`
5. Line 105: widget count → `t("analytics_dashboard.widget_count", { count: dashboard.widgets.length })`

### Step 6: Wire up `dashboard-list-header.tsx`

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-list-header.tsx`

Already imports `useTranslation`.

1. Line 23: "Create and manage dashboards" → `t("analytics_dashboard.list_description")`
2. Line 27: "New Dashboard" → `t("analytics_dashboard.new_dashboard")`

### Step 7: Wire up `dashboard-delete-modal.tsx`

**File:** `apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-delete-modal.tsx`

Add `import { useTranslation } from "@plane/i18n"` and `const { t } = useTranslation()`.

1. Line 48: title "Delete Dashboard" → `t("analytics_dashboard.delete_title")`
2. Lines 50-54: content → use `t("analytics_dashboard.delete_confirm_prefix")` + name + `t("analytics_dashboard.delete_confirm_suffix")`

### Step 8: Wire up `widget-adapter.tsx`

**File:** `apps/web/ce/components/dashboards/widget-adapter.tsx`

Add `import { useTranslation } from "@plane/i18n"` and `const { t } = useTranslation()`.

1. Line 54: "No data available for these filters." → `t("analytics_dashboard.no_data_filters")`
2. Line 119: Chart type unsupported → `t("analytics_dashboard.chart_type_unsupported", { type: widget.chart_type })`

### Step 9: Wire up `custom-dashboard-widget-card.tsx`

**File:** `apps/web/ce/components/dashboards/custom-dashboard-widget-card.tsx`

Add `import { useTranslation } from "@plane/i18n"` and `const { t } = useTranslation()`.

1. Line 70: "Loading..." → `t("analytics_dashboard.loading")`

## Post-Phase Checklist

- [ ] No hardcoded English strings remain in any dashboard file
- [ ] All new keys added to `analytics_dashboard` namespace
- [ ] `useTranslation` imported in all files that use `t()`
- [ ] `observer()` wrapper preserved on all MobX components
- [ ] Import order follows standard: React → external → types → @plane/\* → @/ → relative
- [ ] `pnpm check:lint` passes
- [ ] Keys use consistent naming (snake_case, descriptive)

## Todo

- [ ] Add missing EN translation keys
- [ ] Wire up `dashboards/page.tsx`
- [ ] Wire up `[dashboardId]/page.tsx`
- [ ] Wire up `dashboard-toolbar.tsx`
- [ ] Wire up `dashboard-card.tsx`
- [ ] Wire up `dashboard-list-header.tsx`
- [ ] Wire up `dashboard-delete-modal.tsx`
- [ ] Wire up `widget-adapter.tsx`
- [ ] Wire up `custom-dashboard-widget-card.tsx`
- [ ] Lint check passes

## Success Criteria

- Zero hardcoded strings in dashboard files
- All keys resolve correctly in English
- No runtime errors from missing keys

## Risk Assessment

- **Medium:** Must verify all existing keys match intended text. Some keys exist but wording differs slightly (e.g., `empty_description` vs actual empty state text)
- ICU pluralization syntax must be correct for `widget_count`
- Non-EN locales will show key names until translated — acceptable for now

## Security Considerations

- Template interpolation in `chart_type_unsupported` uses `{type}` which comes from widget config. i18n libraries escape by default — verify no XSS vector.

## Next Steps

- Phase 3: Replace custom dropdown
