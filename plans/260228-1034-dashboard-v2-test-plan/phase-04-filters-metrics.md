# Phase 4: Filters & Metrics

**Status:** Complete | **Test Cases:** 16 | **Result:** All API tests pass (fixed estimate_points metric bug)

## Y-Axis Metrics (2 UI-exposed)

### TC-4.1: Issue Count metric

- **Widget:** Bar Chart, Priority, metric=count
- **Expected:** Y-axis shows issue count numbers

### TC-4.2: Estimate Points metric

- **Widget:** Bar Chart, Priority, metric=estimate_points
- **Expected:** Y-axis shows sum of estimate points

## Entity Filters (chip selectors)

### TC-4.3: Filter by priority — single value

- **Widget config:** Add filter priority=`high`
- **Expected:** Chart only shows data for high priority issues

### TC-4.4: Filter by priority — multiple values

- **Widget config:** Add filter priority=`high,urgent`
- **Expected:** Chart shows data for both high and urgent

### TC-4.5: Filter by state_group — single

- **Widget config:** Add filter state_group=`started`
- **Expected:** Only in-progress issues counted

### TC-4.6: Filter by state_group — multiple

- **Widget config:** Add filter state_group=`started,completed`
- **Expected:** Both started and completed issues

### TC-4.7: Filter by assignee

- **Widget config:** Add filter assignees=[specific user]
- **Expected:** Only that user's issues

### TC-4.8: Filter by labels

- **Widget config:** Add filter labels=[specific label]
- **Expected:** Only issues with that label

### TC-4.9: Combined filters — priority + state_group

- **Widget config:** priority=`high` AND state_group=`started`
- **Expected:** Intersection — high priority AND in-progress

### TC-4.10: Clear all filters

- **Steps:** Add filters → Edit widget → Clear all → Save
- **Expected:** Chart returns to unfiltered data

## Chart Model: Grouped

### TC-4.11: Grouped Bar — x=priority, group_by=state_group

- **Expected:** Clustered/stacked bars per priority, colored by state group

### TC-4.12: Grouped Bar — x=state, group_by=priority

- **Expected:** Clustered/stacked bars per state, colored by priority

### TC-4.13: Grouped Line — x=priority, group_by=assignee

- **Expected:** Multiple lines, one per assignee

### TC-4.14: Grouped Area — x=state_group, group_by=labels

- **Expected:** Stacked areas by label per state group

### TC-4.15: Grouped Donut — x=priority, group_by=state

- **Expected:** Multi-series donut or grouped segments

### TC-4.16: Remove group_by from grouped widget

- **Steps:** Edit grouped widget → Clear group_by → Save
- **Expected:** Reverts to BASIC single-series chart

## Notes

- Date range filters (`start_date`, `target_date`, `created_at`, `completed_at`) are stored in `filters` JSON but NOT applied by backend aggregation — known gap
- Backend `FILTER_MAPPING` only handles: `priority`, `assignees`, `labels`, `state`, `state_group`, `created_by`

## Success Criteria

- Entity filters correctly reduce chart data
- Combined filters work as AND intersection
- Grouped charts render multi-series correctly
- Metric toggle between count/estimate_points works
