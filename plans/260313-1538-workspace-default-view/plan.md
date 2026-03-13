---
title: "Default Workspace View"
description: "Auto-seed a daily-status spreadsheet view with 16 columns for every workspace"
status: done
priority: P1
effort: 20h
branch: ngoc-feat/workspaces
tags: [workspace, views, spreadsheet, default-view]
created: 2026-03-13
completed: 2026-03-13
---

# Default Workspace View

## Goal

Every workspace gets an auto-seeded, non-deletable spreadsheet view ("Daily Status") with `start_date=today` + `due_date=today` filters and 16 ordered columns.

## Phases

| #   | Phase                                                              | Effort | Status  | File                                                      |
| --- | ------------------------------------------------------------------ | ------ | ------- | --------------------------------------------------------- |
| 1   | Backend: `is_bank_wide_project` on Project                         | 1.5h   | ✅ Done | [phase-01](phase-01-backend-bank-wide-project.md)         |
| 2   | Backend: Default view seed + `is_default` flag                     | 4h     | ✅ Done | [phase-02](phase-02-backend-default-view-seed.md)         |
| 3   | Backend: Extended spreadsheet data (completed_at, links, worklogs) | 3h     | ✅ Done | [phase-03](phase-03-backend-extended-spreadsheet-data.md) |
| 4   | Frontend: 7 new spreadsheet columns in CE                          | 5h     | ✅ Done | [phase-04](phase-04-frontend-spreadsheet-columns.md)      |
| 5   | Frontend: Default view UI (lock icon, auto-select, column order)   | 4h     | ✅ Done | [phase-05](phase-05-frontend-default-view-ui.md)          |
| 6   | Integration & validation                                           | 2.5h   | ✅ Done | [phase-06](phase-06-integration-validation.md)            |

## Key Architecture Decisions

1. **`is_default` on IssueView** -- boolean field; `destroy()` checks it before deletion
2. **Data migration + post_save signal** -- migration seeds existing workspaces; signal handles future ones
3. **CE-only columns** -- 7 new column components in `apps/web/ce/components/issues/spreadsheet/columns/`; extend `SPREADSHEET_COLUMNS` map and `IIssueDisplayProperties` type
4. **`display_properties` JSON** -- stores all 16 column toggles; new keys added to type + constant
5. **Filters use relative "today"** -- frontend resolves `today` to actual date at view-load time; backend stores filter key pattern, not a literal date

## Dependencies

- `is_bank_wide` field already exists on Project model (migration 0143)
- `completed_at` already serialized in `ViewIssueListSerializer`
- `WorklogStore.getTotalMinutesForIssue` exists in core store
- `SPREADSHEET_COLUMNS` in CE `utils.tsx` is the extension point

## Risks

- **Column performance**: lazy-load links + worklogs per-row to avoid N+1
- **Filter "today" semantics**: use existing `today` operator (commit c0ae60711). Verify exact filter format before Phase 2.
- **Migration on large DB**: data migration must be batched for workspaces with many rows

## Validation Log

### Session 1 — 2026-03-13

**Trigger:** Initial plan creation
**Questions asked:** 6

#### Questions & Answers

1. **[Scope]** "Bank-wide Project" column — project-level flag or issue-level flag?
   - Options: Project-level | Issue-level
   - **Answer:** Project-level
   - **Rationale:** All issues in a project share the same Y/N. Stored on Project model (field may already exist from migration 0143). No Issue model change needed.

2. **[Architecture]** For the default filter "today", use existing operator or implement manually?
   - Options: Dynamic token | Literal date injection
   - **Answer:** Use existing today operator (commit c0ae60711 added extended operators)
   - **Custom input:** "hiện tại đã có operator là today vậy có dùng được không?" (Can we use the existing today operator?)
   - **Rationale:** Verify exact format (e.g., `"today"` or `"today;after_including;"`) in extended operators implementation before writing Phase 2 filter config.

3. **[UX]** Auto-select default view on workspace views page load?
   - Options: Auto-navigate | Pinned at top, manual click
   - **Answer:** Auto-navigate to default view

4. **[UX]** Total Log time display format?
   - Options: Xh Ym | Decimal hours | Minutes only
   - **Answer:** Xh Ym (e.g., "2h 30m")

5. **[Architecture]** Column order for default view — fixed or user-reorderable?
   - Options: Fixed order | Allow reorder
   - **Answer:** Fixed order for default view. User-created views remain reorderable.

