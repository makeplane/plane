# God-Mode Workspace Owner & Instance-Admin RBAC Implementation

**Date**: 2026-06-03  
**Severity**: High  
**Component**: Authentication, Admin Portal, Workspace Management  
**Status**: Resolved (Feature Shipped)

## What Happened

Completed 7-phase end-to-end implementation (plan: plans/260603-1102-god-mode-workspace-owner-and-admin-permissions/) and shipped to develop via PR #105 (9 commits, 30ad920..bf2ec73). Feature gates god-mode workspace creation behind General Director staff role, overhauls instance-admin menu permissions to fail-closed route-group enforcement, and adds escalation guards preventing self-privilege-escalation.

## The Brutal Truth

The biggest relief: routing enforcement placed at the middleware level (not per-view annotations) survives all the messy DRF permission_classes overrides that would've shadowed role checks on individual endpoints. Shipping a single PR that validated both features together (plan said two PRs; user approved the composition) meant 9 commits stayed lean and reviewable, but tight coupling between god-mode resolver and staff-grade-code dependency creates hard go-live gate: if prod staff data doesn't store grade code "GD" on exactly one active staff, feature silently fails to resolve. Runbook written, but it's the kind of detail that gets missed at 3am on deployment night.

## Technical Details

**Feature 1 — God-Mode Owner (General Director)**

- `plane/utils/general_director.py`: resolves StaffProfile.job_grade=="GD" (explicit code match, NOT name parsing)
- Raises `AmbiguousGeneralDirector` if multiple or zero active GDs exist — fail-fast instead of silent pick
- All workspace creation paths (single, bulk, project import) explicitly assign owner or lookup owner_id/owner_email
- **Critical invariant**: acting instance admin NEVER auto-added as WorkspaceMember/ProjectMember (explicit loop exclusion in legacy admin-owned workspace backfill)
- `/api/instances/workspaces/owner-options/` + searchable Propel Combobox picker on admin create form

**Feature 2 — Instance-Admin Menu RBAC (Fail-Closed Route Group)**

- `InstanceAdmin.is_super_admin + allowed_menus` (migration license/0007, backfills only user\_\_isnull=False rows; ghost rows excluded)
- `plane/license/menu_registry.py`: 12 PERMISSION_KEYS, authentication folded into "settings" group (5 config screens, one endpoint)
- PREFIX_MENU_MAP (longest-prefix match) + SHARED_PREFIXES (/identity paths) + EXACT_MENU_MAP ({"": "settings"} for root — prevents catch-all bypass)
- `InstanceAdminMenuPermission` resolves required menu from request.path, ~21 files swept for explicit overrides (per-view annotation model rejected at planning)
- **Escalation guards**: only supers mint supers, delegates grant subsets only, no self-edit
- **Lockout guards**: is_last_active_super_admin check (ghosts/inactive never count) on demote/delete/deactivate/password-reset
- **Prod bug fixed**: admins-list cache_response/invalidate_cache keyed to different paths (2h staleness) — both pinned to /api/instances/admins/
- Admin UI: Administrators page, permission-filtered sidebar (now derived from registry — fixed silently dropped job-positions item), layout-level route guard

## What We Tried

- Per-view permission_classes annotations (rejected early in plan — DRF override shadowing too brittle)
- Parsing staff job_title name (abandoned for explicit grade code match; grade codes live in HR system, names are human-editable aliases)
- Auto-add instance admin as workspace owner (rejected — violates god-mode isolation, escalation attack surface)
- Two separate PRs (user composition approval chose one PR after E2E validation)

## Root Cause Analysis

**Pre-existing test debt**: develop branch has 20 unit + 16 contract test failures not related to this feature; baselining against clean worktree before/after each phase allowed feature suite (105 new tests) to land green without masking pre-existing breaks.

**Staff grade code brittleness**: plan text emphasized grade code ("GD") for resolver, but didn't call out that repo seed data stores human-readable "Director" names — would resolve to zero, silencing the resolver on any dev env without prod staff dump. Runbook drafted (docs/shbvn-deployment/03-operations/runbooks/god-mode-gd-owner-and-admin-rbac-rollout.md) but requires ops discipline.

**Plan deviation caught in code review**: staff bulk status/delete never touches User.is_active, so no lockout guard there despite plan text. Validated against real threat model (staff deactivate is separate admin action that already has guard).

## Lessons Learned

1. **Fail-closed > annotation-based** — route-group enforcement at middleware survives DRF's messy permission_classes shadow; worth the verbosity in menu_registry.py
2. **Build-enforced invariants** — test_menu_registry_parity.py (every instance route mapped-or-shared, no bare InstanceAdminPermission) + frontend core.ts parsing vs backend PERMISSION_KEYS parity check fails CI if drift occurs; caught 2 near-misses in review
3. **Environment fragility** — prod staff dump required for local testing (repo seed insufficient); Docker compose needs planeso-plane-db:5434 + plane-redis:6379; missing mistune installed via uv
4. **Tight coupling to HR schema** — grade code resolver creates deployment dependency; single-source-of-truth for staff.job_grade needs versioning strategy or feature flag if HR refactors grades

## Next Steps

1. **Immediate** — ops runs god-mode-gd-owner-and-admin-rbac-rollout.md runbook on UAT/prod (validate exactly one active GD exists with grade "GD")
2. **Follow-up** — prod staff data extraction pipeline to seed grade codes in dev (eliminates resolver brittleness in future features)
3. **Technical debt** — address pre-existing 36 test failures on develop (not this feature, but blocks clean baseline for future work)

**Status:** DONE — God-mode owner resolver + fail-closed instance-admin RBAC shipped end-to-end with escalation guards and hard go-live gate documented.
