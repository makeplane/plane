---
phase: 2
title: "Workspace Owner Assignment (backend)"
status: completed
priority: P1
effort: "6h"
dependencies: [1]
---

# Phase 2: Workspace Owner Assignment (backend)

## Overview

Change every god-mode workspace/project creation path so the **owner is the GD (or an explicitly chosen user), never the instance admin**, and the instance admin is **not** added as a workspace member. Add an endpoint that returns the default owner + candidate users for the create UI (Phase 3).

## Key Insights — current code (verified)

- Single create `apps/api/plane/license/api/views/workspace.py:91-98`: `serializer.save(owner=request.user)` + `WorkspaceMember(member=request.user, role=20)`.
- Bulk create `workspace_bulk_create.py:113-123`: `Workspace.objects.create(owner=request.user)` + `WorkspaceMember(member=request.user, role=20)` inside `transaction.atomic()`.
- Project bulk import `workspace_project_bulk_import.py:238-286`: `Project.objects.create(created_by=request.user, updated_by=request.user)` + `ProjectMember(member=request.user, role=ADMIN)` + auto-adds all workspace admins. This imports into **existing** workspaces, so its concern is the admin becoming a project member.
- `Workspace.owner` is a non-null FK (`db/models/workspace.py:131-135`); `WorkspaceMember.role` choices `(20 Admin,15 Member,5 Guest)`.

## Requirements

- Functional:
  1. Single create accepts optional `owner_id`/`owner_email`; resolves owner = explicit > GD; errors if neither.
  2. Bulk create: owner = optional per-row `owner_email` > GD; row fails with clear message if neither resolvable.
  3. Project bulk import: keep `created_by`/`updated_by` = `request.user` (the **actual actor** — preserves audit/activity/notification FK integrity), but **do not** add the instance admin as a `ProjectMember`. Seed the owner `ProjectMember(role=20)` from the **workspace owner** instead. (Membership semantics change; attribution does not.) **Legacy-workspace caveat (red-team H8):** project import targets **existing** workspaces; the existing "auto-add all active `role=20` WorkspaceMembers as ProjectMembers" loop (`workspace_project_bulk_import.py:265-277`) will re-pull the instance admin on any **legacy admin-owned** workspace (admin still a `WorkspaceMember` there — no backfill). So the admin-exclusion goal holds for GD-owned workspaces but silently fails for legacy ones. The import must **explicitly exclude the acting instance admin's `user_id`** from the seeded/auto-added ProjectMembers unless they are the resolved workspace owner.
  4. In all paths, the instance admin gets **no** `WorkspaceMember`/`ProjectMember` row (unless the admin is themselves the chosen owner/GD).
  5. New endpoint `GET /api/instances/workspaces/owner-options/` → `{ default_owner: {id,display_name,email}|null, candidates: [...] }`.
- Non-functional: keep `transaction.atomic()`; validate chosen owner is a real `User`; deterministic.

## Architecture

- Shared helper `resolve_workspace_owner(explicit_user=None) -> User`:
  - explicit user (validated) wins; else `get_general_director_user()` (Phase 1); else raise `ValidationError`. Propagate `AmbiguousGeneralDirector` → 400 "ambiguous GD".
