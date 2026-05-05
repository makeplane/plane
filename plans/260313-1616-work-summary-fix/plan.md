---
title: "Fix Your Work Summary Tab Metrics"
description: "Fix incorrect metrics in Summary tab (workload, right panel) of Your Work / Profile feature"
status: complete
priority: P1
effort: 2h
branch: ngoc-feat/workspaces
tags: [profile, summary, workload, metrics, bug]
created: 2026-03-13
---

# Fix Your Work — Summary Tab Metrics

## Context

"Work" feature = **Your Work** profile page at `/{workspace}/profile/[userId]/`
Tabs: Summary | Assigned | Created | Subscribed | Activity

Two confirmed bugs from screenshot + investigation:

1. **Workload total = 21 ≠ Subscribed = 23** → workload only counts assigned, not subscribed
2. **Right panel (sidebar) numbers differ from overview** → inflated counts due to missing soft-delete filter

## Architecture

```
WorkspaceUserProfileStatsEndpoint  →  /api/workspaces/{slug}/user-stats/{userId}/
  - state_distribution (workload)  → filters: assignees__in=[user_id]
  - created_issues                 → Issue.issue_objects (auto soft-delete filtered)
  - assigned_issues                → parent__isnull=True
  - subscribed_issues              → IssueSubscriber queryset

WorkspaceUserProfileEndpoint       →  /api/workspaces/{slug}/user-profile/{userId}/
  - project_data[]                 → Project.objects.annotate(Count("project_issue",...))
    - created_issues, assigned_issues, completed_issues, pending_issues
    ⚠ Uses Project.objects (NOT Issue.issue_objects) → soft-deleted issues counted!
```

## Confirmed Bugs (from screenshot)

### Bug 1: Workload total (21) ≠ Subscribed (23)

- **What**: Workload section sums to 0+3+5+12+1=21 = assigned count, not subscribed (23)
- **Root cause**: `state_distribution` query filters `assignees__in=[user_id]` only
- **2 missing items**: issues user subscribed to but not assigned
- **Fix**: Include subscribed-but-not-assigned issues in state_distribution OR add label clarification

### Bug 2: Right panel project data inflated (Assigned=35 vs overview=21, Completed=13 vs workload=12)

- **Root cause**: `WorkspaceUserProfileEndpoint` uses `Project.objects` → `project_issue` reverse FK traversal WITHOUT `deleted_at__isnull=True` → soft-deleted issues counted
- **Sub-bug A**: `assigned_issues` count missing `deleted_at__isnull=True` → inflated (35 vs 21)
- **Sub-bug B**: `completed_issues` uses `completed_at__isnull=False` (timestamp) vs workload uses `state__group="completed"` → inconsistent (13 vs 12)
- **Fix**: Add `deleted_at__isnull=True` to all Count annotations; align `completed_issues` to `state__group="completed"`

## Phases

1. **[phase-01] Fix WorkspaceUserProfileEndpoint** — Add soft-delete filter + align completed metric
2. **[phase-02] Fix state_distribution scope** — Include subscribed issues in workload OR clarify label
3. **[phase-03] Default Filters (start_date/target_date)** — Original task, lower priority

## Key Files

| File                                                     | Purpose                                                   |
| -------------------------------------------------------- | --------------------------------------------------------- |
| `apps/api/plane/app/views/workspace/user.py:280-369`     | `WorkspaceUserProfileEndpoint` (right panel data)         |
| `apps/api/plane/app/views/workspace/user.py:404-523`     | `WorkspaceUserProfileStatsEndpoint` (overview + workload) |
| `apps/web/core/components/profile/overview/workload.tsx` | Workload UI component                                     |
| `apps/web/core/components/profile/overview/stats.tsx`    | Overview stats cards                                      |
| `apps/web/core/components/profile/sidebar.tsx`           | Right panel project breakdown                             |

## Unresolved Questions

