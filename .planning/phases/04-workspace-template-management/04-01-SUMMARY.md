---
phase: 04-workspace-template-management
plan: 01
subsystem: backend-api
tags: [project-templates, django-drf, contract-tests, admin-only]
requires:
  - "Phase 1 WorkspaceProjectTemplateViewSet (list/create/update/destroy/duplicate)"
  - "ProjectTemplateSerializer read shape"
provides:
  - "GET /project-templates/?include_inactive=true (D-14) — opt-in inactive custom rows"
  - "POST /project-templates/<pk>/reactivate/ (D-15) — admin-only is_active flip"
affects:
  - "Plan 04-05 frontend Show-deactivated toggle + reactivateProjectTemplate service method"
tech-stack:
  added: []
  patterns:
    - "Opt-in query param default-false to preserve existing consumer behavior"
    - "Dedicated reactivate action instead of loosening writable-lookup"
key-files:
  created: []
  modified:
    - apps/api/plane/app/views/workspace/project_template.py
    - apps/api/plane/app/urls/workspace.py
    - apps/api/plane/tests/contract/app/test_project_templates_app.py
decisions:
  - "include_inactive defaults false so Phase 3 create-modal selector (same endpoint) stays active-only (D-14)"
  - "Built-ins stay active-only regardless of include_inactive (D-14)"
  - "Dedicated reactivate action accepts inactive rows; _get_writable_template left unchanged so edit/deactivate keep active-only guarantee (D-15)"
metrics:
  duration: "~15min"
  completed: "2026-07-01"
  tasks: 2
  files: 3
status: complete
---

# Phase 4 Plan 01: Backend include_inactive + reactivate Summary

Added an opt-in `include_inactive` list parameter and an admin-only `reactivate` action to the workspace project-templates API, unblocking the frontend Show-deactivated toggle (D-06) and Reactivate button (D-07), with full contract-test coverage via a TDD RED/GREEN cycle.

## What Was Built

- `get_queryset` now reads `include_inactive` from query params (truthy for `"true"`/`"1"`/`"True"`). When false (default), the custom branch keeps its `is_active=True` filter so the Phase 3 create-modal selector is byte-for-byte unchanged. When true, deactivated CUSTOM (`is_system=False`) workspace rows are also returned. The built-in branch stays fixed at `is_system=True, is_active=True, workspace__isnull=True`, so inactive built-ins are never surfaced (D-14).
- A dedicated `reactivate(self, request, slug, pk)` action gated by `@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")`. It deliberately accepts an inactive candidate (the point of reactivation), rejects `is_system` rows with 400, returns 404 for `workspace_id is None` or foreign-slug rows, then sets `is_active=True` and returns the read-serialized body with 200 (D-15). `_get_writable_template` is untouched, preserving the active-only guarantee for edit/deactivate.
- URL route `workspaces/<str:slug>/project-templates/<uuid:pk>/reactivate/` (POST → `reactivate`), mirroring the duplicate route.
- Two new contract test classes covering listing (default omits, include_inactive surfaces custom, excludes inactive built-ins) and reactivation (200 flip + re-list, 400 built-in, 404 foreign/unknown, 403 member/guest).

## TDD Gate Compliance

- RED gate: `test(04-01)` commit `b2345619a` — six new tests added; 4 failed for the right reason (missing route → 404/405, `include_inactive` ignored), 27 pre-existing + 2 invariant-guard tests passed.
- GREEN gate: `feat(04-01)` commit `9075f3928` — full file green (35 passed).

Note on the two tests that passed at RED (`test_list_include_inactive_excludes_inactive_builtins`, `test_reactivate_foreign_or_unknown_returns_404`): these assert invariants that already held before implementation (active-only built-in filter already excluded inactive built-ins; the missing route returned 404, coincidentally matching the foreign/unknown expectation). They are retained as regression guards that the GREEN change must not break — and both still pass after implementation.

## Verification

- `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_project_templates_app.py -q` → 35 passed.
- `docker compose -f docker-compose-test.yml run --rm api-tests python manage.py makemigrations --check --dry-run` → No changes detected (no schema drift; no model changes).

## Threat Model Coverage

- T-04-01 (EoP on reactivate): mitigated via `@allow_permission(ADMIN, WORKSPACE)`; `test_reactivate_forbidden_for_member_and_guest` asserts 403.
- T-04-02 (info disclosure on include_inactive): custom branch scoped to `workspace__slug + is_system=False`; inactive built-ins excluded; `test_list_include_inactive_excludes_inactive_builtins` asserts no built-in leakage.
- T-04-03 (tampering on built-in/foreign reactivate): 400 on `is_system`, 404 on foreign/unknown before the `is_active` flip; `_get_writable_template` left intact.

## Deviations from Plan

None - plan executed exactly as written. No CLAUDE.md present in the repo (referenced path absent); existing test-file and viewset conventions were followed.

## Self-Check: PASSED

- Modified files present: project_template.py, urls/workspace.py, test_project_templates_app.py — all FOUND.
- Commits present: b2345619a (RED), 9075f3928 (GREEN) — both FOUND in git log.
