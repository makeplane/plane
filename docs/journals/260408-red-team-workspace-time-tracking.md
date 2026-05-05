# Red Team Review — Workspace Time Tracking Plan

## Date: 2026-04-08

## What Happened

Red-team adversarial review of `260408-1756-workspace-time-tracking` plan (5 phases, 6h effort). Spawned 3 hostile reviewers in parallel: Security Adversary, Assumption Destroyer, Failure Mode Analyst. Produced 30 raw findings → 15 distinct after deduplication.

## Key Findings

### Critical (3)

| #    | Finding                                                                                                                                                        | Impact                              |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| RT-1 | Route `":workspaceSlug/time-tracking"` nested inside parent layout that already provides `workspaceSlug` — URL becomes `/:ws/:ws/time-tracking`, never matches | **100% route failure**              |
| RT-2 | No pagination on workspace analytics endpoint — large workspaces return 100k+ rows → OOM/timeout                                                               | **DoS + data exposure**             |
| RT-3 | Workspace MEMBER sees ALL project time logs without project-level permission check                                                                             | **Horizontal privilege escalation** |

### High (8)

- RT-4: Permission class not explicitly verified for workspace membership model
- RT-5: `week_start` unbounded — DoS via extreme date values
- RT-6: No rate limiting on expensive cross-workspace aggregation
- RT-7: `fetchCrossWorkspaceCapacity` endpoint doesn't exist in plan
- RT-8: `throw error?.response?.data` throws `undefined` if data is absent
- RT-9: Store `finally` resets loading on failure with no error state
- RT-10: `TimesheetTable` uses `row.project_id` not prop — plan's "graceful fallback" claim is wrong
- RT-11: `MemberDropdown` receives `undefined` projectId even when CSS-hidden

### Medium (4)

- RT-12: `projectId` optional type change without call-site audit
- RT-13: Issue links from workspace analytics lack target URL spec
- RT-14: No loading/error state in new `WorkspaceAnalyticsTimesheetGrid`
- RT-15: Tab key `project_analytics` vs existing `analytics`
- RT-16: `Route.ComponentProps` type generation requires Phase 05 first
- RT-17: i18n key mismatch between Phase 04 and Phase 05
- RT-18: `highlight()` uses `includes` not `startsWith` — false positives
- RT-19: Sidebar `href="/time-tracking/"` is relative, breaks when not at root

## Decisions

- All 15 findings accepted and annotated inline in plan phase files
- Plan status updated to `red-teamed`
- RT-1 (route bug) is single most breaking — will fail all URLs silently
- RT-7 (missing capacity endpoint) needs resolution before Phase 02

## Next Steps

- `/ck:plan validate` — validate fixes with critical questions interview
- `/ck:cook --auto` — begin implementation after validation
