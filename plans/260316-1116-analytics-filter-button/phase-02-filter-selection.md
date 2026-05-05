# Phase 2: Filter Selection Component

## Overview

Create the filter selection panel rendered inside the dropdown. Only `start_date` and `target_date` date filters.

## Key Insights

- `ViewFiltersSelection` (Views feature) is the reference implementation pattern
- Look for an existing date filter component (e.g. `FilterCreatedDate` at `@/components/common/filters/created-at`) — check if it can be reused for `start_date`/`target_date` by passing a different `filterKey`
- If no generic date filter exists, copy the `FilterCreatedDate` pattern and adapt for each field
- Each filter section wrapped in `<div className="py-2">` with `divide-y` parent

## Related Files

- `apps/web/core/components/views/filters/filter-selection.tsx` -- reference pattern
- `apps/web/core/components/common/filters/created-at.tsx` -- `FilterCreatedDate` reference

## Architecture

<!-- Updated: Validation Session 2 - Use generic FilterDate component -->

```
AnalyticsFilterSelection (CE component)
  +-- FilterDate title="Start date" (start_date)
  +-- FilterDate title="Target date" (target_date)
```

## Implementation Steps

### 1. Create `apps/web/ce/components/analytics/filters/filter-date.tsx`

<!-- Updated: Validation Session 2 - Generic component with title prop, searchQuery="" -->

No existing generic date filter component — create one in the CE filters directory:

```typescript
import React, { useState } from "react";
import { observer } from "mobx-react";
import { DATE_BEFORE_FILTER_OPTIONS } from "@plane/constants";
import { isInDateFormat } from "@plane/utils";
import { DateFilterModal } from "@/components/core/filters/date-filter-modal";
import { FilterHeader, FilterOption } from "@/components/issues/issue-layouts/filters";

type Props = {
  title: string;
  appliedFilters: string[] | null;
  handleUpdate: (val: string | string[]) => void;
};

export const FilterDate = observer(function FilterDate({ title, appliedFilters, handleUpdate }: Props) {
  const [previewEnabled, setPreviewEnabled] = useState(true);
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false);

  const appliedFiltersCount = appliedFilters?.length ?? 0;
  const isCustomDateSelected = () => (appliedFilters?.filter((f) => isInDateFormat(f.split(";")[0])) ?? []).length > 0;

  const handleCustomDate = () => {
    if (isCustomDateSelected()) {
      handleUpdate(appliedFilters?.filter((f) => f.includes("-")) ?? []);
    } else setIsDateFilterModalOpen(true);
  };

  return (
    <>
      {isDateFilterModalOpen && (
        <DateFilterModal
          handleClose={() => setIsDateFilterModalOpen(false)}
          isOpen={isDateFilterModalOpen}
          onSelect={(val) => handleUpdate(val)}
          title={title}
        />
      )}
      <FilterHeader
        title={`${title}${appliedFiltersCount > 0 ? ` (${appliedFiltersCount})` : ""}`}
        isPreviewEnabled={previewEnabled}
        handleIsPreviewEnabled={() => setPreviewEnabled(!previewEnabled)}
      />
      {previewEnabled && (
        <div>
          {DATE_BEFORE_FILTER_OPTIONS.map((option) => (
            <FilterOption
              key={option.value}
              isChecked={appliedFilters?.includes(option.value) ?? false}
              onClick={() => handleUpdate(option.value)}
              title={option.name}
              multiple
            />
          ))}
          <FilterOption isChecked={isCustomDateSelected()} onClick={handleCustomDate} title="Custom" multiple />
        </div>
      )}
    </>
  );
});
```

### 2. Create `apps/web/ce/components/analytics/filters/filter-selection.tsx`

<!-- Updated: Validation Session 2 - Use FilterDate, no searchQuery prop -->

```typescript
// Props
type Props = {
  filters: TAnalyticsTabFilters;
  handleUpdate: (filterKey: keyof TAnalyticsTabFilters, value: string[] | null) => void;
};
```

Component structure:

- `observer` wrapped
- Scrollable div with `divide-y divide-subtle-1`
- Section 1: `<FilterDate title="Start date" appliedFilters={filters.start_date ?? null} handleUpdate={(val) => handleFilters("start_date", val)} />`
- Section 2: `<FilterDate title="Target date" appliedFilters={filters.target_date ?? null} handleUpdate={(val) => handleFilters("target_date", val)} />`

Internal `handleFilters` function (toggle logic from `ViewFiltersSelection`):

- Toggles individual values within the array
- Calls `handleUpdate(key, updatedArray)` or `handleUpdate(key, null)` when empty

### Imports needed:

```typescript
import { observer } from "mobx-react";
import type { TAnalyticsTabFilters } from "@plane/types";
import { FilterDate } from "./filter-date";
```

## Todo

- [x] Create `apps/web/ce/components/analytics/filters/filter-date.tsx` (generic with title prop)
- [x] Create `apps/web/ce/components/analytics/filters/filter-selection.tsx`
- [x] Add start_date filter section using `<FilterDate title="Start date" />`
- [x] Add target_date filter section using `<FilterDate title="Target date" />`
- [x] Implement `handleFilters` toggle logic

## Success Criteria

- Component renders both date filter sections
- Toggling a date value adds/removes from array
- No lint errors
- File < 100 lines

## Risk Assessment

- Date filter components may not have specific `start_date`/`target_date` variants — may need to adapt `FilterCreatedDate` with a custom label prop or duplicate the pattern.
- No `memberIds` needed (removed from scope).

## Next Steps

Phase 3: Build the filter button wrapper component.
