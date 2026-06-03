---
title: "Project Field Permissions"
description: "Project-scope admin toggles to allow non-admins to modify sensitive work item fields (completed_at, target_date, start_date) and to delete work items. Editable by Workspace Admin OR Project Admin from Project Settings."
status: completed
priority: P2
effort: 10h
branch: ngoc-feat/categories
tags: [backend, frontend, project-settings, permissions, work-items]
created: 2026-05-11
updated: 2026-05-11
---

# Project Field Permissions

## Summary

New Project Settings page "Field Permissions". Workspace Admins OR Project Admins toggle whether non-admin (MEMBER, GUEST) users can modify sensitive fields or delete work items. Single config row per project. Default = locked (admin-only).

## Scope (confirmed)

Fields included in v1:

- `completed_at` (Completed date) — locked default
- `target_date` (Due date) — locked default
- `start_date` — locked default
- `delete_work_item` (delete permission) — locked default
- `priority`, `estimate_point`, `state_id`, `assignees` — out of scope for v1 (deferred; same model can grow).

## Architecture decisions

- **Scope:** PROJECT (one row per project). Allows different rules per project; aligns with how Workflows / Required Fields are already per-project in this codebase.
- **Model:** new `ProjectFieldPermission` extending `ProjectBaseModel` (gives workspace + project FK, soft-delete, timestamps). OneToOne with `Project`.
- **Auto-create:** lazy-create on first GET via `get_or_create`; defaults = all `False`.
- **Editor roles:** PATCH allowed for `ROLE.ADMIN` at PROJECT level (Project Admin) AND `ROLE.ADMIN` at WORKSPACE level (Workspace Admin). Use existing `@allow_permission([ROLE.ADMIN], level="PROJECT")` — Workspace Admins are auto-treated as Project Admins by Plane's permission resolver (verify; otherwise dual-check).
- **Enforcement layer:** backend serializer/view (authoritative) + frontend gate (UX). Field-level guard inside `IssueViewSet.partial_update` / `destroy` via helper in `plane/utils/`. Helper called from BOTH `plane/app/views/issue/base.py` AND `plane/api/views/issue.py`.
- **Frontend store:** new CE store `projectFieldPermission` keyed by `${workspaceSlug}_${projectId}`.

## Phases

| #   | Phase                                                  | Effort | Status                                                                                     | Owner files                              |
| --- | ------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1   | Backend model + migration                              | 1h     | ✅ done                                                                                    | [phase-01](./phase-01-backend-model.md)  |
| 2   | Backend API + enforcement hooks                        | 2.5h   | ✅ done                                                                                    | [phase-02](./phase-02-backend-api.md)    |
| 3   | Frontend types / service / store / hook                | 1.5h   | ✅ done                                                                                    | [phase-03](./phase-03-frontend-store.md) |
| 4   | Project Settings page UI (sidebar entry + toggle list) | 2h     | ✅ done                                                                                    | [phase-04](./phase-04-settings-ui.md)    |
| 5   | Work item form enforcement (gating)                    | 2h     | ⚠️ partial — start_date + delete frontend gating blocked by CE boundary (backend enforces) | [phase-05](./phase-05-form-gating.md)    |
| 6   | i18n keys + tests                                      | 1h     | ✅ done                                                                                    | [phase-06](./phase-06-i18n-tests.md)     |

## Critical Dependencies

- Phase 1 → 2 (model required for API)
- Phase 2 → 3 (API contract drives types)
- Phase 3 → 4, 5 (store powers both UI surfaces)
- Phase 6 runs alongside 4–5

## Risks (high-level — phase files have details)

- **R1:** Permission bypass via external API (`plane/api/`). Mitigation: enforcement helper lives in `utils/` and is called from both `plane/app/views/issue/base.py` AND `plane/api/views/issue.py`.
- **R2:** Members lose access to existing items they could previously edit. Mitigation: locked default = `False`; communicate via release notes.
- **R3:** Field list expansion drift. Mitigation: enum of allowed field keys defined once in `packages/types` and mirrored in backend constants.
- **R4:** Per-project config × many projects = chatty fetching. Mitigation: store fetches lazily on project route mount; cached in `ObservableMap` keyed by project.

## Reference plans (do not duplicate)

- `plans/260306-1431-completed-date/plan.md` — completed_at model field
- `plans/260311-0949-editable-completed-date/plan.md` — editable completed_at UI
- `plans/260303-1959-work-item-required-fields/plan.md` — workspace-level work item config pattern
- `plans/260304-1495-workflows/plan.md` — same admin-gating UX pattern, project-scope reference

## Unresolved Questions

_All resolved in Validation Session 1 — see below._

## Validation Log

### Session 1 — 2026-05-11

| #   | Question                         | Decision                                                                                                                                                                                  |
| --- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Workspace Admin gating on PATCH  | **Explicit dual-level check** in view: allow if ROLE.ADMIN at PROJECT OR ROLE.ADMIN at WORKSPACE. Do not rely on resolver.                                                                |
| 2   | Activity log on toggle           | **Yes** — emit project activity entry per toggle change.                                                                                                                                  |
| 3   | v1 field set                     | **Keep as planned** — completed_at, target_date, start_date, delete_work_item.                                                                                                            |
| 4   | Settings label                   | **"Field Permissions"**.                                                                                                                                                                  |
| 5   | start_date gating in CE          | **CE wrapper override**. No core/ edits.                                                                                                                                                  |
| 6   | Locked UX in work item           | **Read-only text + tooltip** ("Locked by project admin").                                                                                                                                 |
| 7   | **Lock semantics (date fields)** | **Empty→Value allowed; Value→Value (and Value→Empty) blocked.** Members may fill an empty date but cannot modify/clear an existing one. Applies to completed_at, target_date, start_date. |
| 8   | start_date scope                 | Same rule as other date fields; **default locked**; included in v1.                                                                                                                       |
| 9   | Delete semantics                 | **Default locked, admin-only** until admin toggles ON. No creator/assignee exception.                                                                                                     |

**Material impact:** Decision #7 changes Phase 02 enforcement — helper must diff `old vs new` per date field, not just check key presence in payload. Phase 06 tests must cover both empty→value (allow) and value→value (block) cases.

<!-- Updated: Validation Session 1 -->