1. ~~**Workload scope**~~ → **Resolved**: Assigned-only (21). Add label clarification.
2. ~~**"Due" label**~~ → **Resolved**: Exclude draft. Due = backlog + unstarted + started only.
3. ~~**Default filters**~~ → **Resolved**: Workspace-views ("Daily Status" view).

## Validation Log

### Session 1 — 2026-03-13

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Scope]** Phase 01 is listed as "Investigation" but the plan already documents root causes and code paths. Is the investigation already done, or should Phase 01 still be executed?
   - Options: Skip Phase 01 | Run Phase 01 anyway
   - **Answer:** Skip Phase 01 (Recommended)
   - **Rationale:** Investigation was completed during planning. Root causes are fully documented. No need to re-execute as a phase — saves time, jump straight to Phase 02.

2. **[Architecture]** Bug 1: Workload section total (21) ≠ Subscribed count (23). How should the workload scope be defined?
   - Options: Assigned-only (21) | All involvement (23)
   - **Answer:** Assigned-only (21)
   - **Rationale:** Workload = assignments is the correct semantic. Subscribed count is a separate concept. Fix is: add a label/tooltip clarification, not change the query scope.

3. **[Tradeoffs]** Phase 03 — Date filter for analytics is currently commented out. What should we do?
   - Options: Defer to separate PR | Fix in this PR
   - **Answer:** Defer to separate PR
   - **Rationale:** Date filter uncomment affects all analytics behavior. Keeping it out of this PR reduces risk and scope. Focus on cancelled metric + label accuracy now.

4. **[Architecture]** Phase 02 approach: Populate rich_filters with date conditions. Which approach?
   - Options: Option A: Backend seed + migration | Option B: Frontend fallback
   - **Answer:** Option A: Backend seed + migration
   - **Rationale:** Clean backend-only change. No frontend coupling. Migration covers existing workspaces; signal covers new ones.

#### Confirmed Decisions

- Phase 01: Skip — investigation already complete
- Workload scope: Assigned-only — add label clarification, no query change
- Date filter: Defer — separate PR after this one
- Phase 02 approach: Option A (backend rich_filters seed + migration)

#### Action Items

- [ ] Update Phase 02 to remove Option B consideration
- [ ] Update Phase 03 to explicitly exclude date filter work (move to future plan)
- [ ] Add workload label clarification task to Phase 03 or phase-01 (repurposed)

#### Impact on Phases

- Phase 01: Skip execution entirely — already done
- Phase 02: Confirmed Option A only — remove Option B references
- Phase 03: Remove date filter from scope; add workload label clarification task

### Session 2 — 2026-03-13

**Trigger:** Re-validation to resolve remaining open questions before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Plan.md documents WorkspaceUserProfileEndpoint bugs (soft-delete filter + completed alignment) but no phase file covers them. How should these be handled?
   - Options: Add to Phase 03 (Recommended) | New Phase 04 | Separate PR
   - **Answer:** Add to Phase 03
   - **Rationale:** Both are backend data correctness bugs. Folding into Phase 03 avoids creating an extra phase and keeps the PR self-contained.

2. **[Architecture]** Phase 02 needs to seed `rich_filters` for the Daily Status view. What format should `rich_filters` use?
   - Options: Relative operators (Recommended) | Static ISO date
   - **Answer:** Relative operators — `{"start_date": ["today;after_including;"], "target_date": ["today;before_including;"]}`
   - **Rationale:** Matches the legacy `filters` format and stays always-relative to today. Static ISO dates would be stale after 24h.

3. **[Tradeoffs]** Sidebar 'Due' metric = pending_issues (backlog + unstarted + started). Should `draft` be included?
   - Options: Exclude draft (Recommended) | Include draft | Skip — don't change Due
   - **Answer:** Exclude draft
   - **Rationale:** Draft issues are pre-triage and not yet actionable. Due = backlog + unstarted + started only.

#### Confirmed Decisions

