---
title: "Update Default States & Permission Control"
description: "Seed new default state set with Scheduled as default; lock system states to instance/god-mode admins only"
status: in-progress
priority: P2
effort: 5h
branch: ngoc-feat/workspaces
tags: [states, permissions, seeding, god-mode, instance-admin]
created: 2026-03-11
---

# Update Default States & Permission Control

## Goal

1. Replace default state seed with new set (Draft, Scheduled, In Progress, Under Review, Postponed, Done, Cancelled)
2. Default state = **Scheduled**
3. System states are immutable by regular users — only **instance admin** or **god-mode admin** can create/edit/delete them

## Default State Mapping

| Group           | States                               |
| --------------- | ------------------------------------ |
| Draft (backlog) | Draft                                |
| Unstarted       | **Scheduled** ← default              |
| Started         | In Progress, Under Review, Postponed |
| Completed       | Done                                 |
| Cancelled       | Cancelled                            |

## Phases

| #   | Phase                                                                   | Status     | Effort |
| --- | ----------------------------------------------------------------------- | ---------- | ------ |
| 1   | [Backend: Model & Migration](./phase-01-backend-model-migration.md)     | ✅ done    | 1h     |
| 2   | [Backend: API Permission Guards](./phase-02-backend-api-permissions.md) | ✅ done    | 1.5h   |
| 3   | [Backend: Data Migration](./phase-03-backend-data-migration.md)         | ✅ done    | 0.5h   |
| 4   | [Frontend: Types & Store](./phase-04-frontend-types-store.md)           | ⬜ pending | 1h     |
| 5   | [Frontend: UI Permission Guards](./phase-05-frontend-ui-guards.md)      | ⬜ pending | 1h     |

## Validation Log

### Session 1 — 2026-03-11

**Trigger:** Initial plan validation before implementation
**Questions asked:** 4

#### Questions & Answers

1. **[Data Migration]** Phase 3 renames ALL existing "Todo" states to "Scheduled" across every project in the DB. Is this the intended scope?
   - Options: Yes, rename all | Only new projects | Only specific workspaces
   - **Answer:** Yes, rename all
   - **Rationale:** Consistent rename across all projects; existing issues in "Todo" state will display as "Scheduled" after migration.

2. **[Architecture]** The goal mentions "god-mode admin" alongside instance admin, but Phase 2 only checks InstanceAdmin (role≥15). Should god-mode (superuser/staff Django user) also bypass system state guards?
   - Options: Instance admin only | Also allow Django superuser
   - **Answer:** Instance admin only
   - **Rationale:** Keep permission check simple — only InstanceAdmin record with role≥15 can mutate system states. No Django superuser bypass needed.

3. **[Scope]** Phase 5 leaves unresolved: can project admins drag-reorder system states (changing sequence only)?
   - Options: Allow reorder | Block reorder too
   - **Answer:** Allow reorder
   - **Rationale:** Sequence changes are cosmetic. No backend guard needed for PATCH that only updates sequence on system states.

4. **[Scope]** Phase 5 leaves unresolved: where should the "System" lock badge appear?
   - Options: Settings only | Settings + pickers
   - **Answer:** Settings only
   - **Rationale:** Lock badge in project settings state list only — not in issue sidebar state dropdowns.

#### Confirmed Decisions

- Data migration scope: rename all Todo→Scheduled across all projects
- Permission model: InstanceAdmin only (role≥15), no Django superuser bypass
- Reorder: allowed for all admins (no sequence guard on system states)
- System badge: project settings only

#### Action Items

- [x] Phase 2: No superuser check needed — InstanceAdmin only
- [x] Phase 5: Remove "unresolved" items, resolve both as per decisions above

#### Impact on Phases

- Phase 2: Confirm no Django superuser bypass — already correctly scoped
- Phase 5: Resolve unresolved questions — reorder allowed, badge in settings only

### Session 2 — 2026-03-12

**Trigger:** Re-validation before implementation — surfaced implementation conflicts with Session 1 decisions
**Questions asked:** 4

