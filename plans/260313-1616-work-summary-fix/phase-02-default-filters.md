# Phase 02: Default Date Filters

## Overview

Ensure start_date and target_date filters are ON by default when the "Daily Status" workspace view loads.

## Key Insights

- Default view seeds `filters` (legacy) but `rich_filters` is `{}` (empty)
- Frontend reads `rich_filters` for non-static views, ignoring legacy `filters`
- `ComplexFilterBackend` parses `rich_filters` JSON for issue list filtering
- Need to either: (a) populate `rich_filters` in seed/signal, or (b) make frontend read legacy `filters` as fallback

## Requirements

1. Default "Daily Status" view must show start_date and target_date filters as active
2. Filters should have correct date-relative values (today-based ranges)
3. Existing views must not break
4. New workspaces (signal) and existing workspaces (migration) both covered

## Architecture

### Option A: Populate `rich_filters` in seed + signal (RECOMMENDED)

- Update `apps/api/plane/db/signals/workspace.py` to set `rich_filters` with date conditions
- Create new migration to update existing default views' `rich_filters`
- `rich_filters` schema must match `TWorkItemFilterExpression` type

### ~~Option B: Frontend fallback to legacy filters~~ (Rejected — Validation Session 1)

<!-- Updated: Validation Session 1 - Option B rejected, Option A confirmed -->

### `rich_filters` Schema (confirmed — Validation Session 2)

<!-- Updated: Validation Session 2 - Use relative operator format matching legacy filters field -->

```json
{
  "start_date": ["today;after_including;"],
  "target_date": ["today;before_including;"]
}
```

Format matches the legacy `filters` field schema and stays always-relative to today. No static ISO dates.

## Related Code Files

| File                                                                | Purpose                        | Change                        |
| ------------------------------------------------------------------- | ------------------------------ | ----------------------------- |
| `apps/api/plane/db/signals/workspace.py`                            | Default view signal            | Update `rich_filters`         |
| `apps/api/plane/db/migrations/0146_seed_default_workspace_views.py` | Seed migration                 | Reference only                |
| New migration file                                                  | Update existing default views  | Create                        |
| `apps/api/plane/utils/filters/filter_backend.py`                    | ComplexFilterBackend           | Reference - understand schema |
| `apps/api/plane/utils/filters/filterset.py`                         | IssueFilterSet                 | Reference - understand fields |
| `packages/types/src/view-props.ts`                                  | TWorkItemFilterExpression type | Reference                     |

## Implementation Steps

- [ ] 1. Determine exact `rich_filters` JSON schema for date-relative conditions
  - Check `ComplexFilterBackend._apply_json_filter()` for supported operators
  - Check `IssueFilterSet` for `start_date` and `target_date` field definitions
  - Look at existing views with date filters for examples
- [ ] 2. Update `apps/api/plane/db/signals/workspace.py`
  - Change `rich_filters={}` to include start_date and target_date conditions
  - Keep legacy `filters` for backward compat
- [ ] 3. Create migration `0147_update_default_view_rich_filters.py`
  <!-- Updated: Validation Session 3 - create new 0147, do not modify existing 0146 -->
  - Update all existing default views (`is_default=True, project__isnull=True`) with `rich_filters`
  - Only update if `rich_filters` is currently empty `{}`
  - Idempotent
- [ ] 4. Verify frontend picks up filters
  - `fetchFilters()` reads `rich_filters` from view details
  - `WorkItemFiltersRow` should show active date filter chips
- [ ] 5. Test backward compatibility
  - Existing custom views unaffected
  - Static views (all-issues, assigned, created, subscribed) unaffected

## Todo

- [x] Determine `rich_filters` date schema
- [x] Update signal
- [x] Create migration
- [x] Test filter display
- [x] Test issue list filtering

## Completion Note (2026-03-13)

Phase 02 completed successfully. All tasks implemented:

- Updated `apps/api/plane/db/signals/workspace.py` to seed `rich_filters` with default date filters
- Created migration `0147_update_default_view_rich_filters.py` to apply filters to existing workspaces
- Filters use relative operator format: `{"start_date": ["today;after_including;"], "target_date": ["today;before_including;"]}`
- Frontend picks up filters correctly from view details
- Backward compatibility verified — existing views unaffected

## Success Criteria

- Opening Daily Status view shows start_date and target_date filter chips active
- Issue list is filtered by today's date range
- New workspaces get correct default filters
- Existing workspaces updated via migration

## Risk Assessment

- Medium: changing `rich_filters` schema could break if format incorrect
- Mitigation: test with a single view first, check `ComplexFilterBackend` parsing
- Migration is data-only, reversible
