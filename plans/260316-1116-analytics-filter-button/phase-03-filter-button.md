# Phase 3: Filter Button Component

## Overview

Create the filter button that wraps `FiltersDropdown` and conditionally renders based on active tab.

## Key Insights

- `FiltersDropdown` accepts: `children`, `icon`, `title`, `placement`, `isFiltersApplied`
- Reference usage in `ViewListHeader` (line 111-122): `icon={<ListFilter />}`, `title="Filters"`, `placement="bottom-end"`
- `isFiltersApplied` shows a blue dot indicator on the button
- Button should only appear on tabs: `projects`, `work-items`, `cycles`, `modules`, `intake`
- Hidden on: `overview`, `users`
- No `memberIds` / `workspaceMemberIds` needed (scope reduced to date filters only)

## Related Files

- `apps/web/core/components/views/view-list-header.tsx` -- reference `FiltersDropdown` usage (lines 111-122)
- `apps/web/core/components/issues/issue-layouts/filters/header/helpers/dropdown.tsx` -- `FiltersDropdown` component

## Architecture

```
AnalyticsFilterButton
  +-- (null if tab not in FILTERABLE_TABS)
  +-- FiltersDropdown
       +-- AnalyticsFilterSelection
```

## Implementation Steps

### 1. Create `apps/web/ce/components/analytics/filters/analytics-filter-button.tsx`

```typescript
import { observer } from "mobx-react";
import { ListFilter } from "lucide-react";
import type { TAnalyticsTabsBase } from "@plane/types";
import { FiltersDropdown } from "@/components/issues/issue-layouts/filters";
import { useAnalytics } from "@/hooks/store/use-analytics";
import { AnalyticsFilterSelection } from "./filter-selection";

const FILTERABLE_TABS: TAnalyticsTabsBase[] = ["projects", "work-items", "cycles", "modules", "intake"];

type Props = {
  activeTab: TAnalyticsTabsBase;
};

export const AnalyticsFilterButton = observer(function AnalyticsFilterButton({ activeTab }: Props) {
  const { tabFilters, updateTabFilters } = useAnalytics();

  if (!FILTERABLE_TABS.includes(activeTab)) return null;

  const isFiltersApplied = Object.values(tabFilters).some((value) => Array.isArray(value) && value.length > 0);

  return (
    <FiltersDropdown
      icon={<ListFilter className="h-3 w-3" />}
      title="Filters"
      placement="bottom-end"
      isFiltersApplied={isFiltersApplied}
    >
      <AnalyticsFilterSelection filters={tabFilters} handleUpdate={updateTabFilters} />
    </FiltersDropdown>
  );
});
```

## Todo

- [x] Create `apps/web/ce/components/analytics/filters/analytics-filter-button.tsx`
- [x] Import `FiltersDropdown`, `AnalyticsFilterSelection`, store hook
- [x] Implement `FILTERABLE_TABS` guard
- [x] Implement `isFiltersApplied` check
- [x] Render dropdown with filter selection

## Success Criteria

- Button renders only on 5 filterable tabs
- Returns null on `overview` and `users` tabs
- Blue dot appears when either date filter has values
- Dropdown opens with filter panel
- File < 50 lines

## Risk Assessment

- Low risk. Simple conditional rendering + composition of existing components.

## Next Steps

Phase 4: Wire the button into the analytics header + add tab-change filter clear.
