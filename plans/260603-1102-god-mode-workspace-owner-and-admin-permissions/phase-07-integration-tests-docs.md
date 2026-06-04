---
phase: 7
title: "Integration Tests + Docs"
status: completed
priority: P2
effort: "4h"
dependencies: [1, 2, 3, 4, 5, 6]
---

# Phase 7: Integration Tests + Docs

## Overview

End-to-end validation of both features, frontend↔backend menu-key parity, a deployment runbook (job-position upload), and documentation updates.

## Requirements

- Functional:
  1. Integration tests covering the full god-mode flows (owner assignment + RBAC).
  2. A parity assertion that backend `PERMISSION_KEYS` == frontend permission keys.
  3. Manual permission-matrix walkthrough recorded.
  4. Docs + changelog updated.
- Non-functional: tests run under `python run_tests.py` (unit + any contract markers).

## Architecture / Coverage

- **Owner E2E**: instance admin (≠ GD) creates workspace via single + bulk + project-import → owner == GD, admin absent from members; with explicit `owner_id` → that user; no-GD → handled. Project-import must cover BOTH a fresh GD-owned workspace AND a **legacy admin-owned** workspace (red-team H8 — the auto-add-admins loop re-pulls the admin there unless explicitly excluded).
- **RBAC E2E**: super-admin creates scoped admin (menus subset); scoped admin's session — allowed menu API 200, ungranted 403 **including endpoints that previously carried explicit `permission_classes=[InstanceAdminPermission]` overrides** (e.g. `GET /api/instances/users/` — proves the C1 sweep landed); cannot manage admins unless granted `administrators`; last-super-admin guard holds with ghost rows excluded (H9).
- **Parity test**: compare backend `PERMISSION_KEYS` (12 keys — `authentication` folded into `settings`, H6) to frontend permission keys (from `core.ts` item `permission` fields), not sidebar order.
- **Fail-closed coverage test (route-group, C1/M11)**: enumerate every URL pattern in `license/urls.py` (everything reachable under `/api/instances/` — also captures out-of-package views like `SwingSSOTestEndpoint`, `authentication/views/app/swing_sso.py:156`); fail the build if any pattern resolves to neither a `PREFIX_MENU_MAP` entry nor `SHARED_PREFIXES`. Additionally assert **no resolved view class still lists bare `InstanceAdminPermission`** — catches a missed override from the sweep. Do NOT key the test on a `required_menu` attribute (views no longer carry one) or on package-path scanning (misses `swing_sso.py`).

## Related Code Files

- Create: `apps/api/plane/tests/integration/test_god_mode_owner_and_rbac.py` (or `tests/contract/`)
- Create: `apps/api/plane/tests/unit/test_menu_registry_parity.py` (backend invariants: every `PREFIX_MENU_MAP` value ∈ `PERMISSION_KEYS`; `administrators` + `settings` present, NO standalone `authentication`; **every `license/urls.py` pattern maps to `PREFIX_MENU_MAP` or `SHARED_PREFIXES`** + **no bare `InstanceAdminPermission` left on any resolved view** — fail-closed coverage)
- Modify docs: `docs/system-architecture.md` (god-mode RBAC + owner model), `docs/project-changelog.md`
- Create: deployment runbook section — **GD staff-record prerequisite (corrected per red-team C3):** set `job_grade="GD"` on the GD's staff record via the **staff** import/edit path (`license/api/views/staff.py:545,596` / staff bulk import `:330,356`) — the job-positions template upload only seeds `JobGrade`/`JobPosition` lookups and does NOT set `StaffProfile.job_grade`. Verify post-upload that `get_general_director_user()` resolves exactly one user (hard go-live gate).

## Implementation Steps

1. Write integration tests for both features; run `cd apps/api && python run_tests.py` (and `-c` if contract-marked).
2. Add backend invariant test: all `PREFIX_MENU_MAP` values ∈ `PERMISSION_KEYS`; `administrators` + `settings` keys exist (no `authentication` key); every `license/urls.py` pattern mapped-or-shared; no bare `InstanceAdminPermission` remains.
3. Document the frontend↔backend key parity check; add cross-reference comments in both registries.
4. Manual matrix walkthrough on local god-mode (`pnpm dev:local`): record results (super-admin, scoped admin allowed/blocked, owner picker default GD).
5. Update `docs/system-architecture.md` + `docs/project-changelog.md` (severity/impact per documentation rules).
6. Delegate final review to `code-reviewer`; run `tester` on full suite.

## Todo List

