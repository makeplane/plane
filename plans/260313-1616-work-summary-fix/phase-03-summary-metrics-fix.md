# Phase 03: Summary Metrics Fix

## Overview

Audit and fix the analytics work-items tab metrics that "don't make sense."

## Key Insights

### Current Metrics (work-items tab)

1. **Insight cards** (top): total, started, backlog, unstarted, completed
2. **Created vs Resolved chart**: monthly line chart of created_count vs completed_count
3. **Customized Insights**: configurable chart (x-axis property, y-axis metric)
4. **Work Items Table**: per-project breakdown with state group counts

### Identified Issues

1. **No "cancelled" in insight cards** - Backend returns 5 metrics but "cancelled" is missing from `ANALYTICS_INSIGHTS_FIELDS["work-items"]`. Table shows cancelled per project but top cards don't.
2. **Date filter commented out** - All frontend analytics API calls have `// date_filter: selectedDuration` commented out. `selectedDuration` exists in analytics store but is never sent. Metrics always show ALL-TIME data regardless of duration selector.
3. **Inconsistent filtering** - `get_work_items_stats()` ignores `analytics_date_range` for base count but `get_filtered_counts()` would filter if range provided. Since frontend doesn't send `date_filter`, it always returns total count.
4. **"Created vs Resolved" misnomer** - Chart title says "resolved" but backend counts `state__group="completed"`. Completed != resolved (could include other terminal states).
5. **Total mismatch** - Top card "total" counts ALL work items. But started + backlog + unstarted + completed != total (cancelled items are in the gap). Users see numbers that don't add up.

### Data Flow

```
Frontend: useAnalytics() -> analyticsService.getAdvanceAnalytics() -> /api/.../advance-analytics/?tab=work-items
Backend:  AdvanceAnalyticsEndpoint.get_work_items_stats() -> Issue.issue_objects.filter(**base_filters)
          Returns: { total_work_items, started_work_items, backlog_work_items, un_started_work_items, completed_work_items }
          Each value: { count: N }
Frontend: TotalInsights -> maps to ANALYTICS_INSIGHTS_FIELDS["work-items"] -> InsightCard per field
```

## Requirements

1. Insight cards should show all meaningful state groups including cancelled
2. Numbers must add up (total = sum of all state groups)
3. Date filter should work if selector exists
4. Chart labels should be accurate

## Related Code Files

| File                                                                    | Purpose                        | Change                                   |
| ----------------------------------------------------------------------- | ------------------------------ | ---------------------------------------- |
| `packages/constants/src/analytics/common.ts`                            | `ANALYTICS_INSIGHTS_FIELDS`    | Add cancelled metric                     |
| `apps/api/plane/app/views/analytic/advance.py`                          | `get_work_items_stats()`       | Add cancelled_work_items                 |
| `apps/web/core/components/analytics/work-items/root.tsx`                | Work-items root                | Reference                                |
| `apps/web/core/components/analytics/total-insights.tsx`                 | Insight cards                  | Reference (auto from constants)          |
| `apps/web/core/components/analytics/work-items/created-vs-resolved.tsx` | Chart component                | Fix label if needed                      |
| `apps/web/core/hooks/store/use-analytics.ts`                            | Analytics store hook           | Reference                                |
| `apps/api/plane/app/views/workspace/user.py:280-369`                    | `WorkspaceUserProfileEndpoint` | Add soft-delete filter + align completed |

## Implementation Steps

- [ ] 1. Add "cancelled" to insight cards
  <!-- Updated: Validation Session 3 - place cancelled after completed (Total→Started→Backlog→Unstarted→Completed→Cancelled) -->
  - Add `{ key: "cancelled_work_items", i18nKey: "workspace_analytics.cancelled_work_items" }` to `ANALYTICS_INSIGHTS_FIELDS["work-items"]` — position **after** `completed_work_items`
  - Add `cancelled_work_items` to `AdvanceAnalyticsEndpoint.get_work_items_stats()`: `base_queryset.filter(state__group="cancelled")`
  - Add i18n key if missing
- [ ] 2. Verify total = sum of state groups
  - `total_work_items` uses `Issue.issue_objects` which excludes soft-deleted
  - Verify: started + backlog + unstarted + completed + cancelled = total
  - If not, investigate what state groups exist (check for "triage" or custom groups)
- [ ] 3. ~~Evaluate date filter~~ — **Deferred to separate PR** (Validation Session 1)
  <!-- Updated: Validation Session 1 - date filter deferred out of scope -->
- [ ] 4. Fix chart labels
  - Check `created-vs-resolved.tsx` for "resolved" label usage
  - If it says "resolved" but data is "completed", update label to "completed"
- [ ] 5. Add i18n translations
  - Add `workspace_analytics.cancelled_work_items` to translation files

## Todo

### Analytics metrics

- [x] Add cancelled_work_items to backend response
- [x] Add cancelled to frontend insight cards constant
- [x] Add i18n key for cancelled
- [x] Verify state group completeness (total = sum)
- [x] Audit chart labels
- [x] ~~Decide on date filter~~ — Deferred to separate PR
- [x] Add workload label clarification — info tooltip on section title showing "Assigned issues only"
<!-- Updated: Validation Session 3 - tooltip on section title (not static subtitle) -->

### WorkspaceUserProfileEndpoint fixes (folded in — Validation Session 2)

<!-- Updated: Validation Session 2 - Profile endpoint bugs added to Phase 03 -->

- [x] Add `deleted_at__isnull=True` filter to all `Count` annotations in `WorkspaceUserProfileEndpoint`
- [x] Align `completed_issues` to use `state__group="completed"` (not `completed_at__isnull=False`)
- [x] Verify: assigned_issues count matches `WorkspaceUserProfileStatsEndpoint` assigned count

## Completion Note (2026-03-13)

Phase 03 completed successfully. All tasks implemented:

- Added `cancelled_work_items` to backend analytics response and frontend insight cards
- Updated `ANALYTICS_INSIGHTS_FIELDS` with cancelled metric positioned after completed
- Added i18n translations for `cancelled_work_items` and `workload_assigned_only` to en/ko/vi locales
- Fixed `WorkspaceUserProfileEndpoint`: added `deleted_at__isnull=True` to all Count annotations
- Aligned `completed_issues` to use `state__group="completed"` for consistency with workload metrics
- Added info tooltip on workload section title displaying "Assigned issues only"
- Fixed chart legend label from "resolved" to "completed" in analytics charts
- All metrics now accurately reflect actual data with proper soft-delete filtering

## Success Criteria

- All 5 state groups visible in insight cards (+ total = 6 cards)
- total_work_items == started + backlog + unstarted + completed + cancelled
- No misleading labels on charts
- Numbers shown match actual data

## Risk Assessment

- Low: additive changes only (new metric card, new backend field)
- Date filter uncomment is medium risk (may change all analytics behavior)
- Recommend: fix cards + labels first, date filter as separate PR
