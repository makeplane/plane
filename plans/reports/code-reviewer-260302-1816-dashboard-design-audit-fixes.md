# Code Review: Dashboard Design Audit Fixes

**Date:** 2026-03-02
**Scope:** 5-phase design audit across 13 modified + 3 created files
**Lint:** 0 errors, 4488 pre-existing warnings (no new issues)

---

## Scope

- **Files reviewed:** 16 total (13 modified, 3 created)
- **LOC estimate:** ~900 lines changed/added
- **Focus:** Color token correctness, i18n key completeness, Menu API usage, ContentWrapper integration, style-settings split behavioral parity
- **Scout findings:** Token inconsistency in new sub-sections; vi/ko locales missing new keys; `ellipsis` + `customButton` redundancy; dual page file structure; overflow-hidden retained in routes detail page

---

## Overall Assessment

Solid quality work across 5 phases. The refactors are clean, the i18n wiring is thorough, and the style-settings split maintains identical public API. Three medium-priority issues need attention: residual `bg-surface-1` in the new style sub-sections (inconsistent with the Phase 1 audit goal), vi/ko locales missing new translation keys, and a redundant Menu prop. No critical or breaking issues found.

---

## Critical Issues

None.

---

## High Priority

None.

---

## Medium Priority

### M1 - `bg-surface-1` retained in new style sub-sections

Phase 1 audited and replaced `bg-surface-1` with `bg-layer-2` in form inputs. The newly created sub-sections in Phase 5 still use `bg-surface-1` for the unselected state of segmented button groups.

**Files:**

- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/config/style-chart-options-section.tsx` - lines 91, 122
- `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/config/style-number-widget-section.tsx` - line 46

**Affected class strings:**

```
"border-color-subtle bg-surface-1 text-color-secondary hover:bg-layer-1"
```

These are button/chip unselected states, not input backgrounds. Whether `bg-surface-1` is correct here depends on the design system's intended layering - if the modal interior is `bg-layer-2` (as per Phase 1 fixes to the project list container), then unselected buttons sitting on top should use `bg-surface-1` or `bg-layer-1`, not `bg-layer-2`. However if the intent was a blanket audit to replace all `bg-surface-1`, these were missed. Verify with design intent.

### M2 - vi/ko locales missing new translation keys

`packages/i18n/src/locales/en/translations.ts` received 16+ new `analytics_dashboard` keys. The vi and ko locale files end without these keys:

Missing from both `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/vi/translations.ts` and `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/ko/translations.ts`:

```
empty_title
create_first
create_dashboard
success
breadcrumb_dashboards
new_dashboard
delete_title
access_public
access_private
widget_count
no_data_filters
chart_type_unsupported
loading
```

When users browse in vi or ko, the i18n library will fall back to the key string itself (e.g. `"analytics_dashboard.empty_title"` renders verbatim). This is a UX regression for those locales.

### M3 - Redundant `ellipsis` prop alongside `customButton`

In `dashboard-card.tsx` the `Menu` is rendered with both `ellipsis` and `customButton` props:

```tsx
// /Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/dashboards/components/dashboard-card.tsx lines 73-75
<Menu
  ellipsis
  customButton={
    <div className="flex h-6 w-6 items-center justify-center rounded hover:bg-layer-1">
      <MoreHorizontal className="h-4 w-4 text-color-secondary" />
    </div>
  }
>
```

Per the Propel Menu source (`packages/propel/src/menu/menu.tsx` line 133), `customButton` takes priority and `ellipsis` is silently ignored when `customButton` is provided. Not broken, but misleading. Remove `ellipsis` prop.

---

## Low Priority

### L1 - Dual page file structure: `app/(all)/...` vs `app/routes/(all)/...`

The `DashboardToolbar` is imported only in `app/routes/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`, not in `app/(all)/[workspaceSlug]/(projects)/dashboards/[dashboardId]/page.tsx`. The latter has its own inline header. The `[dashboardId]/page.tsx` listed in the changed files summary is the `app/(all)/...` version which does NOT use `DashboardToolbar` - the routes version does. This dual-file structure is pre-existing but worth noting to avoid confusion about which file is actually served.

### L2 - ContentWrapper double scroll context

`ContentWrapper` in `core/components/core/content-wrapper.tsx` renders:

```tsx
<div className="h-full w-full overflow-hidden">
  <div className="relative h-full w-full overflow-x-hidden overflow-y-scroll ...">
```

The routes detail page (`app/routes/.../[dashboardId]/page.tsx`) retains its own:

```tsx
<div className="flex h-full flex-col overflow-hidden relative">
  <div className="flex-1 overflow-auto p-4 relative z-0">