- Profile endpoint bugs: Fold into Phase 03 (not a separate phase/PR)
- `rich_filters` date format: Relative operators matching legacy `filters` schema
- Due metric: Exclude draft state — no change to current formula

#### Action Items

- [ ] Add WorkspaceUserProfileEndpoint fixes to Phase 03 implementation steps
- [ ] Update Phase 02 `rich_filters` schema example to use relative operator format
- [ ] Mark "Due" question as resolved in plan.md Unresolved Questions

#### Impact on Phases

- Phase 02: Update schema example from AND-group form to relative operator form
- Phase 03: Add WorkspaceUserProfileEndpoint soft-delete filter + completed alignment steps

### Session 3 — 2026-03-13

**Trigger:** Pre-implementation — final decisions on remaining open items (migration strategy, card order, workload label)
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Migration 0146 (`seed_default_workspace_views`) already exists. For the `rich_filters` update, should we modify 0146 or create a new 0147 migration?
   - Options: Modify 0146 (Recommended) | Create new 0147
   - **Answer:** Create new 0147
   - **Rationale:** 0146 may already be applied in staging/prod. Creating 0147 is the safe path — avoids replaying a migration that has already run.

2. **[Architecture]** Phase 03 adds 'cancelled' to the analytics insight cards. Where should the cancelled card appear in the row?
   - Options: After completed (Recommended) | Before completed
   - **Answer:** After completed — order: Total → Started → Backlog → Unstarted → Completed → Cancelled
   - **Rationale:** Completed and cancelled grouped together as terminal states. Matches natural reading order (active states first, terminal last).

3. **[Architecture]** Workload label clarification placement (showing "Assigned issues only").
   - Options: Tooltip on section title (Recommended) | Static subtitle | Skip — no change
   - **Answer:** Tooltip on section title
   - **Rationale:** Info icon with tooltip keeps the UI clean without permanent visual noise. "Assigned issues only" text on hover/focus.

#### Confirmed Decisions

- Migration: Create new 0147 — don't modify already-applied 0146
- Cancelled card order: After completed (Total → Started → Backlog → Unstarted → Completed → Cancelled)
- Workload label: Info tooltip on section title (not static subtitle)

#### Action Items

- [ ] Update Phase 02 to reference new 0147 migration file (not modification of 0146)
- [ ] Update Phase 03 insight card implementation to place cancelled after completed
- [ ] Update Phase 03 workload task to specify tooltip implementation

#### Impact on Phases

- Phase 02: Change migration step from "modify 0146" to "create 0147"
- Phase 03: Specify cancelled card position (after completed); specify tooltip for workload label

### Session 4 — 2026-03-13

**Trigger:** Post-implementation UI adjustments (Summary tab hide + always-show filter bar)
**Type:** Targeted changes, no validation needed

#### Changes Made

1. **Hide Summary tab overview content**
   - File: `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx`
   - All overview components commented out: `ProfileStats`, `ProfileWorkload`, `ProfilePriorityDistribution`, `ProfileStateDistribution`, `ProfileActivity`
   - Page renders empty (only `<PageHead>`)
   - Reason: UI decision — overview stats hidden for now

2. **Always show filter bar in Assigned/Created/Subscribed tabs**
   - File: `apps/web/core/components/profile/profile-issues.tsx`
   - Added `showOnMount` prop to `WorkspaceLevelWorkItemFiltersHOC`
   - Effect: `filter.isVisible = true` on mount → filter row always visible regardless of toggle state
   - Mechanism: `showOnMount` flows through `WorkItemFiltersHOC` → `getOrCreateFilter` → `setInitialVisibility({ autoSetVisibility: false, isVisibleOnMount: true })`

#### Commits

- `b1fa9f101` — `feat(analytics): add cancelled_work_items metric and fix soft-delete filtering`
- `47997fbca` — `feat(ui): add cancelled_work_items insight and update analytics labels`
- Session 4 changes not yet committed
