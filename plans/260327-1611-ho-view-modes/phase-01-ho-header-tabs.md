# Phase 1: HO Header — View Tab Navigation

## Context Links

- [Plan Overview](./plan.md)
- Current HO layout: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/layout.tsx`
- Current HO page: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx`
- Current HO department list: `apps/web/ce/components/ho/department-list.tsx`
- Pattern reference: `apps/web/core/components/workspace/views/header.tsx` (GlobalViewsHeader)

## Overview

- **Priority**: P1
- **Status**: pending
- **Effort**: 0.5d
- **Description**: Add a secondary header navigation below the main HO header with three tabs: Department (default), Datasheet, Category. Tab state persists in URL search params.

## Key Insights

- Current `ho/layout.tsx` uses `AppHeader` + `ContentWrapper` + `Outlet`. We keep this and add a secondary tab bar.
- Pattern for secondary tabs: use `Header` with `EHeaderVariant.SECONDARY` (same as `GlobalViewsHeader`).
- URL search param `?view=department|datasheet|category` — use React Router's `useSearchParams` for reading and `Link`/`useNavigate` for navigation.
- Active tab highlighted with `text-accent-primary` + `border-b-2 border-accent-primary` styling (match workspace views pattern).
- No store needed for tab state — URL is the source of truth.
- `ho/page.tsx` reads `?view` param and renders the matching view component.

## Requirements

### Functional

- Three tabs: Department (default when no param), Datasheet, Category
- Clicking a tab changes `?view` param, preserves `workspaceSlug`
- Active tab styled distinctly
- Tab bar matches visual style of workspace views secondary header

### Non-functional

- No extra re-renders — tabs use `NavLink` or computed active state from URL param
- Accessible: tab role or `aria-selected`

## Architecture

```
ho/layout.tsx
  └─ AppHeader (title "HO")
  └─ HoViewTabs (NEW — secondary header with 3 tabs)
  └─ ContentWrapper
      └─ Outlet → ho/page.tsx

ho/page.tsx
  reads ?view param
  renders:
    "department" (default) → <HoDepartmentList />
    "datasheet"            → <HoDatasheetView />   (Phase 4)
    "category"             → <HoCategoryView />     (Phase 5)
```

### Tab definitions

```ts
const HO_VIEW_TABS = [
  { key: "department", label: "Department" },
  { key: "datasheet", label: "Datasheet" },
  { key: "category", label: "Category" },
] as const;
type THoViewKey = (typeof HO_VIEW_TABS)[number]["key"];
```

## Related Code Files

- **Modify**: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/layout.tsx`
- **Modify**: `apps/web/app/(all)/[workspaceSlug]/(projects)/ho/page.tsx`
- **Create**: `apps/web/ce/components/ho/ho-view-tabs.tsx`

## Embedded Rules

```
- CE pattern: new components go in apps/web/ce/components/ho/
- observer() from mobx-react on all MobX-reading components (not needed here — no MobX)
- @plane/propel/* subpath imports for new code
- Semantic tokens: text-primary, text-secondary, border-subtle, bg-surface-1
- AppHeader + ContentWrapper + Outlet in layout.tsx — preserve this structure
- URL search params via React Router useSearchParams / Link — never localStorage for nav state
- Prettier: 120-char line width, trailing comma es5
- File <200 lines for code, <150 lines for components
```

## Implementation Steps

1. **Create `ho-view-tabs.tsx`** in `apps/web/ce/components/ho/`:

   ```tsx
   // Uses useSearchParams to detect active tab
   // Renders Header variant=SECONDARY with 3 NavLink-style tabs
   // Active tab: border-b-2 border-accent-primary text-accent-primary
   // Inactive: text-secondary hover:text-primary
   const HO_VIEW_TABS = [
     { key: "department", label: "Department" },
     { key: "datasheet", label: "Datasheet" },
     { key: "category", label: "Category" },
   ] as const;
   ```

   Use `Link` from `react-router` with `search` prop to set `?view=X`.

2. **Modify `ho/layout.tsx`**:
   - Import and render `<HoViewTabs />` between `AppHeader` and `ContentWrapper`
   - Keep existing structure intact

3. **Modify `ho/page.tsx`**:
   - Use `useSearchParams` to read `view` param (default `"department"`)
   - Render `<HoDepartmentList />` for `department`
   - Render `<HoDatasheetView />` for `datasheet` (placeholder `<div>Coming soon</div>` until Phase 4)
   - Render `<HoCategoryView />` for `category` (placeholder until Phase 5)

4. **Verify**: Click all tabs, check URL changes, check active tab styling. Check no console errors.

## Post-Phase Checklist

- [ ] `pnpm check:lint` — 0 errors
- [ ] Tab navigation changes URL `?view` param correctly
- [ ] Default tab (no param or `?view=department`) shows `HoDepartmentList`
- [ ] Active tab has distinct styling vs inactive
- [ ] File sizes: `ho-view-tabs.tsx` < 80 lines, `page.tsx` < 60 lines
- [ ] No MobX imports (not needed for tab nav)

## Todo List

- [ ] Create `ho-view-tabs.tsx`
- [ ] Update `ho/layout.tsx` to include tabs
- [ ] Update `ho/page.tsx` for conditional rendering

## Success Criteria

- Three tabs visible in HO header
- URL reflects active tab
- Department view renders as before
- Datasheet and Category show placeholder (filled in later phases)

## Risk Assessment

- Low risk — UI-only change, no data fetching
- Existing `HoDepartmentList` unchanged

## Security Considerations

- URL param is read-only for display routing — no security concern
- Existing access control in `HoDepartmentList` unchanged

## Next Steps

- Phases 2+3 (backend + store) must complete before replacing placeholders in Phase 4+5
