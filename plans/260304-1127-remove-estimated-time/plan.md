---
title: "Remove Estimated Time from Work Items"
description: "Remove estimate_time field from work items across DB, backend API, and frontend"
status: completed
priority: P2
effort: 2h
branch: ngoc-feat/work-items
tags: [cleanup, work-items, field-removal]
created: 2026-03-04
---

# Remove Estimated Time from Work Items

## Overview

Remove the `estimate_time` field (added in migration 0124) from the Issue model and all layers that reference it. The field stores time estimates in minutes on work items; it is being removed as part of work item field cleanup.

## Phases

| #   | Phase                   | Status    | Effort | File                                                                       |
| --- | ----------------------- | --------- | ------ | -------------------------------------------------------------------------- |
| 1   | Backend API Cleanup     | completed | 30m    | [phase-02-backend-api.md](./phase-02-backend-api.md)                       |
| 2   | Database Migration      | completed | 20m    | [phase-01-database-migration.md](./phase-01-database-migration.md)         |
| 3   | Frontend Types & Stores | completed | 20m    | [phase-03-frontend-types-stores.md](./phase-03-frontend-types-stores.md)   |
| 4   | Frontend UI Components  | completed | 30m    | [phase-04-frontend-ui-components.md](./phase-04-frontend-ui-components.md) |

**Execution order: 2→1→3→4** (Backend cleanup first, then migration, then frontend)

## Key Dependencies

- Backend API cleanup (phase-02) must run BEFORE the database migration (phase-01)
- Migration runs automatically as part of deploy pipeline — no manual step needed
- Frontend type changes will cause compile errors that must be resolved in phases 3-4
- Time tracking report page relies on `estimate_time` for variance calculations

## Risk Summary

- **Low**: Field is nullable, removal wont break existing data
- **Medium**: Time tracking report loses estimated vs actual comparison; decide if acceptable
- **Low**: Activity log history references `estimate_time` -- old activities remain in DB but wont break

## Unresolved Questions

~~1. Should time tracking report's "Estimated" column and variance calculation be removed entirely, or replaced with a different estimate source?~~ → **Resolved: Remove entirely**
~~2. Should the capacity report (`capacity_report.py`) that aggregates `estimate_time` be updated to use `estimate_point` or removed?~~ → **Resolved: Remove aggregation**
~~3. Should old `IssueActivity` records with `field="estimate_time"` be cleaned up via data migration?~~ → **Resolved: Leave as-is**

## Validation Log

### Session 1 — 2026-03-04

**Trigger:** Initial plan validation before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Time tracking report currently shows 'Estimated' column + variance (actual vs estimated). After removing estimate_time, what should happen?
   - Options: Remove entirely | Replace with estimate_point
   - **Answer:** Remove entirely
   - **Rationale:** Simplifies Phase 2 (no replacement logic) and Phase 4 (entire estimated column removed from UI table)

2. **[Scope]** Capacity report aggregates estimate_time for workload calculation. After removal, what should happen?
   - Options: Remove aggregation | Switch to estimate_point
   - **Answer:** Remove aggregation (remove total_estimated entirely)
   - **Rationale:** No new logic needed in capacity_report.py; just clean removal

3. **[Architecture]** Old IssueActivity records with field='estimate_time' (change history) — what to do?
   - Options: Leave as-is | Clean up via data migration
   - **Answer:** Leave as-is
   - **Rationale:** No data migration needed; old records harmless, simpler implementation

#### Confirmed Decisions

- Time tracking estimated column: **Remove entirely** — no replacement
- Capacity report total_estimated: **Remove entirely** — no replacement
- IssueActivity history: **Leave as-is** — no data migration

#### Action Items

- [ ] Phase 2: Remove entire Estimated column + variance from time_tracking.py views (not just annotate)
- [ ] Phase 4: Remove entire Estimated column from time-tracking-summary-cards.tsx (not just hide)
- [ ] No data migration phase needed

#### Impact on Phases

- Phase 2: Confirm full removal of `estimate_time` from time tracking views and capacity report (no replacement logic)
- Phase 4: Remove entire Estimated column UI from `time-tracking-summary-cards.tsx` and `time-tracking-issue-table.tsx`