#### Questions & Answers

1. **[Architecture]** Phase 2 blocks ALL PATCH on system states (`partial_update`) for non-instance-admins, but Session 1 decided reorder (sequence-only PATCH) should be allowed for project admins. How should Phase 2 handle sequence-only patches on system states?
   - Options: Allow sequence-only | Block all PATCH | No backend guard on PATCH
   - **Answer:** Allow sequence-only (Recommended)
   - **Rationale:** Phase 2's blanket PATCH guard was inconsistent with Session 1 Q3 decision. Must check request payload — if only `sequence` key is present, skip the is_system guard.

2. **[Architecture]** Phase 3 data migration adds 'Under Review' and 'Postponed' using `bulk_create(ignore_conflicts=True)`. If a project has a custom state with the same name, it won't hit the DB constraint and a duplicate is created. How should duplicates be handled?
   - Options: Skip by name check | Accept duplicates | Skip all custom projects
   - **Answer:** Skip by name check (Recommended)
   - **Rationale:** The existing `has_review` / `has_postponed` Python-level checks in Phase 3 are sufficient. No duplicates will be created if any state with that name already exists. `ignore_conflicts=True` is a safety net only.

3. **[Scope]** Phase 1's DEFAULT_STATES includes 'Triage' (8 states total), but the plan Goal only lists 7 states. Should Triage be part of the new default state set?
   - Options: Include Triage (keep as-is) | Remove Triage
   - **Answer:** Include Triage (keep as-is)
   - **Rationale:** 8 states including Triage. Phase 3 correctly includes "Triage" in OLD_SYSTEM_NAMES.

4. **[Risks]** Phase 3 sets Todo→Scheduled with `default=True` BEFORE unsetting Draft's `default=False`. If a unique constraint on (project_id, default=True) exists, the migration would fail. What's the safe ordering?
   - Options: Unset Draft first (Recommended) | Keep current order
   - **Answer:** Unset Draft first (Recommended)
   - **Rationale:** Reverse the order in Phase 3 to avoid potential constraint violation: unset Draft default first, then rename Todo→Scheduled+default=True.

#### Confirmed Decisions

- Reorder PATCH: allowed for non-admins if only `sequence` in payload; block all other field patches
- Duplicate guard: Python name-check is sufficient; no behavior change needed
- Triage: included in default set (8 states)
- Migration order: unset Draft default → then set Scheduled as default

#### Action Items

- [ ] Phase 2: Add payload inspection to `partial_update` — skip is_system guard if only `sequence` key
- [ ] Phase 3: Reorder migration — unset Draft default BEFORE renaming Todo→Scheduled

#### Impact on Phases

- Phase 2: `partial_update` guard must allow sequence-only PATCH from non-admins
- Phase 3: Swap order — unset Draft default first, then set Scheduled default

### Session 3 — 2026-03-12

**Trigger:** Re-validation before implementation — surfaced Phase 2/5 conflict on mark_default, is_instance_admin sourcing, and states.json Triage inconsistency
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 2 guards `mark_default` to instance-admin only for system states. Phase 5 says mark-default stays accessible for any project admin. Which is correct?
   - Options: Allow project admins | Instance admin only
   - **Answer:** Instance admin only
   - **Rationale:** Phase 5's note was wrong. Backend guard in Phase 2 stands: only instance admins can mark a system state as default. Phase 5 must be corrected.

2. **[Architecture]** If `is_instance_admin` is missing from `/api/users/me/` response, what's the approach?
   - Options: Add field to /users/me/ | Separate endpoint | Skip if already exists
   - **Answer:** Skip if already exists — don't add backend changes. If field is missing, stop and reassess.
   - **Rationale:** Avoids scope creep. The field likely already exists; implementation should verify first and not preemptively extend the backend.

3. **[Scope]** Phase 3 step 3 says states.json should be updated "minus Triage", but Phase 1 confirmed Triage IS in DEFAULT_STATES. Should states.json include Triage?
   - Options: Include Triage | Exclude Triage
   - **Answer:** Include Triage — keep states.json consistent with DEFAULT_STATES (all 8 states)
   - **Rationale:** Phase 3 step 3 had a typo/error. Correct to include all 8 states.

