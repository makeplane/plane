---
phase: 3
title: "UI: Workspace/Project Selectors + Table Refactor"
status: pending
priority: P1
effort: 3h
blocked_by: [phase-02]
---

# Phase 3: UI Components + Table Refactor

## Context Links

- Analytics ProjectSelect pattern: `apps/web/core/components/analytics/select/project.tsx`
- `CustomSearchSelect` from `@plane/ui`
- `getButtonStyling` from `@plane/propel/button`
- Existing HO components: `apps/web/ce/components/ho/`

## Overview

Two tracks:

1. **Selectors**: New workspace + project dropdown components, integrated into toolbar
2. **Table UX**: Sticky headers, frozen first column, zebra rows, click-outside dismiss

## Related Code Files

**Create:**

- `apps/web/ce/components/ho/ho-workspace-select.tsx`
- `apps/web/ce/components/ho/ho-project-select.tsx`

**Modify:**

- `apps/web/ce/components/ho/ho-datasheet-toolbar.tsx`
- `apps/web/ce/components/ho/ho-datasheet-table.tsx`
- `apps/web/ce/components/ho/ho-datasheet-header.tsx`
- `apps/web/ce/components/ho/ho-datasheet-row.tsx`
- `apps/web/ce/components/ho/ho-datasheet-display-props.tsx`
- `apps/web/ce/components/ho/ho-category-view.tsx`
- `apps/web/ce/components/ho/ho-category-table.tsx`
- `apps/web/ce/components/ho/ho-category-row.tsx`
- `apps/web/ce/components/ho/ho-datasheet-view.tsx`

**Modify (i18n):**

- `packages/i18n/src/locales/en/translations.ts`
- `packages/i18n/src/locales/ko/translations.ts`
- `packages/i18n/src/locales/vi/translations.ts`

## Implementation Steps

### 1. Add i18n keys

Add `ho` section to all 3 translation files:

```typescript
ho: {
  all_workspaces: "All workspaces",
  all_projects: "All projects",
  select_workspace_first: "Select a workspace first",
  display: "Display",
  display_properties: "Display Properties",
  from: "From",
  to: "To",
  no_work_items: "No work items found.",
  no_matching_rows: "No matching rows.",
  no_data: "No data found.",
  load_more: "Load more ({loaded} / {total})",
  loading: "Loading...",
  category: "Category",
  search: "Search...",
},
```

### 2. Create `ho-workspace-select.tsx` (~60 lines)

```typescript
import { observer } from "mobx-react";
import { getButtonStyling } from "@plane/propel/button";
import { ChevronDownIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";
import { Building2 } from "lucide-react";

export const HoWorkspaceSelect = observer(function HoWorkspaceSelect() {
  const { t } = useTranslation();
  const store = useHoIssues();

  // Validation Session 1: prepend sentinel "All workspaces" option so user can deselect workspace
  const options = [
    {
      value: "",
      query: t("ho.all_workspaces"),
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0 text-custom-text-300" />
          <span className="truncate text-custom-text-300">{t("ho.all_workspaces")}</span>
        </div>
      ),
    },
    ...store.accessibleWorkspaces.map((ws) => ({
      value: ws.slug,
      query: ws.name,
      content: (
        <div className="flex items-center gap-2 max-w-[250px]">
          <Building2 className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{ws.name}</span>
        </div>
      ),
    })),
  ];

  const selectedName = store.selectedWorkspaceSlug
    ? store.accessibleWorkspaces.find((w) => w.slug === store.selectedWorkspaceSlug)?.name
    : null;

  return (
    <CustomSearchSelect
      value={store.selectedWorkspaceSlug ?? ""}
      onChange={(val: string) => store.setWorkspaceFilter(val || null)}
      options={options}
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <Building2 className="h-4 w-4" />
          {selectedName ?? t("ho.all_workspaces")}
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
    />
  );
});
```

**Key design decisions:**

- Single-select (not `multiple`) — selecting workspace enables project sub-filter
- `Building2` lucide icon for workspace (consistent with Plane patterns)
- Empty string onChange -> `null` to clear filter

### 3. Create `ho-project-select.tsx` (~65 lines)

