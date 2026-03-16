# Phase 1: Types & Store

## Overview

Define `TAnalyticsTabFilters` type (start_date + target_date only) and add filter state management to the analytics store.

## Key Insights

- `BaseAnalyticsStore` uses MobX `makeObservable` with explicit annotations (not decorators)
- All actions use `runInAction` for async safety
- CE store (`ce/store/analytics.store.ts`) extends `BaseAnalyticsStore` with no overrides currently
- Existing pattern: each observable has a matching `update*` action

## Related Files

- `packages/types/src/analytics.ts` -- existing analytics types
- `apps/web/core/store/analytics.store.ts` -- `BaseAnalyticsStore` class
- `apps/web/ce/store/analytics.store.ts` -- CE extension (empty override)

## Implementation Steps

### 1. Add type to `packages/types/src/analytics.ts`

```typescript
export type TAnalyticsTabFilters = {
  start_date?: string[] | null;
  target_date?: string[] | null;
};
```

Add after `TAnalyticsFilterParams`.

### 2. Update `IBaseAnalyticsStore` interface in `apps/web/core/store/analytics.store.ts`

Add to observables section:

```typescript
tabFilters: TAnalyticsTabFilters;
```

Add to actions section:

```typescript
updateTabFilters: (filterKey: keyof TAnalyticsTabFilters, value: string[] | null) => void;
clearAllTabFilters: () => void;
```

### 3. Update `BaseAnalyticsStore` class

Add observable:

```typescript
tabFilters: TAnalyticsTabFilters = {};
```

Add to `makeObservable`:

```typescript
tabFilters: observable,
updateTabFilters: action,
clearAllTabFilters: action,
```

Add action methods:

```typescript
updateTabFilters = (filterKey: keyof TAnalyticsTabFilters, value: string[] | null) => {
  runInAction(() => {
    this.tabFilters = {
      ...this.tabFilters,
      [filterKey]: value,
    };
  });
};

clearAllTabFilters = () => {
  runInAction(() => {
    this.tabFilters = {};
  });
};
```

Import `TAnalyticsTabFilters` from `@plane/types`.

## Todo

- [x] Add `TAnalyticsTabFilters` type to `packages/types/src/analytics.ts`
- [x] Add `tabFilters` observable to `IBaseAnalyticsStore` interface
- [x] Add `updateTabFilters` and `clearAllTabFilters` to `IBaseAnalyticsStore` interface
- [x] Add `tabFilters` observable initialization to `BaseAnalyticsStore`
- [x] Add MobX annotations in `makeObservable`
- [x] Add `updateTabFilters` action method
- [x] Add `clearAllTabFilters` action method

## Success Criteria

- `tabFilters` is reactive and accessible via `useAnalytics()` hook
- Updating a filter key preserves other filter key
- `clearAllTabFilters` resets to empty object
- No lint errors

## Risk Assessment

- Low risk. Additive change, no existing behavior affected.
- CE store inherits from Base, so no CE store changes needed.

## Next Steps

Phase 2: Build the filter selection panel component.