#### Confirmed Decisions

- mark_default: Phase 2 guard stands — instance admin only for system state mark_default
- is_instance_admin: implement only if field already exists in user store; no backend changes
- states.json: include all 8 states including Triage

#### Action Items

- [ ] Phase 5: Correct "mark-default stays accessible" note — system state mark_default requires instance admin
- [ ] Phase 3: Fix "minus Triage" comment in step 3 → "including Triage (8 states total)"
- [ ] Phase 4: Add note — verify is_instance_admin exists before implementing; do NOT add backend field

#### Impact on Phases

- Phase 5: Correct mark-default accessibility note — instance admin only for system states
- Phase 3: Fix step 3 states.json description — include Triage
- Phase 4: Clarify is_instance_admin sourcing — verify-first approach, no preemptive backend change

### Session 4 — 2026-03-12

**Trigger:** Re-validation — surfaced Phase 5 Requirements conflict, missing mark-default UI todo, and Triage group validity
**Questions asked:** 3

#### Questions & Answers

1. **[Conflict]** Phase 5 Requirements item 4 says "allow for all admins" for mark-default — contradicts Session 3. Should Requirements be corrected?
   - Options: Correct it | Leave as-is
   - **Answer:** Correct it
   - **Rationale:** Phase 5 Requirements must match the Session 3 decision: mark-default on system states requires instance admin. Requirements item 4 updated.

2. **[Gap]** Phase 5 Todo doesn't include hiding mark-default button on system states for non-instance-admins. Add explicit todo?
   - Options: Add to todo | Skip — backend guards it
   - **Answer:** Skip — backend guards it
   - **Rationale:** Backend 403 is the real enforcement. No frontend guard for mark-default needed.

3. **[Migration]** Phase 3 marks Triage is_system=True but doesn't update its group field. How should existing Triage group be handled?
   - Options: Update group to 'triage' | Leave group as-is
   - **Answer:** Force group='unstarted' — 'triage' is not a valid frontend group. All Triage states go to unstarted. Verify triage group validity.
   - **Custom input:** Update is_system=True and force group='unstarted' (since 'triage' is not a valid group). All Triage states should belong to the unstarted group. But should double check group triage, i dont see it in the system
   - **Rationale:** 'triage' IS a valid Django group choice (TRIAGE = "triage" in StateGroupChoices) but is NOT in frontend TStateGroups (`"backlog"|"unstarted"|"started"|"completed"|"cancelled"`). Using 'unstarted' ensures correct frontend display. Phase 1 DEFAULT_STATES Triage group also updated to 'unstarted' for consistency.

#### Confirmed Decisions

- Phase 5 Requirements item 4: corrected to "instance admin only for system states mark-default"
- mark-default UI guard: not needed — backend 403 sufficient
- Triage group: 'unstarted' (not 'triage') for both migration and DEFAULT_STATES

#### Action Items

- [x] Phase 5: Correct Requirements item 4 — instance admin only for mark-default on system states
- [x] Phase 3: Update migration to set group='unstarted' for existing Triage states (with is_system=True)
- [x] Phase 1: Change DEFAULT_STATES Triage group from 'triage' to 'unstarted'

#### Impact on Phases

- Phase 1: Triage `group` changed from `'triage'` to `'unstarted'` in DEFAULT_STATES
- Phase 3: Migration splits Triage from other OLD_SYSTEM_NAMES — applies `is_system=True, group='unstarted'`
- Phase 5: Requirements item 4 corrected

### Session 5 — 2026-03-12

**Trigger:** Pre-implementation final validation — surfaced Phase 4 todo inconsistency, migration nullable risk, and 0136 dirty state
**Questions asked:** 3

#### Questions & Answers

