# QA Report: Workspace Time Tracking

**Date:** 2026-04-09 | **Branch:** `ngoc-feat/workspaces-default-view` | **Plan:** `260408-1756-workspace-time-tracking`

---

## Summary

Tested 6 API endpoints + 3 UI pages. **Key finding:** Docker container had stale code (missing `level="WORKSPACE"` in `@allow_permission` decorator) causing 400 errors on the 2 new endpoints. After copying updated files to container, all endpoints work. UI renders correctly with minor warnings.

**Overall: PASS with concerns**

---

## API Test Results

| #   | Endpoint                                                                         | Status           | Response                         |
| --- | -------------------------------------------------------------------------------- | ---------------- | -------------------------------- |
| 1   | `GET /api/workspaces/<slug>/time-tracking/summary/`                              | **200 PASS**     | Empty summary (no logs)          |
| 2   | `GET /api/workspaces/<slug>/time-tracking/cross-workspace/timesheet/`            | **200 PASS**     | Returns issues with 0m logged    |
| 3   | `GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/`             | **200 PASS**     | Returns 3 members                |
| 4   | `GET /api/workspaces/<slug>/time-tracking/analytics/timesheet/` (NEW)            | **200 PASS**     | Pagination works, empty rows     |
| 5   | `GET /api/workspaces/<slug>/time-tracking/analytics/capacity/` (NEW)             | **200 PASS**     | Returns 2 members with days map  |
| 6   | `GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/day-details/` | **400 Expected** | Requires member_id + date params |

### Edge Case Validation

| Test                           | Expected        | Actual                           | Status |
| ------------------------------ | --------------- | -------------------------------- | ------ |
| Invalid `week_start` format    | 400 + error msg | 400 "Invalid date format"        | PASS   |
| Future `week_start` >7 days    | 400 + error msg | 400 "cannot be more than 7 days" | PASS   |
| Nonexistent workspace          | 403/404         | 403 (permission first)           | PASS   |
| Pagination `?limit=2&offset=0` | Respected       | limit=2, offset=0 returned       | PASS   |
| Invalid capacity `date_from`   | 400 + error msg | 400 "Invalid date format"        | PASS   |

### Critical Bug Found (Pre-fix)

**Container had stale code:** `@allow_permission([ROLE.ADMIN, ROLE.MEMBER])` missing `level="WORKSPACE"` in both:

- `workspace_analytics_timesheet.py` → caused `KeyError: 'project_id'` → 400
- `workspace_capacity.py` → same issue

**Root cause:** Docker container doesn't mount local files; changes weren't synced.
**Fix:** Local files are correct (`level="WORKSPACE"` present). Container needed manual copy + restart.
**Impact:** Will work correctly on fresh deploy from branch code.

---

## UI Test Results

| Test                                   | Status | Notes                           |
| -------------------------------------- | ------ | ------------------------------- |
| Login                                  | PASS   | `ngocyt001@gmail.com` works     |
| Sidebar "Time Tracking" link           | PASS   | Under "More" expandable         |
| My Timesheet (`/time-tracking/`)       | PASS   | Weekly grid, issues, navigation |
| Analytics (`/time-tracking/analytics`) | PASS   | Renders, empty state shown      |
| Capacity (`/time-tracking/capacity`)   | PASS   | Member heatmap, date picker     |
| Tab switching                          | PASS   | All 3 tabs navigate correctly   |
| No 404 errors                          | PASS   | All pages return 200            |
| No JS runtime errors                   | PASS   | Warnings only                   |

### UI Bugs

| #   | Severity | Description                                                                        |
| --- | -------- | ---------------------------------------------------------------------------------- |
| B1  | Medium   | Analytics empty state ambiguous — same message as timesheet ("No time logs found") |
| B2  | Low      | React `forwardRef` warnings on `AppSidebarItem` (13x on Timesheet, 3x on Capacity) |
| B3  | Low      | `<button>` nested inside `<button>` in sidebar — DOM violation                     |
| B4  | Low      | MobX update-during-render warning in workspace layout                              |
| B5  | Low      | "Time Tracking" hidden behind "More" in sidebar                                    |

B2-B4 are pre-existing layout/sidebar issues, not specific to this feature.

---

## Success Criteria Checklist

- [x] `/:ws/time-tracking/` renders Timesheet tab with cross-workspace data
- [x] `/:ws/time-tracking/analytics` renders workspace-scoped analytics
- [x] `/:ws/time-tracking/capacity` renders capacity heatmap cross-workspace
- [x] Sidebar shows "Time Tracking" nav item (under "More")
- [x] No regression on project-level time-tracking pages (not broken by changes)

---

## Unresolved Questions

1. Analytics empty state — needs data to verify chart/table rendering works end-to-end
2. Sidebar placement — "Time Tracking" under "More" intentional or should be top-level?
3. No actual time log data in test workspaces — full data-path testing requires logged hours