- [x] Integration tests green (`tests/contract/license/test_god_mode_owner_and_rbac.py` — scoped-admin lifecycle incl. swept-endpoint 403s + feature composition + delegation; legacy-workspace import covered in unit `test_workspace_owner_assignment.py`)
- [x] URL-coverage/parity invariant test green (`tests/unit/test_menu_registry_parity.py` — every `/api/instances/` route mapped-or-shared, no bare `InstanceAdminPermission` on any resolved view, frontend `core.ts` keys == backend `PERMISSION_KEYS`)
- [ ] Manual permission-matrix walkthrough (steps documented in the rollout runbook §3 — run on `pnpm dev:local` before merging)
- [x] GD staff-record runbook: `docs/shbvn-deployment/03-operations/runbooks/god-mode-gd-owner-and-admin-rbac-rollout.md` (staff path NOT job-positions template; SQL resolver check; ghost-row pre-check; rollback)
- [x] `system-architecture.md` (Security section) + `project-changelog.md` ([Unreleased] 2026-06-03 incl. accepted risks) updated
- [x] code-reviewer passed per phase (P2/P3/P4/P5/P6); full feature suite 105/105; unit+contract suites at clean-develop baseline (verified via develop worktree)

## Success Criteria

- [ ] Full suite green (`python run_tests.py`)
- [ ] No god-mode endpoint left unscoped (coverage test)
- [ ] Frontend/backend menu keys verified equal
- [ ] Docs reflect new owner model + RBAC
- [ ] Manual walkthrough confirms UI hides + API blocks ungranted menus

## Risk Assessment

- **Real-data GD mismatch** — the repo seed empirically stores `job_grade="Director"` for the General Director (`seed_department_staff_data.py:145`), NOT `"GD"` (red-team C2). User decision: keep the `"GD"` contract; the runbook MUST confirm real Shinhan staff data resolves exactly one GD **before go-live** (hard gate, not a soft check). If prod data stores grade names, correct the GD's staff row via the staff path first.
- **Existing admin-owned workspaces** unchanged — call out in changelog. Backfill **declined** (validation V1); H8 exclusion is the permanent mitigation.

## Security Considerations

- Confirm 403 (not just hidden menu) for every ungranted menu's primary data endpoint — the core security claim of "Backend + UI".

## Next Steps

- **Shipping (validation V4): two PRs** — PR1 = Phases 1–3 (owner=GD) + their Phase 7 tests/docs; PR2 = Phases 4–6 (admin RBAC) + their Phase 7 tests/docs. Independent rollback; PR2 carries the 17–27-site permission sweep.
- `/ck:journal` to record decisions. Ship via `/git` per branch rules (develop → preview PRs).

## Decisions Locked (post red-team, rounds 1 + 2)

- Config menus general/email/ai/image **+ authentication** → single `settings` permission (all five share `InstanceConfigurationEndpoint`; all-or-nothing v1; no standalone `authentication` key).
- Migration backfills existing instance admins **with a real user** (`user__isnull=False`) as super-admin; ghost rows excluded; invariant counts only loginable supers.
- Non-super `administrators` admin: grant only menus ⊆ own; no self-edit; cannot mint super-admin. (User re-confirmed round 2 — kept despite YAGNI critique.)
- Lockout guard scope (retargeted): admin table demote/delete + `InstanceUserEndpoint.patch is_active=False` + `InstanceUserResetPasswordEndpoint` + god-mode `InstanceStaffDeactivateEndpoint`/`InstanceStaffBulkActionEndpoint`. App-layer `StaffDeactivateEndpoint` (workspace-scoped, only resigns staff) is NOT a lockout vector — excluded. Owner-owns-workspace deletion guard is **out of scope** (accepted CASCADE risk).
- Backend permission model is **fail-closed via route-group / URL-prefix scoping** (`PREFIX_MENU_MAP` + explicit-override sweep) — per-class `required_menu` annotation rejected (defeated by `permission_classes` overrides, red-team C1).
- GD resolution stays `StaffProfile.job_grade == "GD"`; prod-data confirmation is a **hard go-live gate** (seed data proves the value is not naturally present).
- Kept (user declined cuts, round 2): per-row `owner_email` bulk override, `useMenuAccessGuard`, `AmbiguousGeneralDirector` typed error.

## Unresolved Questions

<!-- Updated: Validation Session 1 - Q1 (backfill: NO, confirmed) and Q2 (audit logging: out of scope) resolved -->

1. ~~Backfill legacy workspaces~~ — **resolved (V1): new creations only.** Project-import into legacy workspaces relies on the explicit acting-admin exclusion (H8) permanently.
2. ~~Audit logging~~ — **resolved (V2): out of scope v1.**
3. **Data prerequisite (hard gate):** confirm real staff data stores `job_grade="GD"` on exactly one active staff — blocks Phase 1 go-live (seed data does NOT satisfy this).
4. Pre-existing `InstanceAdmin` rows with `user=NULL` on target instances? If yes, the orphan-filtered backfill (H9) is load-bearing — verify with `psql` before migrating (local dev DB was down during validation; run against UAT/prod).
