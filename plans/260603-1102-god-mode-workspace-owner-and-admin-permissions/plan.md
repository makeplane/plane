---
title: "God-Mode Workspace Owner (GD) + Instance Admin Menu Permissions"
description: "Default workspace owner = GD (top job grade) instead of instance admin; add god-mode Administrators menu with per-menu view permissions (backend-enforced)."
status: completed
priority: P1
branch: "ngoc-feat/god-mode-owner-permissions"
tags: [god-mode, admin, workspace, permissions, rbac]
blockedBy: []
blocks: []
created: "2026-06-03T04:47:05.472Z"
createdBy: "ck:plan"
source: skill
mode: deep
tdd: true
---

# God-Mode Workspace Owner (GD) + Instance Admin Menu Permissions

## Overview

Two changes to god-mode (`apps/admin/` + `apps/api/plane/license/`):

1. **Workspace owner = GD, not instance admin.** Today every god-mode creation path sets `owner=request.user` (the instance admin) + adds the admin as a `WorkspaceMember(role=20)` — so the system admin sees all workspace data. New behavior: default owner = the staff whose job grade is **GD** (General Director, top of the uploaded job-position data); the create UI shows an owner picker (default GD, override allowed); the instance admin is **never** added as a workspace member.
2. **Instance admin RBAC.** Today instance admin is all-or-nothing and has no management UI. Add a god-mode **Administrators** menu (super-admin only) to add/edit/remove instance admins and grant each one a set of viewable god-mode menus. Enforced **both** in the sidebar (UI) and at every god-mode API endpoint (backend).

## Decisions (from user, locked)

- **GD source:** `StaffProfile.job_grade == "GD"` → that staff's `user`. **Data prerequisite corrected (red-team C3):** the GD's grade is set via the **staff** import/edit path — the job-positions template only seeds `JobGrade`/`JobPosition` lookups. Confirming real data stores `"GD"` is a **hard go-live gate** (repo seed stores `"Director"`, red-team C2).
- **Owner picker:** create-workspace UI shows owner selector, default GD; if no GD, admin picks anyone.
- **Admin membership:** instance admin **fully excluded** from created workspace (no `WorkspaceMember` row).
- **Permission depth:** **Backend + UI** enforcement.
- **Authority:** first/setup admin = **super-admin** (full access + manages admins). Added admins see only granted menus; can manage admins only if granted the `administrators` menu.

## Phases

| Phase | Name                                                                                                               | Status                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1     | [GD Resolution Foundation](./phase-01-gd-resolution-foundation.md)                                                 | ✅ Complete                              |
| 2     | [Workspace Owner Assignment (backend)](./phase-02-workspace-owner-assignment-backend.md)                           | ✅ Complete                              |
| 3     | [Workspace Create Owner Picker (admin UI)](./phase-03-workspace-create-owner-picker-admin-ui.md)                   | ✅ Complete                              |
| 4     | [Instance Admin Permission Infra (backend)](./phase-04-instance-admin-permission-infra-backend.md)                 | ✅ Complete                              |
| 5     | [Admin Management API (backend)](./phase-05-admin-management-api-backend.md)                                       | ✅ Complete                              |
| 6     | [Administrators Menu + Sidebar Filtering (admin UI)](./phase-06-administrators-menu-sidebar-filtering-admin-ui.md) | ✅ Complete                              |
| 7     | [Integration Tests + Docs](./phase-07-integration-tests-docs.md)                                                   | ✅ Complete (manual walkthrough pending) |

## Dependencies

- Phase 2 depends on Phase 1 (GD resolver). Phase 3 depends on Phase 2 (owner endpoints).
- Phase 5 depends on Phase 4 (model + menu registry + permission class). Phase 6 depends on Phase 5 (`/admins/me` shape, management API).
- Phase 7 depends on all. Feature 1 (P1–3) and Feature 2 (P4–6) are independent and may proceed in parallel.
- No cross-plan blockers (related god-mode plans are `complete`).

## Test strategy (TDD)

- Backend: `cd apps/api && python run_tests.py -u` (pytest, `@pytest.mark.unit`, `--reuse-db --nomigrations`). Write failing tests first per phase, then implement.
- Frontend: repo has no admin unit-test harness — verify via typecheck (`pnpm check:lint`) + manual god-mode walkthrough documented in Phase 7.

## Red Team Review

### Session 1 — 2026-06-03 (during --deep planning)

**Findings:** 3 Critical, all accepted: fail-open→fail-closed permission model; `InstanceAdminMeSerializer.Meta.model=User` mismatch (SerializerMethodField); backfill ALL existing admins as super. Config menus grouped into `settings`.

### Session 2 — 2026-06-03 (explicit `/ck:plan red-team`, 4 hostile reviewers, Full tier)

**Findings:** 18 after dedup (13 accepted, 5 YAGNI surfaced → user kept all scope)
**Severity breakdown:** 3 Critical, 6 High, 4 Medium accepted