#### Confirmed Decisions

- Bank-wide Project: project-level flag — no Issue model change
- Filter "today": use existing `today` operator — verify format from c0ae60711 first
- Auto-select: auto-navigate to default view on page load
- Log time: "Xh Ym" format
- Column order: fixed in default view, free in user views

#### Action Items

- [ ] Grep c0ae60711 changes to find exact `today` operator filter format before Phase 2
- [ ] Verify `is_bank_wide_project` field exists on Project model (migration 0143) in Phase 1

#### Impact on Phases

- Phase 2: Use verified `today` operator format in DEFAULT_VIEW_CONFIG filters
- Phase 4: Add note that `SPREADSHEET_PROPERTY_LIST` order is locked for default view
- Phase 5: Default view columns are non-reorderable; UI must reflect this (no drag handles in default view)

### Session 2 — 2026-03-13

**Trigger:** Re-validation to surface uncovered implementation decisions in phases 2–5
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 4: `department_name` column — where does the department name come from?
   - Options: Workspace name | Project field | Workspace field
   - **Answer:** Workspace name
   - **Rationale:** `department_name` column simply reads `workspace.name` from the root store. No new fields or migrations needed.

2. **[Architecture]** Phase 3: Reference links — how should the `reference_link` column fetch data?
   - Options: Lazy-load per visible row | Fetch on component mount | Include in list API response
   - **Answer:** Lazy-load per visible row (IntersectionObserver)
   - **Rationale:** Avoids N+1 queries on large issue lists. Fetch links only when the row scrolls into the viewport.

3. **[Architecture]** Phase 4: Progress tracking thresholds — when is an issue "At Risk"?
   - Options: ≤1 day remaining | ≤3 days remaining | Configurable per workspace
   - **Answer:** ≤1 day remaining
   - **Rationale:** Due today or tomorrow = At Risk. Matches hardcoded logic in phase-04 spec. No config needed.

4. **[Architecture]** Phase 2: When seeding default view for a workspace, who owns it (`owned_by`)?
   - Options: Workspace creator | First workspace admin | System/bot user
   - **Answer:** Workspace creator (`workspace.owner`)
   - **Rationale:** Always exists, deterministic. No need to query WorkspaceMember or maintain a system user.

#### Confirmed Decisions

- `department_name`: reads `workspace.name` — no new model field
- Reference links: IntersectionObserver lazy-load per visible row — no backend annotation change
- Progress tracking: ≤1 day = At Risk, fixed thresholds, no config
- Default view `owned_by`: `workspace.owner` (creator)

#### Action Items

- [ ] Phase 4: `department-name-column.tsx` reads from `useWorkspace().currentWorkspace.name`
- [ ] Phase 3: `reference-link-column.tsx` uses IntersectionObserver; fetch links only on visibility
- [ ] Phase 2: Data migration + signal use `workspace.owner` as `owned_by`, no fallback query needed

#### Impact on Phases

- Phase 3: No backend annotation for links — lazy-load frontend only; confirm in implementation notes
- Phase 4: `department-name-column.tsx` data source = `workspace.name` (not a new field)
- Phase 2: `owned_by = workspace.owner` confirmed — simplifies both data migration and signal

### Session 3 — 2026-03-13

**Trigger:** Re-validation to resolve 3 remaining open implementation decisions before coding
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 2: Where should the `post_save` Workspace signal be placed?
   - Options: Dedicated signals file | In workspace model file | In existing signals file
   - **Answer:** Dedicated signals file (Recommended)
   - **Rationale:** Create `apps/api/plane/db/signals/workspace.py`. Keeps models clean, follows Django best practices. Must be imported in `AppConfig.ready()`.

2. **[Risk]** Phase 5: If the existing filter parser doesn't support the `today;after_including;` token, what's the fallback strategy?
   - Options: Implement token parser | Inject literal date on page load | Verify first, decide later
   - **Answer:** Implement token parser (Recommended)
   - **Rationale:** Add a `today` date-token resolver in frontend filter utilities. Universal fix, works for all views and future filters — not just the default view. Phase 5 should implement this proactively.

3. **[Architecture]** Phase 5: What URL pattern should auto-navigation to the default view use?
   - Options: Query param `?viewId=` | Route segment `/workspace-views/{id}`
   - **Answer:** Query param `?viewId=` (Recommended)
   - **Rationale:** Matches existing router pattern for workspace views. Use `router.replace()` to avoid polluting history stack.

