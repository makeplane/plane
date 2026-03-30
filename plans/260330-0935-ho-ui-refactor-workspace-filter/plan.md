---
title: "HO View Refactor: Table UX + Workspace/Project Filters"
description: "Sticky headers, zebra rows, frozen columns for HO tables; add workspace & project filter selectors to toolbar"
status: pending
priority: P1
effort: 6h
branch: ngoc-feat/workspaces-default-view
tags: [ho, ui-refactor, filters, backend]
created: 2026-03-30
---

# HO View Refactor: Table UX + Workspace/Project Filters

## Summary

Three concerns:

1. **Table UX** - sticky header, horizontal scroll, frozen first column, zebra rows, click-outside dismiss for display props
2. **Workspace filter** - new API endpoint + selector in toolbar, filters both views
3. **Project filter** - conditional selector when workspace selected, filters both views

## Phases

| #   | Phase                                                                                              | Status  | Effort | Files                                      |
| --- | -------------------------------------------------------------------------------------------------- | ------- | ------ | ------------------------------------------ |
| 1   | [Backend: workspace/project filter params + accessible workspaces endpoint](./phase-01-backend.md) | Pending | 1.5h   | `ho.py` (views), `ho.py` (urls)            |
| 2   | [Frontend: service + store updates](./phase-02-store-service.md)                                   | Pending | 1.5h   | `ho-issue.service.ts`, `ho-issue.store.ts` |
| 3   | [UI: selectors + table refactor](./phase-03-ui.md)                                                 | Pending | 3h     | 8 component files                          |

## Dependencies

- Phase 2 blocked by Phase 1 (needs API params)
- Phase 3 blocked by Phase 2 (needs store observables)

## Rollback

- Phase 1: revert `ho.py` views + urls — existing queries unchanged
- Phase 2: revert service + store — no schema changes
- Phase 3: revert component files — pure UI

## Red Team Review

### Session — 2026-03-30

**Findings:** 15 (15 accepted, 0 rejected)
**Severity breakdown:** 2 Critical, 8 High, 5 Medium

| #   | Finding                                                 | Severity | Disposition | Applied To     |
| --- | ------------------------------------------------------- | -------- | ----------- | -------------- |
| 1   | `project_id` bypasses workspace authorization           | Critical | Accept      | Phase 1        |
| 2   | Concurrent filter fetches produce split-brain UI        | Critical | Accept      | Phase 2        |
| 3   | UUID 500 not in Todo checklist                          | High     | Accept      | Phase 1        |
| 4   | `Issue.objects` violates backend architecture rule      | High     | Accept      | Phase 1 (note) |
| 5   | `ws.logo` wrong field (use `ws.logo_url` property)      | High     | Accept      | Phase 1        |
| 6   | MobX strict mode violation in setWorkspaceFilter        | High     | Accept      | Phase 2        |
| 7   | `bg-inherit` breaks frozen column zebra rows            | High     | Accept      | Phase 3        |
| 8   | `fetchCategorySummary` params underspecified            | High     | Accept      | Phase 2        |
| 9   | No loading state during filter changes                  | High     | Accept      | Phase 2/3      |
| 10  | i18n has no enforcement mechanism                       | High     | Accept      | Phase 3        |
| 11  | Silent workspace fetch errors hide auth failures        | Medium   | Accept      | Phase 2        |
| 12  | Double mount fetches with no dedup                      | Medium   | Accept      | Phase 2/3      |
| 13  | `sticky top-0` unvalidated against scroll root          | Medium   | Accept      | Phase 3        |
| 14  | Workspace projects endpoint leaks private project names | Medium   | Accept      | Phase 1        |
| 15  | Store file size acceptance criterion missing            | Medium   | Accept      | Phase 2        |

## Key Decisions

- Workspace selector = **single-select** (not multi) to enable project sub-filter
- Project selector = **multi-select** (filter by 1+ projects within workspace)
- Backend uses `workspace_slug` param (not `workspace_id`) for consistency with Plane URL patterns
- `HoAccessibleWorkspacesView` returns flat list with nested projects — single API call, no waterfall

## Validation Log

### Session 1 — 2026-03-30

**Trigger:** Pre-implementation validation interview
**Questions asked:** 6

#### Questions & Answers

1. **[Assumptions]** `workspace_project` reverse relation name for Project→Workspace — has it been verified?
   - Options: Verified | Not verified — add pre-check | Unknown — skip
   - **Answer:** Not verified — add pre-check to todo
   - **Rationale:** Wrong reverse name causes FieldError at runtime; must grep before writing any code

2. **[Architecture]** Two fetch paths (\_fetchFiltered for filters, fetchIssues for pagination) — intentional split?
   - Options: Split is intentional | Unify through \_fetchFiltered
   - **Answer:** Split is intentional
   - **Rationale:** Pagination appends pages; filter changes replace all data — different semantics warrant separate paths

3. **[UX]** How should workspace selector handle "clear / show all workspaces"?
   - Options: Add "All workspaces" first option | X button | Re-click to deselect
   - **Answer:** Add "All workspaces" as first option (sentinel value = `""`)
   - **Rationale:** No custom UI needed; sentinel option calls `setWorkspaceFilter(null)`

4. **[Scope]** ko/vi translations for new `ho.*` i18n keys — who handles, when?
   - Options: Machine translations now | English-only placeholders | Block on proper translations
   - **Answer:** Ship with machine translations
   - **Rationale:** Avoids blocking; native review can happen in a localization pass

5. **[Risk]** `max-h-[calc(100vh-200px)]` sticky offset — how to handle?
   - Options: Measure in browser during implementation | Dynamic measurement | Safe large value
   - **Answer:** Measure in browser during implementation
   - **Rationale:** Developer replaces 200px with actual measured value on first render

6. **[Scope]** Filter persistence (workspace slug + project IDs) across page refresh?
   - Options: In-memory only | URL query params | localStorage
   - **Answer:** In-memory only for now
   - **Rationale:** Simplest approach; URL-based persistence is a follow-up if requested

#### Confirmed Decisions

- `workspace_project` reverse name: **not verified** — must grep before Phase 1 implementation
- Fetch paths: **split intentional** — `_fetchFiltered` for filter changes, `fetchIssues` for pagination
- Workspace clear: **"All workspaces" sentinel option** in `HoWorkspaceSelect`
- i18n: **machine translations** for ko/vi; ship now, native review deferred
- Sticky offset: **measure in browser** during Phase 3 implementation
- Filter state: **in-memory only** — no URL/localStorage persistence in this PR

#### Action Items

- [ ] Phase 1: Add grep step to verify `workspace_project` reverse relation before coding
- [ ] Phase 3: Add "All workspaces" sentinel option (value=`""`) as first option in `HoWorkspaceSelect`
- [ ] Phase 3: Machine-translate `ho.*` keys for ko/vi (mark with `// TODO: native review`)

#### Impact on Phases

- Phase 1: Add pre-check todo item for `workspace_project` reverse name
- Phase 3: Update `HoWorkspaceSelect` snippet to include sentinel "All workspaces" option