```typescript
import { observer } from "mobx-react";
import { getButtonStyling } from "@plane/propel/button";
import { ChevronDownIcon, ProjectIcon } from "@plane/propel/icons";
import { CustomSearchSelect } from "@plane/ui";
import { cn } from "@plane/utils";
import { useTranslation } from "@plane/i18n";
import { useHoIssues } from "@/hooks/store/use-ho-issues";

export const HoProjectSelect = observer(function HoProjectSelect() {
  const { t } = useTranslation();
  const store = useHoIssues();

  const workspace = store.accessibleWorkspaces.find((w) => w.slug === store.selectedWorkspaceSlug);

  if (!workspace) return null; // hidden when no workspace selected

  const options = workspace.projects.map((p) => ({
    value: p.id,
    query: `${p.name} ${p.identifier}`,
    content: (
      <div className="flex items-center gap-2 max-w-[250px]">
        <ProjectIcon className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{p.name}</span>
      </div>
    ),
  }));

  const label =
    store.selectedProjectIds.length > 3
      ? `3+ projects`
      : store.selectedProjectIds.length > 0
        ? workspace.projects
            .filter((p) => store.selectedProjectIds.includes(p.id))
            .map((p) => p.name)
            .join(", ")
        : t("ho.all_projects");

  return (
    <CustomSearchSelect
      value={store.selectedProjectIds}
      onChange={(val: string[]) => store.setProjectFilter(val)}
      options={options}
      className="border-none p-0"
      customButton={
        <div className={cn(getButtonStyling("secondary", "lg"), "gap-2")}>
          <ProjectIcon className="h-4 w-4" />
          <span className="max-w-[200px] truncate">{label}</span>
          <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
        </div>
      }
      customButtonClassName="border-none p-0 bg-transparent hover:bg-transparent w-auto h-auto"
      multiple
    />
  );
});
```

**Key decisions:**

- Multi-select (user can pick multiple projects)
- Returns `null` when no workspace selected (hidden)
- Shows project count when >3 selected

### 4. Refactor `ho-datasheet-toolbar.tsx`

Add workspace + project selectors left of Display button. Add click-outside dismiss. Add `useEffect` to fetch workspaces.

```tsx
// Updated layout
<div className="relative flex items-center justify-between gap-3 border-b border-subtle bg-surface-1 px-page-x py-2">
  {/* Left: Date pickers */}
  <div className="flex items-center gap-2">
    {/* existing date inputs with t() labels */}
  </div>

  {/* Right: Filters + Display */}
  <div className="flex items-center gap-2">
    <HoWorkspaceSelect />
    <HoProjectSelect />
    <button ...> {/* Display toggle */} </button>
  </div>

  {/* Display props popover with click-outside */}
  {showDisplayProps && (
    <div ref={displayRef} className="absolute right-4 top-10 z-30">
      <HoDatasheetDisplayProps />
    </div>
  )}
</div>
```

Add click-outside handler:

```typescript
const displayRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (!showDisplayProps) return;
  const handler = (e: MouseEvent) => {
    if (displayRef.current && !displayRef.current.contains(e.target as Node)) {
      setShowDisplayProps(false);
    }
  };
  document.addEventListener("mousedown", handler);
  return () => document.removeEventListener("mousedown", handler);
}, [showDisplayProps]);
```

Replace all hardcoded strings with `t()` calls.

### 5. Refactor `ho-datasheet-view.tsx`

Add `useEffect` to fetch workspaces on mount. The store's `fetchAccessibleWorkspaces` has a dedup guard (skips if already loading or populated), so calling it from both views is safe — only one actual request fires.

```typescript
useEffect(() => {
  void store.fetchAccessibleWorkspaces();
}, [store]);
```

Add loading overlay for filter changes using `store.isFetchingIssues`:

```tsx
{
  store.isFetchingIssues && (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-surface-1/50">
      <Spinner />
    </div>
  );
}
```

Replace hardcoded strings with `t()`.

### 6. Refactor `ho-category-view.tsx`

Add workspace + project selectors to header area (between title and date pickers):

```tsx
<div className="flex flex-wrap items-center gap-2">
  <HoWorkspaceSelect />
  <HoProjectSelect />
  {/* date pickers */}
  {/* search */}
</div>
```

Add `useEffect` for `fetchAccessibleWorkspaces` on mount.
Replace hardcoded strings with `t()`.

### 7. Table UX: `ho-datasheet-table.tsx` — Sticky header + scroll container

```tsx
<div className="relative overflow-x-auto overflow-y-auto horizontal-scrollbar scrollbar-lg max-h-[calc(100vh-200px)]">
  <table className="w-full border-collapse text-left">
    {/* thead gets sticky class */}
    <HoDatasheetHeader ... />
    <tbody>
      {issues.map(...)}
    </tbody>
  </table>
</div>
```

> **VALIDATE before shipping:** `sticky top-0` on `<thead>` works only when the `overflow-y-auto` div above is the actual scroll root. If the outer page/layout is the scroll root, the header sticks to viewport and overlaps the toolbar. Measure the actual height of all fixed/sticky content above this container and replace `200px` with the correct value. Verify in the browser that the header sticks to the container, not the viewport.

### 8. Table UX: `ho-datasheet-header.tsx` — Sticky header + frozen first visible column

<!-- Updated: Validation Session 1 - 200px offset must be measured in browser during implementation -->

Add to `<thead>`: `className="sticky top-0 z-20"`

For the first rendered `<th>`, add: `sticky left-0 z-10 bg-surface-1`

The first column is determined dynamically by checking which display property is first enabled. Implementation:

```typescript
// Find first visible column key
const firstVisibleKey = Object.keys(COL_META).find((key) => key === "name" || displayProperties[key] !== false);

// In renderTh, add sticky class if key === firstVisibleKey
const stickyClass = key === firstVisibleKey ? "sticky left-0 z-10" : "";
```

