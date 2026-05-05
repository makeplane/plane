# Phase 4: Wire Up

## Overview

Connect the filter button to the analytics header by passing `activeTab` through the component chain. Also clear filters when the tab changes.

## Key Insights

- `AnalyticsFilterActions` currently takes no props (line 15 of `analytics-filter-actions.tsx`)
- The page component has `selectedTab` state (line 55 of `page.tsx`)
- `AnalyticsFilterActions` is rendered at line 103 of `page.tsx` with no props
- CE import pattern: `@/plane-web/components/analytics/...`
- `clearAllTabFilters` must be called when tab changes (useEffect on `selectedTab`)

## Related Files

- `apps/web/core/components/analytics/analytics-filter-actions.tsx` -- modify
- `apps/web/app/(all)/[workspaceSlug]/(projects)/analytics/[tabId]/page.tsx` -- modify

## Implementation Steps

### 1. Update `analytics-filter-actions.tsx`

Add prop type and render filter button:

```typescript
import type { TAnalyticsTabsBase } from "@plane/types";
import { AnalyticsFilterButton } from "@/plane-web/components/analytics/filters/analytics-filter-button";

type Props = {
  activeTab: TAnalyticsTabsBase;
};

const AnalyticsFilterActions = observer(function AnalyticsFilterActions({ activeTab }: Props) {
  // ... existing store hooks ...
  return (
    <div className="flex items-center justify-end gap-2">
      <AnalyticsFilterButton activeTab={activeTab} />
      <ProjectSelect ... />
    </div>
  );
});
```

Filter button placed LEFT of `ProjectSelect` (first in flex row with `justify-end`).

### 2. Update `page.tsx`

Pass `selectedTab` to `AnalyticsFilterActions` and clear filters on tab change:

```diff
+ import { useEffect } from "react";
+ import type { TAnalyticsTabsBase } from "@plane/types";
+ import { useAnalytics } from "@/hooks/store/use-analytics";

+ const { clearAllTabFilters } = useAnalytics();

+ // <!-- Updated: Validation Session 2 - include clearAllTabFilters in deps (MobX actions are stable) -->
+ useEffect(() => {
+   clearAllTabFilters();
+ }, [selectedTab, clearAllTabFilters]);

- <AnalyticsFilterActions />
+ <AnalyticsFilterActions activeTab={selectedTab as TAnalyticsTabsBase} />
```

Note: `selectedTab` is `string` from `useState`. Cast is safe because values come from `ANALYTICS_TABS[].key` which is typed as `TAnalyticsTabsBase`.

## Todo

- [x] Add `Props` type with `activeTab` to `analytics-filter-actions.tsx`
- [x] Import `AnalyticsFilterButton` from CE path
- [x] Render `<AnalyticsFilterButton>` before `<ProjectSelect>`
- [x] Add `useEffect` to clear filters on tab change in `page.tsx`
- [x] Pass `selectedTab` as `activeTab` in `page.tsx`
- [x] Import `TAnalyticsTabsBase` in `page.tsx`
- [x] Run `pnpm check:lint` to verify no errors

## Success Criteria

- Filter button visible on Projects/Work Items/Cycles/Modules/Intake tabs
- Filter button hidden on Overview/Users tabs
- Clicking opens dropdown with Start Date and Target Date filters
- Selecting filters shows blue dot indicator
- Switching tabs clears all active filters
- No regressions to existing "All Projects" dropdown

## Risk Assessment

- Type cast of `selectedTab` to `TAnalyticsTabsBase` -- safe since values from typed tab config
- Adding prop to `AnalyticsFilterActions` is minor breaking change for any other callers -- grep for other usages first (should only be `page.tsx`)
- `clearAllTabFilters` in `useEffect` -- include in dependency array or use `useRef` pattern to avoid stale closure if needed

## Next Steps

After implementation: run `pnpm check:lint`, verify in browser, then use `code-reviewer` skill.
