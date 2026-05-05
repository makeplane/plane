---
title: "Rename state 'Backlog' → 'Draft'"
description: "Rename all display labels of the Backlog state group to 'Draft' across frontend, i18n, and backend seed/dummy data. Internal group key 'backlog' unchanged."
status: complete
priority: P2
effort: 1.5h
branch: ngoc-feat/work-items
tags: [state, rename, i18n, seed-data]
created: 2026-03-06
---

# Plan: Rename state "Backlog" → "Draft"

## Scope Decision

> **Internal group key `"backlog"` stays unchanged.** Only the _display name_ changes: `"Backlog"` → `"Draft"`.
>
> Renaming the key would require Django migrations, data migrations, TS type changes, and touches 80+ files — high risk for a cosmetic rename.

## Phases

| #   | Phase                                                             | Status   | Effort |
| --- | ----------------------------------------------------------------- | -------- | ------ |
| 1   | [Frontend constants & types](phase-01-frontend.md)                | complete | 30m    |
| 2   | [i18n locales (EN/KO/VI)](phase-02-i18n.md)                       | complete | 20m    |
| 3   | [Backend seed / dummy data + data migration](phase-03-backend.md) | complete | 30m    |
| 4   | [Tests](phase-04-tests.md)                                        | complete | 20m    |

## Validation Log

### Session 1 — 2026-03-06

**Trigger:** Initial plan creation validation
**Questions asked:** 3

#### Questions & Answers

1. **[Scope: Existing Data]** The plan leaves existing DB state records named 'Backlog' unchanged (no data migration). Users with existing projects will still see 'Backlog' in their states. Is this acceptable?
   - Options: Yes, new projects only | Add data migration too
   - **Answer:** Add data migration too
   - **Rationale:** Existing projects with "Backlog" state will show inconsistent naming vs new projects. A targeted UPDATE migration ensures uniform display without touching the `group` key.

2. **[i18n Language]** For KO and VI locales, the plan uses the English word 'Draft' instead of localized terms. Intentional?
   - Options: Yes, keep 'Draft' in English | Use localized equivalents
   - **Answer:** Yes, keep 'Draft' in English
   - **Rationale:** Consistent branding across all locales; no localized term needed.

3. **[Scope]** Are there other user-facing surfaces where 'Backlog' should also be renamed?
   - Options: No, current scope is sufficient | Do a broader grep first | Yes, email/notifications too
   - **Answer:** Do a broader grep first
   - **Rationale:** A full-repo grep may surface additional hardcoded strings not caught by the initial analysis; Phase 01 should begin with this grep before making changes.

#### Confirmed Decisions

- Data migration: required — SQL UPDATE to rename existing state records with `name='Backlog'` and `group='backlog'`
- i18n language: English "Draft" for all locales
- Scope: confirm via full-repo grep before implementing

#### Action Items

- [x] Expand Phase 03 to include a Django data migration
- [x] Update Phase 01 to start with a full-repo grep for hardcoded "Backlog" strings

#### Impact on Phases

- Phase 01: Add step 0 — run full-repo grep for hardcoded `"Backlog"` display strings before editing
- Phase 03: Add data migration step (new Django migration file) to rename existing state records

### Session 2 — 2026-03-06

**Trigger:** Re-validation to surface remaining implementation risks
**Questions asked:** 3

#### Questions & Answers

1. **[Migration scope]** The data migration filters `name='Backlog' AND group='backlog'`. Should soft-deleted states be renamed too?
   - Options: Skip soft-deleted | Include soft-deleted
   - **Answer:** Skip soft-deleted
   - **Rationale:** Soft-deleted records are invisible to users; only rename active states by adding `deleted_at__isnull=True` to the filter.

2. **[Grep scope]** Phase 01 grepping is scoped to `packages/` and `apps/web/`. Should it also cover `apps/space/`, `apps/admin/`, etc.?
   - Options: All apps | packages/ + apps/web/ only
   - **Answer:** All apps
   - **Rationale:** Other app surfaces may have hardcoded "Backlog" strings; grep should cover all `apps/` subdirectories.

3. **[Migration dep]** The data migration template has placeholder `XXXX_previous` for the dependency. How to resolve?
   - Options: Auto-detect at run time | Leave as placeholder
   - **Answer:** Auto-detect at run time
   - **Rationale:** During Phase 03 implementation, grep migrations folder for latest number and fill it in before committing.

#### Confirmed Decisions

- Data migration filter: add `deleted_at__isnull=True` — only rename active state records
- Grep scope: expand to all `apps/` subdirectories, not just `apps/web/`
- Migration dependency: auto-detect latest migration number at implementation time

#### Action Items

- [ ] Update Phase 03 data migration to add `deleted_at__isnull=True` filter
- [ ] Update Phase 01 grep command to cover all `apps/` (not just `apps/web/`)
- [ ] Add note to Phase 03 to detect and fill in correct migration dependency before committing

#### Impact on Phases

- Phase 01: Expand grep to `apps/` instead of `apps/web/`
- Phase 03: Add `deleted_at__isnull=True` to migration filter; add note to resolve migration dependency

### Session 3 — 2026-03-06

**Trigger:** Re-validation to surface remaining edge cases
**Questions asked:** 3

#### Questions & Answers

1. **[Testing]** Phase 04 only covers backend tests. Are frontend tests (Vitest/Jest) for state label rendering also needed?
   - Options: Backend only | Add frontend tests too
   - **Answer:** Backend only
   - **Rationale:** The rename is cosmetic; backend contract tests are sufficient. Frontend label correctness is verified by the constants change + manual QA.

2. **[Migration]** The data migration runs on deploy and immediately renames all existing 'Backlog' states. Should there be any gate or coordination before running it?
   - Options: Run immediately on deploy | Manual step / scheduled
   - **Answer:** Run immediately on deploy
   - **Rationale:** Rename is fully reversible via the down migration; no gate needed.

3. **[Space app]** Does `apps/space/` use the shared `packages/constants` STATE_GROUPS, or does it have its own hardcoded state labels?
   - Options: Uses shared constants | Has its own hardcoded labels
   - **Answer:** Uses shared constants
   - **Rationale:** Phase 01 changes to `packages/constants` automatically cover `apps/space/` — no extra files to update.

#### Confirmed Decisions

- Frontend tests: not required — backend tests sufficient for cosmetic rename
- Migration gate: none — deploy and run immediately
- Space app: covered by shared constants — no additional work

#### Action Items

- (none — all decisions confirm existing plan scope)

#### Impact on Phases

- No phase changes required
