# Code Review: Time Tracking Default ON

## Scope

- **Files**: 4 (1 migration + 3 frontend)
- **LOC changed**: ~25 (net)
- **Focus**: Backend data migration + frontend feature flag gating

## Overall Assessment

**PASS with minor observations.** Changes are clean, consistent with established patterns, and correctly gate worklog UI behind `is_time_tracking_enabled`. No critical or high-priority issues found.

## Critical Issues

None.

## High Priority

None.

## Medium Priority

### M1. Activity feed still renders WORKLOG entries when time tracking disabled

`activity-comment-root.tsx` (line 111-112) renders `IssueActivityWorklog` for `activity_type === "WORKLOG"` without checking `is_time_tracking_enabled`. If a project has historical worklogs and then disables time tracking, these entries still appear in the activity feed.

**Impact**: UX inconsistency -- user sees worklog activity entries but cannot interact with them (no Log Time button, no worklog property in sidebar). Not a data leak, but confusing.

**Recommendation**: Acceptable as-is for MVP since historical data should remain visible. If desired, could filter WORKLOG activity type from the filter options when time tracking is disabled in `ActivityFilterRoot`. Low priority.

### M2. `ActivityFilterRoot` shows "Worklogs" filter tab even when time tracking disabled

The `ActivityFilterRoot` renders all `ACTIVITY_FILTER_TYPE_OPTIONS` (which likely includes a "Worklogs" filter). When time tracking is disabled, this filter option still appears but the "Log Time" button is hidden.

**Recommendation**: Consider passing `isTimeTrackingEnabled` to `ActivityFilterRoot` and hiding the worklog filter option. Low priority, cosmetic.

## Low Priority

### L1. Migration uses `projects` table name directly (correct)

The migration correctly uses `projects` (matching `db_table = "projects"` in `Project` model). Verified.

### L2. `!== false` pattern is consistent

All gating uses `project?.is_time_tracking_enabled !== false` which correctly handles:

- `true` -> enabled (show UI)
- `false` -> disabled (hide UI)
- `undefined` -> enabled (show UI, treats missing data as enabled)

This matches the existing pattern in:

- `project-navigation-root.tsx` line 39: `shouldRender: project?.is_time_tracking_enabled !== false`
- `time-tracking/layout.tsx` line 50: `=== false` (equivalent inverse logic)

Consistent and correct.

## Edge Cases Found by Scout

| Edge Case                                                | Status                                                                                                                                                                                                                     |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `projectDetails` is `undefined` (project not loaded yet) | SAFE -- `undefined?.is_time_tracking_enabled !== false` evaluates to `true` (shows UI briefly until project loads). Same behavior as all other feature flag checks in this codebase.                                       |
| `project` is `null` (invalid projectId)                  | SAFE -- in `root.tsx` line 119, early return `if (!project) return <></>` prevents rendering. In sidebar/peek-overview, `projectDetails` is derived from `issue.project_id` which is validated by the `if (!issue)` guard. |
| New projects created after migration                     | SAFE -- Django model has `default=True` on `is_time_tracking_enabled` field, so new projects get `True` automatically.                                                                                                     |
| Existing projects already TRUE                           | SAFE -- migration WHERE clause `WHERE is_time_tracking_enabled = FALSE` means it only touches projects that were explicitly disabled. No unnecessary writes.                                                               |
| Backend API enforcement                                  | VERIFIED -- `worklog.py` and `timesheet_bulk.py` both check `is_time_tracking_enabled` server-side. Frontend gating is defense-in-depth, not sole protection.                                                              |
| Worklog reminder bg task                                 | VERIFIED -- `worklog_reminder_task.py` filters by `is_time_tracking_enabled=True`. Unaffected by this migration (if anything, more projects now match).                                                                    |

## Positive Observations

1. **Pattern consistency** -- `!== false` idiom matches all existing feature flag checks exactly
2. **Migration follows established pattern** -- identical structure to `0131_migrate_none_priority_to_medium.py`
3. **Minimal diff** -- only 3 frontend files touched, surgical changes
4. **Correct dependency chain** -- migration depends on `0150_fix_default_view_rich_filters` (latest)
5. **`getProjectById` moved up in root.tsx** -- eliminates the variable being defined after `useMemo` that references it; cleaner code
6. **Backend enforcement exists** -- API-level checks prevent worklog creation even if frontend gating is bypassed

## Recommended Actions

1. [Optional] Consider hiding WORKLOG activity filter when time tracking disabled (M2)
2. [Optional] Consider filtering WORKLOG activity entries when time tracking disabled (M1)
3. No blocking changes required

## Metrics

- Type Coverage: N/A (no new types added)
- Test Coverage: Migration is data-only, no new test needed
- Linting Issues: Not checked (recommend running `pnpm check:lint`)

## Unresolved Questions

1. **Intent question**: Should the migration be re-runnable / idempotent? Currently it is (WHERE clause prevents double-update), which is good.
2. **Product question**: When time tracking is disabled on a project, should existing worklog activity entries in the feed be hidden or remain visible? Current behavior: visible. Seems intentional for audit trail.