#### Confirmed Decisions

- Signal file: `apps/api/plane/db/signals/workspace.py` (dedicated, imported in AppConfig.ready)
- `today` filter fallback: implement token parser in filter utilities (Phase 5)
- Auto-nav URL: `router.replace('/workspace-views?viewId={id}')` — query param pattern

#### Action Items

- [ ] Phase 2: Create `apps/api/plane/db/signals/workspace.py` with `post_save` signal; register in AppConfig
- [ ] Phase 5: Implement `today` date-token resolver in filter utilities before wiring up default view filters

#### Impact on Phases

- Phase 2: Signal goes in dedicated file `apps/api/plane/db/signals/workspace.py`, not in model file
- Phase 5: Proactively add token parser for `today;before_including;` / `today;after_including;` in filter resolution; auto-nav uses `router.replace` with `?viewId=` query param

---

## Implementation Notes (Session 2026-03-13)

### Bugs Found & Fixed During Implementation

#### 1. CE Hook Barrel Import

- **Bug**: 4 CE column files used `from "@/hooks/store"` (barrel import that doesn't exist)
- **Fix**: Changed to specific paths: `@/hooks/store/use-project`, `@/hooks/store/use-workspace`, `@/hooks/store/use-issue-detail`
- **Also fixed**: `reference-link-column.tsx` was calling `fetchPeekIssueDetails` (non-existent) → changed to `issueDetail.link.fetchLinks(workspaceSlug, projectId, issueId)`

#### 2. Today-Filter Too Restrictive

- **Bug**: Filter injection used `start_date >= today AND target_date <= today` — this requires issues to both start AND end on the same day → 0 results
- **Fix**: Removed filter injection entirely. Daily Status shows all workspace issues.
- **Result**: `DEFAULT_VIEW_FILTERS = {}` in both migration 0146 and workspace signal; `getFilterParams` no longer injects dates

#### 3. `getComputedDisplayProperties` Strips CE Keys — ROOT CAUSE of missing columns

- **Bug**: `getComputedDisplayProperties()` in `packages/utils/src/work-item/base.ts` had a hardcoded whitelist of 16 core keys → the 7 CE keys were completely removed on every `fetchFilters` response parse
- **Fix**: Added all 7 CE keys with `false` as default (non-destructive — existing views remain unchanged)
- **File**: `packages/utils/src/work-item/base.ts` lines 294-323

#### 4. Missing i18n Keys

- **Bug**: Column headers showed raw i18n keys (e.g. `spreadsheet.columns.department_name`)
- **Fix**: Added `spreadsheet.columns.*` section to `en/translations.ts`, `ko/translations.ts`, `vi/translations.ts`

### Migrations Applied

- `0145_issueview_is_default` — ✅ Applied
- `0146_seed_default_workspace_views` — ✅ Applied

### Key Files Changed

| File                                                      | Change                                                                         |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `packages/utils/src/work-item/base.ts`                    | Added 7 CE keys to `getComputedDisplayProperties`                              |
| `packages/constants/src/issue/common.ts`                  | `SPREADSHEET_PROPERTY_LIST` + `SPREADSHEET_PROPERTY_DETAILS` with 7 CE entries |
| `packages/types/src/view-props.ts`                        | `IIssueDisplayProperties` extended with 7 optional CE keys                     |
| `packages/i18n/src/locales/{en,ko,vi}/translations.ts`    | `spreadsheet.columns.*` i18n keys                                              |
| `apps/web/ce/components/issues/spreadsheet/columns/*.tsx` | 7 new column components                                                        |
| `apps/web/ce/components/issues/issue-layouts/utils.tsx`   | `SPREADSHEET_COLUMNS` map extended                                             |
| `apps/web/core/store/issue/workspace/filter.store.ts`     | Removed over-restrictive today-filter injection                                |
| `apps/api/plane/db/migrations/0145_*.py`                  | `is_default` field on `IssueView`                                              |
| `apps/api/plane/db/migrations/0146_*.py`                  | Seed Daily Status view for all workspaces                                      |
| `apps/api/plane/db/signals/workspace.py`                  | Auto-create Daily Status on new workspace                                      |
| `apps/api/plane/db/models/view.py`                        | `is_default` field on `IssueView` model                                        |