```

The layout wraps with `ContentWrapper` (outer scroll), and the detail page adds `overflow-auto` on the content area (inner scroll). Two scroll contexts stacked - the inner `overflow-auto` with `flex-1` inside a `ContentWrapper` that already sets `overflow-y-scroll` may produce no visible scrollbar on the inner div since the outer container scrolls first. Verify scroll behavior on the detail page in production. The `overflow-hidden` on the outermost `flex-col` div inside the page is intentional (toolbar + scrollable content pattern), but combined with the outer `ContentWrapper`, it effectively clips the outer scroll context. This is only in the routes version which is the one actually rendering.

### L3 - `StyleChartOptionsSection` not wrapped in `observer()`

The `StyleColorPresetSection`, `StyleChartOptionsSection`, and `StyleNumberWidgetSection` are plain functions, while the coordinator `StyleSettingsSection` uses `observer()`. The sub-sections use `useTranslation()` (not MobX) so `observer()` is not required. Consistent with other non-store-reading components in the codebase. No issue, just confirming intentionality.

### L4 - `filter-settings-section.tsx`: "to" separator is hardcoded English

```tsx
// /Volumes/Data/SHBVN/plane.so/apps/web/ce/components/dashboards/config/filter-settings-section.tsx line ~75
<span className="text-xs text-color-tertiary">to</span>
```

The "to" between date range inputs is not wrapped in `t()`. Pre-existing issue (not introduced in Phase 2), but Phase 2 was the i18n pass and this was missed.

---

## Edge Cases Found by Scout

1. **`bg-surface-1` in split sub-sections** - Phase 1 token replacements didn't extend into the Phase 5 newly-created sub-section files (M1 above).
2. **vi/ko locale gap** - en got 13+ new keys, vi and ko were not updated (M2 above).
3. **`ellipsis` prop redundancy** - `customButton` renders instead of the ellipsis icon; prop is dead code (M3 above).
4. **ContentWrapper + inner overflow-auto layering** - double scroll context on detail page (L2 above).
5. **routes vs app dual page structure** - `DashboardToolbar` only used in routes version; (all) version has inline header (L1 above).

---

## Positive Observations

- Phase 5 split is clean: coordinator (`StyleSettingsSection`) correctly derives all boolean flags from `chartType` before passing them down. Logic is identical to the pre-split monolith. Public API is preserved.
- `widget-adapter.tsx` regex guard for `text_color` (`/^#[\da-fA-F]{3,8}$/`) is a good defensive security practice against style injection.
- `DashboardFormModal` correctly resets form state in `handleClose` - no stale state leak on reopen.
- `dashboard-delete-modal.tsx` properly resets `isDeleting` in catch block, preventing permanently disabled submit button on error.
- ICU plural format for `widget_count` (`{count, plural, one {# widget} other {# widgets}}`) is consistent with other plural keys in the codebase.
- `common.reset` key resolves correctly - `reset` is within the `common` namespace (verified at line 942, within `common` block 691-969).
- `analytics_dashboard.success` key exists at line 3267 - used correctly in list page toasts.
- Barrel export `config/index.ts` correctly omits the new sub-section files (they are internal to `style-settings-section.tsx`), preserving the intended encapsulation.
- `stopPropagation` on the menu wrapper div in `dashboard-card.tsx` correctly prevents card navigation when opening the dropdown.

---

## Recommended Actions

1. **(Medium) Verify and fix `bg-surface-1` in style sub-sections** - if Phase 1's intent was to replace all `bg-surface-1` inside modal forms, update lines 91/122 in `style-chart-options-section.tsx` and line 46 in `style-number-widget-section.tsx`. If unselected button state is intentionally `bg-surface-1`, document why.

2. **(Medium) Add missing keys to vi and ko locale files** - mirror the new `analytics_dashboard` keys added to en into `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/vi/translations.ts` and `/Volumes/Data/SHBVN/plane.so/packages/i18n/src/locales/ko/translations.ts`.

3. **(Medium) Remove `ellipsis` from `DashboardCard` Menu** - `customButton` takes over; `ellipsis` is dead:

   ```diff
   - <Menu ellipsis customButton={...}>
   + <Menu customButton={...}>
   ```

4. **(Low) Investigate double scroll on detail page** - test scroll behavior on the routes detail page with `ContentWrapper` wrapping. If inner `flex-1 overflow-auto` div never scrolls, remove it and rely on `ContentWrapper`'s scroll.

5. **(Low) Add `t("to")` or a common separator key for the date range "to" text** in `filter-settings-section.tsx`.

---

## Metrics

- **Type Coverage:** No new `any` types introduced beyond pre-existing `Control<any>` (justified by react-hook-form generic constraints)
- **Test Coverage:** No tests added/modified (consistent with UI-only changes)
- **Lint Issues:** 0 new errors

---

## Unresolved Questions

1. Is `bg-surface-1` the correct token for unselected segmented button states within modal interiors, or should it be `bg-layer-1`? Design system docs (`docs/design-guidelines.md`) show `bg-surface-1` for card/container backgrounds but do not specify button unselected states.
2. Are the `app/(all)/...` page files actively served or are they superseded by `app/routes/(all)/...`? If the former is dead code, it should be removed to reduce confusion.
3. Is the Phase 4 `ContentWrapper` layout change tested on the routes detail page specifically (not just the list page)?