### Session 2 — 2026-03-04

**Trigger:** Re-validation to address remaining decision points (phase order, file deletion, deploy strategy)
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase execution order conflict: plan.md Key Dependencies says 'Migration must run AFTER all backend code references are removed', but Phase 1 was listed as the first phase. What should the actual execution order be?
   - Options: Backend first (2→1→3→4) | As listed (1→2→3→4)
   - **Answer:** Backend first (2→1→3→4)
   - **Rationale:** Running migration before backend cleanup risks runtime errors if any code still annotates/queries the dropped column. Safe order: cleanup code, then drop column.

2. **[Scope]** Phase 4: additional-properties.tsx — the plan said 'delete file if nothing else remains'. Should we pre-confirm to always delete it, or check content first?
   - Options: Always delete it | Check first, then decide
   - **Answer:** Always delete it
   - **Rationale:** File exists solely for estimate_time. Unconditional deletion simplifies implementation — no conditional check needed at implementation time.

3. **[Architecture]** Production deployment: should migration run automatically with deploy or manually after?
   - Options: Auto with deploy | Manual after deploy
   - **Answer:** Auto with deploy
   - **Rationale:** Standard deploy pipeline handles migration. Nullable column removal is safe — no code will reference it post-deploy.

#### Confirmed Decisions

- Phase execution order: **2→1→3→4** (backend cleanup before migration)
- additional-properties.tsx: **Always delete** — unconditional
- Deploy strategy: **Auto with deploy** — migration runs in pipeline

#### Action Items

- [x] Update phase execution order in plan.md
- [ ] Phase 4: Update step to unconditionally delete additional-properties.tsx (remove conditional)

#### Impact on Phases

- Phase 1 (migration): Now runs after Phase 2 — update its Overview to reflect it is step 2 in execution
- Phase 4: Remove "if nothing else remains" condition from Step 1 — always delete the file

### Session 3 — 2026-03-04

**Trigger:** Final validation to close remaining inconsistencies and gaps
**Questions asked:** 3

#### Questions & Answers

1. **[Scope]** Phase 4 'Files to Modify' table still lists additional-properties.tsx as a file to modify, but 'Files to Delete' and implementation steps both say to delete it unconditionally. Should this inconsistency be cleaned up?
   - Options: Yes, clean it up | Leave as-is
   - **Answer:** Yes, clean it up
   - **Rationale:** Removes ambiguity — implementer sees exactly one instruction (delete) with no conflicting modify entry.

2. **[Scope]** Phase 2 doesn't mention searching for or updating backend unit tests that may reference estimate_time. Should this be added as a step?
   - Options: Add a step to check/remove tests | Skip — no tests for this field
   - **Answer:** Add a step to check/remove tests
   - **Rationale:** Avoids broken test suite after field removal; grep-first approach is safe and low-effort.

3. **[Scope]** Docs update (docs/codebase-summary.md, system-architecture.md) listed only in Phase 4 next steps. How should this be tracked?
   - Options: Add as action item in plan.md | Leave in Phase 4 next steps | Skip docs update
   - **Answer:** Add as action item in plan.md
   - **Rationale:** Ensures docs update is not accidentally skipped; formal tracking in plan.md makes it visible.

#### Confirmed Decisions

- Phase 4 Files to Modify: **cleaned** — additional-properties.tsx removed from modify table
- Backend tests: **check and remove** — grep test files for estimate_time, remove/update found cases
- Docs update: **formal action item** — tracked in plan.md

#### Action Items

- [x] Phase 4: Remove additional-properties.tsx from Files to Modify table (done)
- [x] Phase 2: Add Step 6 to search/remove backend tests referencing estimate_time (done)
- [ ] Post-implementation: Update docs/codebase-summary.md and docs/system-architecture.md to remove estimate_time references

#### Impact on Phases

- Phase 2: Added Step 6 (search and remove/update backend tests)
- Phase 4: Files to Modify table cleaned up — additional-properties.tsx now only in Files to Delete