1. **[Gap]** Phase 4 Todo says "add is_instance_admin if missing" but Step 2 says "STOP if not exists". If is_instance_admin is absent from the user store, what should implementation do?
   - Options: STOP — don't add it | Add to user store only | Add frontend + backend
   - **Answer:** STOP — don't add it
   - **Rationale:** Consistent with Session 3. Phase 4 Todo had stale wording — must be corrected to match step 2 decision.

2. **[Risk]** Phase 3 bulk_create creates State objects without setting created_by/updated_by. Are these fields nullable?
   - Options: Nullable — safe to omit | Required — need to set them | Check before implementing
   - **Answer:** Nullable — safe to omit
   - **Rationale:** No change to Phase 3 needed. ProjectBaseModel fields are nullable; bulk_create will succeed.

3. **[Scope]** apps/api/plane/db/migrations/0136_remove_default_labels_from_projects.py is modified in the working tree. Should it be committed before Phase 1 makemigrations?
   - Options: Commit 0136 first | Proceed as-is | Discard 0136 changes
   - **Answer:** Commit 0136 first
   - **Rationale:** Phase 1 implementation must start by committing the modified 0136 migration to avoid dirty state conflicts when generating the 0137 migration.

#### Confirmed Decisions

- is_instance_admin missing → STOP, do not add any fields
- bulk_create created_by/updated_by → nullable, no change needed
- Modified 0136 → commit before running Phase 1 makemigrations

#### Action Items

- [ ] Phase 4: Fix Todo — remove "add if missing" language, replace with "STOP if not found"
- [ ] Phase 1: Add prerequisite note — commit modified 0136 before running makemigrations

#### Impact on Phases

- Phase 4: Todo item 2 corrected to match step 2 decision
- Phase 1: Add prerequisite step to commit 0136 first

### Session 6 — 2026-03-12

**Trigger:** Pre-implementation final cleanup — stale text, mark-default UX, test scope
**Questions asked:** 3

#### Questions & Answers

1. **[Consistency]** Phase 4 Risk Assessment still says "need small backend check (GET /api/users/me/)" but Session 3 decided STOP if is_instance_admin is missing. Should this stale text be removed?
   - Options: Remove stale text | Leave as-is
   - **Answer:** Remove stale text
   - **Rationale:** Phase 4 Risk Assessment now matches Session 3 STOP decision. No fallback backend check.

2. **[UX]** Phase 5 has no frontend guard on mark-default for system states — non-instance-admins get a silent 403. Acceptable?
   - Options: Acceptable — backend only | Add canModifyState guard to mark-default button
   - **Answer:** Acceptable — backend only
   - **Rationale:** Consistent with Session 4 Q2. Backend 403 is the real enforcement. No UI guard for mark-default needed.

3. **[Testing]** Phase 2 mentions unit tests; Phases 3 and 5 do not. Expected test coverage?
   - Options: Phase 2 only | Phase 2 + Phase 3 | All phases
   - **Answer:** Phase 2 only
   - **Rationale:** Unit tests for backend permission guards only. Migration correctness verified manually on local DB per Phase 3 todo.

#### Confirmed Decisions

- Phase 4 Risk Assessment: stale fallback text removed — STOP if is_instance_admin missing
- mark-default UI guard: not needed — backend 403 sufficient (confirmed again)
- Test scope: Phase 2 unit tests only

#### Action Items

- [x] Phase 4: Remove stale Risk Assessment text

#### Impact on Phases

- Phase 4: Risk Assessment updated — no backend fallback for missing is_instance_admin

### Session 7 — 2026-03-12

**Trigger:** Final pre-implementation validation — Triage migration gap, tooltip UX, empty PATCH edge case
**Questions asked:** 3

#### Questions & Answers

1. **[Gap]** Phase 3 marks existing "Triage" states as is_system=True but doesn't ADD Triage to projects that don't have it. The old DEFAULT_STATES didn't include Triage, so most existing projects won't have it. Should the migration also bulk-create Triage for those projects?
   - Options: Add Triage to all projects | Skip — only new projects get Triage | Add only if project has all other system states
   - **Answer:** Skip — only new projects get Triage
   - **Rationale:** Existing projects keep their current states intact. Triage will only appear on projects created after migration. This avoids forced state injection into established projects.