### 9. Table UX: `ho-datasheet-row.tsx` — Frozen first column cell

Same logic: first visible `<td>` gets `sticky left-0 z-[5]` — **do NOT use `bg-inherit`**.

`bg-inherit` on sticky table cells does not reliably inherit `<tr>` stripe backgrounds in browsers (table stacking context issue). Instead, apply explicit background classes conditionally based on row index:

```typescript
// In the row component, receive rowIndex as prop
const frozenBg = rowIndex % 2 === 0 ? "bg-surface-1" : "bg-surface-2";
// Apply to the frozen <td>:
// className={cn("sticky left-0 z-[5]", frozenBg, "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]")}
```

Or use CSS custom property if `odd/even` pseudo-classes are not accessible in JSX.

Current zebra: `odd:bg-surface-1 even:bg-surface-2` — already present, keep as-is.

### 10. Table UX: `ho-category-table.tsx` — Same sticky/scroll treatment

Add sticky header, frozen first column (always "Department").

### 11. Table UX: `ho-category-row.tsx` — Frozen first column

First `<td>` (department_name) gets `sticky left-0 z-[5]` with explicit background (same `bg-inherit` avoidance as step 9).

### 12. `ho-datasheet-display-props.tsx` — i18n strings

Replace `COLUMN_LABELS` hardcoded strings with `t()` calls. Replace "Display Properties" label.

### 13. `ho-datasheet-header.tsx` — i18n strings

Replace `COL_META` label values with `t()` calls. Replace "Ascending", "Descending", "Clear sort".

## Todo List

- [ ] Add `ho.*` i18n keys to en/ko/vi translation files
  - [ ] After adding en keys, grep for all `ho\.` keys and verify identical set exists in ko + vi
  - [ ] ko/vi: use machine translations; add `// TODO: native review` comment on each translated string
- [ ] Create `ho-workspace-select.tsx`
- [ ] Create `ho-project-select.tsx`
- [ ] Refactor `ho-datasheet-toolbar.tsx` — add selectors + click-outside + i18n
- [ ] Refactor `ho-datasheet-view.tsx` — fetch workspaces on mount + `isFetchingIssues` overlay + i18n
- [ ] Refactor `ho-category-view.tsx` — add selectors + fetch workspaces + i18n
- [ ] Refactor `ho-datasheet-table.tsx` — sticky header + scroll container
  - [ ] Validate `sticky top-0` sticks to container (not viewport); measure and fix `200px` offset
- [ ] Refactor `ho-datasheet-header.tsx` — sticky header + frozen first col + i18n
- [ ] Refactor `ho-datasheet-row.tsx` — frozen first col with explicit `bg-surface-1/2` (not `bg-inherit`)
- [ ] Refactor `ho-category-table.tsx` — sticky header + frozen first col
- [ ] Refactor `ho-category-row.tsx` — frozen first col with explicit background
- [ ] Refactor `ho-datasheet-display-props.tsx` — i18n
- [ ] Run `pnpm check:lint` on all modified files

## Failure Modes

| Risk                                                        | Likelihood | Impact | Mitigation                                                                                                      |
| ----------------------------------------------------------- | ---------- | ------ | --------------------------------------------------------------------------------------------------------------- |
| `CustomSearchSelect` single-select API differs from multi   | Medium     | High   | Verify by reading `custom-search-select.tsx` source — if no `multiple` prop, it returns single value by default |
| Sticky header z-index conflicts with display props popover  | Medium     | Medium | Display props popover z-30; header z-20; sorted correctly                                                       |
| Frozen column shadow/overlap on scroll                      | Low        | Low    | Add `shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]` to frozen column for visual separation                            |
| Category view file exceeds 150 lines after adding selectors | Medium     | Low    | Already 100L; selectors add ~8 lines (components are separate). Safe.                                           |
| i18n keys missing from ko/vi                                | Low        | High   | Script check: grep for all `ho.` keys in en, verify present in ko/vi                                            |

## Success Criteria

- Workspace dropdown appears left of Display button in datasheet toolbar
- Workspace dropdown appears in category view header
- Selecting workspace filters data in both views
- Project dropdown appears only when workspace is selected
- Selecting project(s) further filters data
- Table headers stick on vertical scroll
- First column stays frozen on horizontal scroll
- Display props popover dismisses on click outside
- All visible strings use `t()` from i18n
- No files exceed 200 lines (components <150)
- `pnpm check:lint` passes

## Test Matrix

| Scenario                          | Expected                                             |
| --------------------------------- | ---------------------------------------------------- |
| Load page, no filter              | All workspaces data shown                            |
| Select workspace                  | Data filtered to workspace, project selector appears |
| Select workspace + 2 projects     | Data filtered to workspace + projects                |
| Clear workspace (select "All")    | All data shown, project selector hidden              |
| Horizontal scroll                 | First column stays frozen                            |
| Vertical scroll (many rows)       | Header stays sticky                                  |
| Click outside display props       | Popover closes                                       |
| Switch between datasheet/category | Filters persist (shared store)                       |
