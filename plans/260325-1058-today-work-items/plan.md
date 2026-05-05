---
title: "Today Work Items Section"
description: "Add a Today Work Items table between priority distribution and recent activity on the Your Work summary page"
status: implemented
priority: P2
effort: 6h
branch: ngoc-feat/workspaces
tags: [profile, your-work, summary, today-items]
created: 2026-03-25
---

# Today Work Items Section

## Goal

Add a new "Today Work Items" section between "Work Items by Priority" and "Recent Activity" on the Your Work → Summary tab. The section displays a data table of work items assigned to the current user that are currently valid for execution (start_date ≤ today ≤ due_date), filtering out Done/Cancelled state groups (only Draft/Unstarted/Started).

### Columns

| Column            | Data Source                                | Notes                                     |
| ----------------- | ------------------------------------------ | ----------------------------------------- |
| Work Item Name    | `issue.name`                               | With issue identifier                     |
| Department        | `workspace.name`                           | Current workspace name                    |
| Project           | `project.name` via `issue.project_id`      | Project name lookup from store            |
| State             | `issue.state_id` → state group label/color | State badge with color                    |
| Progress Tracking | Computed from `issue.target_date` vs today | Reuse `getProgressStatus()` from CE utils |
| Start Date        | `issue.start_date`                         | Formatted date                            |
| Due Date          | `issue.target_date`                        | Formatted date                            |

### Filter Criteria

- Assigned to current user (`assignees__in=[userId]`)
- `start_date <= today` (started or starting today)
- `target_date >= today` (not yet past due — OR include overdue for visibility)
- State group NOT in `completed` or `cancelled` (draft, unstarted, started only)

## Phases

| #   | Phase              | Effort | Status  | File                                         |
| --- | ------------------ | ------ | ------- | -------------------------------------------- |
| 1   | Backend API        | 2h     | Pending | [phase-01](phase-01-backend-today-items.md)  |
| 2   | Frontend Component | 4h     | Pending | [phase-02](phase-02-frontend-today-items.md) |

## Key Architecture Decisions

1. **Reuse existing user-issues endpoint** — The existing `GET /api/workspaces/{slug}/user-issues/{userId}/` endpoint already supports filters. We add a new dedicated backend endpoint `GET /api/workspaces/{slug}/user-today-issues/{userId}/` that pre-applies the "today" filter logic server-side for clarity and performance.
2. **Progress Tracking** — Reuse `getProgressStatus()` from `ce/components/issues/issue-layouts/progress-tracking-utils.ts`, identical formula to the spreadsheet column.
3. **CE component** — The new `TodayWorkItems` component goes in `apps/web/ce/components/profile/` since this is a CE-only feature.
4. **Department = Workspace name** — Same as the spreadsheet column; reads from workspace store, not a new field.

## Validation Log

### Session 1 — 2026-03-25

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Should overdue work items (target_date < today) be included in the table for visibility?
   - Options: Exclude overdue (Recommended) | Include overdue
   - **Answer:** Include overdue
   - **Rationale:** The filter should NOT exclude items past their due date. Overdue items are still actionable and important for user visibility. Remove `target_date__gte=today` from backend filter params.

2. **[Assumptions]** How should items with no start_date or no target_date be handled?
   - Options: Exclude both (Recommended) | Null = always valid
   - **Answer:** Exclude both (Recommended)
   - **Rationale:** Only show items where both dates are explicitly set. This ensures clean filter logic and avoids showing items that haven't been properly scheduled.

3. **[Architecture]** What table rendering approach should the TodayWorkItems component use?
   - Options: Plain HTML table (Recommended) | Card + table layout
   - **Answer:** Plain HTML table (Recommended)
   - **Rationale:** Use `<table>` with semantic tokens and Plane Tailwind classes, consistent with existing profile page tables.

4. **[Architecture]** The plan uses useSWR for data fetching. Should we verify first what pattern existing profile components use?
   - Options: Verify existing pattern (Recommended) | Proceed with useSWR
   - **Answer:** Verify existing pattern (Recommended)
   - **Rationale:** Check ProfileActivity / ProfilePriorityDistribution fetch patterns before implementing to ensure consistency.

#### Confirmed Decisions

- Overdue items: **included** — remove `target_date >= today` constraint
- Null dates: **excluded** — require both `start_date` and `target_date` to be set
- Table UI: **plain HTML table** with semantic tokens
- Data fetching: **verify existing pattern** in profile components first

#### Action Items

- [ ] Remove `target_date__gte=today` from frontend filter params (include overdue)
- [ ] Add `start_date__isnull=false` and `target_date__isnull=false` to filter params
- [ ] Before implementing, grep ProfileActivity/ProfilePriorityDistribution for data fetching pattern

#### Impact on Phases

- Phase 1: No backend changes still valid; frontend filter params updated (remove target_date GTE, add null exclusions)
- Phase 2: Verify data fetching pattern step added; filter params updated in architecture section

### Session 2 — 2026-03-25

**Trigger:** Re-validation — surface remaining implementation uncertainties before coding
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** The plan uses `start_date: "${todayStr};before_including;"` as a filter param. Is this the correct format used by the existing user-issues endpoint filter system?
   - Options: Yes, semicolon format is correct | No, verify format first | Use ISO date directly
   - **Answer:** Yes, semicolon format is correct (Recommended)
   - **Rationale:** Confirms the `value;operator;` format is used by the existing endpoint — no format research needed.

2. **[Architecture]** How should null start_date/target_date exclusion be handled?
   - Options: Trust existing filter params | Add explicit isnull=false params | Filter null dates on frontend
   - **Answer:** Trust existing filter params (Recommended)
   - **Rationale:** Passing `start_date__lte=today` naturally excludes nulls since null doesn't satisfy `lte`. No extra params needed — simplifies the filter.

3. **[Architecture]** Does TodayWorkItems need a `"use client"` directive given Next.js App Router?
   - Options: Yes, add "use client" | Check existing pattern first | Use store action instead
   - **Answer:** Yes, add "use client" to component (Recommended)
   - **Rationale:** Component uses useSWR, MobX stores, and browser APIs — must be a client component.

#### Confirmed Decisions

- Filter format: **semicolon format** (`value;operator;`) confirmed correct
- Null date exclusion: **trust `__lte` filter** — no explicit isnull params needed
- Client directive: **add `"use client"`** to `today-work-items.tsx`

#### Action Items

- [ ] Add `"use client"` directive at top of `today-work-items.tsx`
- [ ] No isnull params needed — remove note about backend verification for null handling

#### Impact on Phases

- Phase 2: Add `"use client"` to component; confirm filter format; remove null-exclusion uncertainty note

---

## Dependencies

- `getProgressStatus()` utility in `ce/components/issues/issue-layouts/progress-tracking-utils.ts`
- `UserService.getUserProfileIssues()` at `/api/workspaces/{slug}/user-issues/{userId}/`
- State store for state group lookups
- Project store for project name lookups
- Workspace store for workspace name