- Owner becomes `Workspace.owner` **and** the sole seeded `WorkspaceMember(role=20)`.
- **Bulk create fail-fast:** if no per-row `owner_email` and GD unresolvable (zero or ambiguous), return a single top-level 400 ("no resolvable GD; provide owner_email") — do NOT emit N identical per-row skip errors.
- `owner-options` endpoint: `default_owner` = GD serialized; `candidates` = active staff users (id, display_name, email) for the picker (reuse staff/user listing; cap + searchable via `?search=`).
- **PII gate (red-team M12):** the `candidates` list exposes every active staff member's email — broader than the create function needs. A `workspace`-only scoped admin must NOT get a full staff directory dump. Gate candidate **enumeration** behind the `staff` (or `users`) menu: an admin without it receives `default_owner` only (empty/disabled `candidates`), and must explicitly hold `staff`/`users` to search the directory. `default_owner` (the single GD) is always returned. Cap + rate-limit `?search`.
- **Route ordering:** register `owner-options/` BEFORE the existing `workspaces/<str:slug>/` catch-all (`urls.py:109`) — otherwise the slug pattern captures `owner-options`.
- Project bulk import: seed owner `ProjectMember` from `workspace.owner`; `created_by` stays the actor (see Requirements 3). Verify the "auto-add workspace admins to project" loop no longer pulls the instance admin (they're not a WorkspaceMember now) and still adds the real owner/admins.

## Related Code Files

- Modify: `apps/api/plane/license/api/views/workspace.py` (single create owner logic)
- Modify: `apps/api/plane/license/api/views/workspace_bulk_create.py` (per-row owner)
- Modify: `apps/api/plane/license/api/views/workspace_project_bulk_import.py` (created_by/member = owner, drop admin)
- Create: `apps/api/plane/license/api/views/workspace_owner_options.py` (new endpoint)
- Create: `apps/api/plane/utils/workspace_owner_resolver.py` (`resolve_workspace_owner`)
- Modify: `apps/api/plane/license/urls.py` (register `owner-options/`)
- Modify: `apps/api/plane/license/api/views/__init__.py`
- Create tests: `apps/api/plane/tests/unit/test_workspace_owner_assignment.py`

## Implementation Steps (TDD)

1. **Tests first** (`test_workspace_owner_assignment.py`), using an instance admin caller distinct from GD:
   - single create with no `owner_id` + GD exists → workspace.owner == GD; admin has **no** WorkspaceMember; GD has role 20.
   - single create with explicit `owner_id` → that user is owner; admin excluded.
   - single create, no owner + no GD → 400 with clear error.
   - bulk create, GD exists → all owners == GD; admin excluded.
   - bulk create row with `owner_email` → overrides GD for that row; invalid email → that row errors, others succeed.
   - project bulk import into a **GD-owned** workspace → instance admin not a ProjectMember; owner seeded from workspace.owner; created_by == actor (admin).
   - project bulk import into a **legacy admin-owned** workspace (admin still a `role=20` WorkspaceMember) → instance admin still NOT added as ProjectMember (explicit exclusion holds); real owner/admins added. (H8 regression test — must use a legacy workspace, not a fresh GD one.)
   - `owner-options` returns GD as `default_owner`; `candidates` populated only when caller holds `staff`/`users` menu, else empty (M12).
2. Run → fail.
3. Implement `resolve_workspace_owner`, refactor 3 views, add endpoint + URL + `__init__` exports.
4. Run `python run_tests.py -u` → green. Run impact check before editing each view (`gitnexus_impact`).

## Todo List

- [x] Failing tests for all owner-assignment scenarios (18 tests, confirmed failing first)
- [x] `resolve_workspace_owner` helper (`plane/utils/workspace_owner_resolver.py`)
- [x] Refactor single create
- [x] Refactor bulk create (per-row owner + fail-fast 400)
- [x] Refactor project bulk import (owner seeded from workspace.owner, acting admin excluded incl. legacy H8 case)
- [x] `owner-options` endpoint + URL (before slug catch-all) + exports
- [x] Unit tests green (28/28 new+P1; full suite shows only the 20 pre-existing develop failures)

> M12 note: candidate enumeration gate implemented defensively in `workspace_owner_options.py:_can_enumerate_candidates` — consults `is_super_admin`/`allowed_menus` when present (Phase 4), full-access pre-RBAC. Scoped-admin empty-candidates test lands with Phase 4 fields.
> Ambiguous-GD on owner-options returns `default_owner: null` (UI forces explicit pick); creation endpoints still 400 with the explicit ambiguity message.

## Success Criteria

- [ ] Instance admin is never a member/owner of god-mode-created workspaces (unless chosen)
- [ ] Default owner = GD across single + bulk paths
- [ ] Explicit override honored; missing owner handled (400 single, per-row error bulk)
- [ ] `owner-options` returns correct default + candidates
- [ ] All unit tests pass

## Risk Assessment

- **`owner` FK is non-null** — if no GD and no explicit owner, creation must fail cleanly, not 500. Covered by ValidationError test.
- **Existing god-mode-created workspaces** keep the admin as owner/member — **confirmed: new creations only, no backfill, no script** (validation V1). <!-- Updated: Validation Session 1 - backfill declined -->
- **Project bulk import "auto-add workspace admins"** — verify this no longer pulls the instance admin (they're not a member now). Add assertion.
- **Owner FK ↔ WorkspaceMember decoupling** — grep for code assuming `workspace.owner` always has a `WorkspaceMember` row, and check `is_board_of_director_workspace` (workspace.py:140) + department `is_department_manager` auto-join (staff.py:57) interactions before asserting "admin fully excluded" is safe. `total_members` count (workspace.py:48-54) will no longer include the admin — expected.
- **Owner = GD on every workspace concentrates `owner` FK (on_delete=CASCADE, workspace.py:131-135) on one business user.** Deleting that user cascade-deletes all their workspaces. Accepted risk per user (no owner-based delete guard in scope); mitigated only by the last-super-admin guard (Phase 5). Document in changelog (Phase 7).

## Security Considerations

- Validate `owner_id`/`owner_email` resolves to a real `User`; reject otherwise (no silent fallback to admin).
- `owner-options` is enforced via the route-group permission (Phase 4): the `/api/instances/workspaces/` group → `workspace` menu. **Candidate enumeration** additionally requires the `staff`/`users` menu (M12); `default_owner` is always returned to a `workspace`-menu admin.

## Next Steps

- Phase 3 wires the create UI to `owner-options` + sends `owner_id`.
- Backfill of existing admin-owned workspaces: **resolved — not in scope** (validation V1).