| #       | Finding                                                                                                                                                                   | Severity | Disposition                                                                                     | Applied To    |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------- | ------------- |
| C1      | Fail-closed base-default swap defeated by 17–27 explicit `permission_classes` overrides; coverage test keyed wrong invariant                                              | Critical | Accept → **route-group/URL-prefix enforcement** (user choice) + override sweep                  | Phase 4, 7    |
| C2      | `job_grade=="GD"` empirically false in repo seed (`seed_department_staff_data.py:145` stores `"Director"`)                                                                | Critical | Accept → keep `"GD"` contract, prod-data confirmation = hard go-live gate (user choice)         | Phase 1, 7    |
| C3      | Job-positions import never sets `StaffProfile.job_grade` — runbook prerequisite was a no-op                                                                               | Critical | Accept → runbook corrected to staff import/edit path                                            | Phase 1, 7    |
| H4      | Cache invalidation path mismatch (`/api/instances/` vs `/api/instances/admins/`) — confirmed bug, list stale ≤2h                                                          | High     | Accept → pin both decorators to same path; DEBUG=False test                                     | Phase 5       |
| H5      | Lockout guard targeted phantom `InstanceUserEndpoint.delete`; real vectors: `patch is_active=False`, password reset, god-mode staff deactivate/bulk; `users.py`→`user.py` | High     | Accept → guards retargeted; app-layer `StaffDeactivateEndpoint` excluded (not a lockout vector) | Phase 5       |
| H6      | `authentication` unenforceable as separate key (shares `InstanceConfigurationEndpoint`)                                                                                   | High     | Accept → folded into `settings` (12 permission keys)                                            | Phase 4, 6, 7 |
| H7      | `/admins/me` already fetched by `user.store.ts` `currentUser:IUser`; plan named nonexistent store                                                                         | High     | Accept → extend `IUser`/`currentUser`; no duplicate fetch                                       | Phase 5, 6    |
| H8      | Project import re-adds admin on legacy admin-owned workspaces via auto-add-admins loop                                                                                    | High     | Accept → explicit acting-admin exclusion + legacy-workspace test                                | Phase 2, 7    |
| H9      | Backfill stamps `user=NULL` ghost rows super; last-super count satisfiable by ghosts                                                                                      | High     | Accept → `user__isnull=False, user__is_active=True` everywhere                                  | Phase 4, 5    |
| M10     | Resolver `.first()` pseudocode contradicts raise-on-ambiguity rule                                                                                                        | Medium   | Accept → count-based branch, dedup on `user_id`, keep raise                                     | Phase 1       |
| M11     | `SwingSSOTestEndpoint` outside `license/api/views`, escapes mapping + coverage test                                                                                       | Medium   | Accept → `swing-sso/`→`settings` prefix; coverage test scans by URL                             | Phase 4, 7    |
| M12     | `owner-options` candidates leak all staff emails to `workspace`-only admins                                                                                               | Medium   | Accept → candidate enumeration gated behind `staff`/`users` menu                                | Phase 2       |
| M13     | Multi-admin partly exists (POST/sign-in); only signup blocks 2nd admin                                                                                                    | Medium   | Accept → Phase 5 reframed as extend, not new CRUD                                               | Phase 5       |
| S14–S18 | YAGNI cuts: owner_email, route guard, ambiguity exception, escalation delegation, per-class mapping                                                                       | —        | Surfaced; user kept all scope (route-group adopted via C1 instead)                              | —             |

### Whole-Plan Consistency Sweep

- Files reread: plan.md, phase-01 … phase-07 (all edited this session; phase-03 reconciled for the M12 empty-candidates case)
- Decision deltas checked: 7 (route-group model; 12 permission keys; authentication→settings; guards retargeted; ghost-row filters; runbook corrected; store = user.store.ts)
- Reconciled stale references: `required_menu` per-view → `PREFIX_MENU_MAP`; `SHARED_VIEWS`→`SHARED_PREFIXES`; `users.py`→`user.py`; `InstanceUserEndpoint.delete`→`.patch`; 13-key list→12; runbook step; "instance/admin store"→`user.store.ts`
- Unresolved contradictions: 0

## Validation Log

### Session 1 — 2026-06-03 (`/ck:plan validate`)

Verification pass skipped per guard: `## Red Team Review` already holds Full-tier verification evidence; 0 `[UNVERIFIED]` tags remain. Interview covered the 4 genuinely open decisions:

| #   | Question                                | Decision                                                                                                                                                     | Propagated To                                             |
| --- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| V1  | Backfill legacy admin-owned workspaces? | **New creations only** — no backfill, no script. H8 acting-admin exclusion covers project-import into legacy workspaces.                                     | Phase 2 risk, Phase 7 (unresolved Q1 → resolved)          |
| V2  | Audit logging for grants/ownership?     | **Out of scope v1** (YAGNI).                                                                                                                                 | Phase 5 security note, Phase 7 (unresolved Q2 → resolved) |
| V3  | Admins-list cache fix (H4)              | **Pin paths (per plan)** — keep 2h cache, both decorators pinned to `/api/instances/admins/`, DEBUG=False staleness test. Remove-cache alternative declined. | Phase 5 (no change — confirmed)                           |
| V4  | Shipping strategy                       | **Two PRs**: PR1 = Phases 1–3 (owner=GD), PR2 = Phases 4–6 (RBAC); Phase 7 tests/docs split across both.                                                     | Phase 7 next steps                                        |

### Whole-Plan Consistency Sweep (Validation Session 1)

- V1/V2 resolved Phase 7 unresolved questions 1–2; remaining gates: GD prod-data confirmation (hard), `user=NULL` ghost-row check (`psql`, pre-migration — local dev DB was down during validation, not run).
- V3/V4 introduced no contradictions (V3 confirms existing plan text; V4 is a delivery note).
- Unresolved contradictions: 0 → **plan eligible for implementation**.