2. **[UX]** Phase 5 plans to show a tooltip for non-admins on system states — but edit/delete buttons will be hidden, so there's no hover target. Where should the explanation tooltip appear?
   - Options: On the lock badge | Disable buttons instead of hiding | No tooltip
   - **Answer:** Disable buttons instead of hiding
   - **Rationale:** Show grayed-out edit/delete buttons with tooltip on hover. Users can see the buttons exist but can't click them — communicates restricted access more clearly than invisibility.

3. **[Architecture]** Phase 2 sequence guard: `set(request.data.keys()) <= {"sequence"}`. An empty PATCH `{}` evaluates to True (empty set is subset of anything) — does this get through the guard?
   - Options: Allow empty PATCH — no-op is harmless | Block empty PATCH on system states
   - **Answer:** Allow empty PATCH — no-op is harmless
   - **Rationale:** `set() <= {"sequence"}` is True, so empty PATCH bypasses the is_system guard — but an empty PATCH has no effect on the state. Guard behavior is correct.

#### Confirmed Decisions

- Triage migration: skip existing projects — Triage only on new projects post-migration
- Edit/delete buttons: disabled (not hidden) for non-admins on system states; tooltip on hover
- Empty PATCH: allowed — no-op, no behavior change needed

#### Action Items

- [ ] Phase 3: Add note — Triage NOT added to existing projects (intentional)
- [ ] Phase 5: Change "hidden" → "disabled" for edit/delete on system states; tooltip on button hover

#### Impact on Phases

- Phase 3: Clarify Triage scope — existing projects skip Triage, new projects get all 8 states
- Phase 5: Update button behavior — disabled with tooltip, not hidden

### Session 8 — 2026-03-12

**Trigger:** Post-implementation review — Triage appeared in States settings for new projects; user explicitly rejected it

#### Decision: Remove Triage from default state set

Sessions 2–4 had confirmed Triage should be included (8 states). User overrode this:

- **Triage is a core Intake/internal feature**, not a user-facing default state
- Sessions 2–4 were wrong to include it in `DEFAULT_STATES` and `states.json`

#### Changes Made

| File                                    | Change                                                               |
| --------------------------------------- | -------------------------------------------------------------------- |
| `apps/api/plane/db/models/state.py`     | Removed Triage entry from `DEFAULT_STATES` (now 7 states)            |
| `apps/api/plane/seeds/data/states.json` | Removed Triage entry (now 7 states)                                  |
| `apps/api/plane/db/migrations/0140`     | Removed `update(is_system=True, group='unstarted')` block for Triage |

#### DB Fix

Migration `0140` had already run in container with old Triage code. Fix applied:

```
migrate db 0139   # rollback 0140
migrate db        # re-apply 0140 with new code
```

Also generated + applied migration `0141` (pending model changes from workflow feature).

#### Final Default State Set (7 states)

| Group           | States                               |
| --------------- | ------------------------------------ |
| Draft (backlog) | Draft                                |
| Unstarted       | **Scheduled** ← default              |
| Started         | In Progress, Under Review, Postponed |
| Completed       | Done                                 |
| Cancelled       | Cancelled                            |

> Triage state is **not** a default — it's created automatically by the Intake system when needed. The `TRIAGE` group, `TriageStateManager`, `is_triage` field, and all related Intake code remain intact (upstream feature).

---

## Key Files

- `apps/api/plane/db/models/state.py` — model + DEFAULT_STATES
- `apps/api/plane/app/views/state/base.py` — state CRUD views
- `apps/api/plane/app/views/project/base.py` — project creation seeding
- `apps/api/plane/license/api/permissions/instance.py` — InstanceAdminPermission
- `packages/types/src/state.ts` — IState type
- `apps/web/core/store/state.store.ts` — MobX state store
- `apps/web/core/components/project-states/` — UI components
