---
phase: "01-template-catalog-foundation"
plan: "01-03"
subsystem: api
tags: [django, drf, backend, catalog, templates, hardening, immutability, permissions, tdd]
dependency_graph:
  requires:
    - phase: "01-01"
      provides: "ProjectTemplate model, seed migration, strict payload validator, read-only catalog list"
    - phase: "01-02"
      provides: "Admin-only create/partial_update/destroy/duplicate APIs and built-in mutation guard"
  provides:
    - "Strict CUST-04/CUST-05/CUST-06/CUST-07/CUST-08 payload invariants (duplicate names, missing names, duplicate sequence/order, missing starter issue title)"
    - "Inactive custom template exclusion contract test (CUST-09)"
    - "Built-in mutation attempt non-mutation contract test (CUST-09)"
    - "Cross-workspace DELETE 404 contract test (T-01-09)"
    - "Built-in duplicate does not mutate source contract test (CUST-09)"
  affects:
    - "apps/api/plane/app/serializers/project_template.py"
    - "apps/api/plane/tests/unit/serializers/test_project_template.py"
    - "apps/api/plane/tests/contract/app/test_project_templates_app.py"
tech-stack:
  added: []
  patterns:
    - "Validator-driven set membership for duplicate detection (state_keys, state_names, state_sequences, label_keys, label_names, label_orders)"
    - "Hardening tests driven by CUST-XX requirement IDs as test names and docstrings"
key-files:
  created: []
  modified:
    - "apps/api/plane/app/serializers/project_template.py"
    - "apps/api/plane/tests/unit/serializers/test_project_template.py"
    - "apps/api/plane/tests/contract/app/test_project_templates_app.py"
key-decisions:
  - "Validator rejects duplicate state names, missing state names, and duplicate state sequence values in addition to the existing duplicate-key, default-state, color, and group rules."
  - "Validator rejects duplicate label names, missing label names, and duplicate label order values in addition to the existing duplicate-key and color rules."
  - "Validator rejects missing module names, missing cycle names, and missing starter issue titles."
  - "All new rules live in validate_project_template_payload; no new helpers were added to keep the validation surface auditable in one place."
  - "Hardening tests are scoped to existing model fields (name, sequence, order, status, color, date metadata) and never reach into the project creation code path."
decisions:
  - "D-04 hardening: state/label name uniqueness and sequence/order uniqueness enforced by set-membership tracking in the validator"
  - "CUST-09 hardening: contract tests prove inactive custom rows disappear from list after DELETE, built-in PATCH/DELETE attempts do not mutate system rows, and built-in duplicate does not mutate source"
  - "T-01-09 mitigation: cross-workspace DELETE returns 404 and leaves the foreign row unchanged"
metrics:
  duration: "00:06:24"
  completed_date: "2026-06-30T03:37:12Z"
  tasks_completed: 3
  files_created: 0
  files_modified: 3
  test_count: 78
status: complete
---

# Phase 01 Plan 03: Template Catalog Hardening Summary

**Closed Phase 1 with strict payload invariants for duplicate names, sequence/order uniqueness, and missing-title rejection; built-in immutability, inactive filtering, and cross-workspace 404 contracts are now proven by targeted contract tests.**

## Performance

- **Duration:** 6 min 24 s
- **Started:** 2026-06-30T03:30:48Z
- **Completed:** 2026-06-30T03:37:12Z
- **Tasks:** 3
- **Files modified:** 3
- **Tests added:** 13 (9 unit hardening + 4 contract)

## Accomplishments

- `validate_project_template_payload` now rejects duplicate state names, missing state names, and duplicate `sequence` values per CUST-04.
- `validate_project_template_payload` now rejects duplicate label names, missing label names, and duplicate `order` values per CUST-05.
- `validate_project_template_payload` now rejects missing module names, missing cycle names, and missing starter issue titles per CUST-06 / CUST-07 / CUST-08.
- Added contract tests that prove an inactive custom template disappears from the catalog list after DELETE, that failed PATCH/DELETE attempts on a built-in leave `name`, `payload`, `is_active`, and `is_system` unchanged, and that a built-in duplicate does not mutate the source row's payload or name per CUST-09.
- Added a contract test that proves a cross-workspace DELETE attempt returns 404 and leaves the foreign custom row active per T-01-09.
- Phase 1 migration schema remains consistent: `makemigrations --check --dry-run` reports "No changes detected" and `migrate --plan` still lists `db.0122_projecttemplate`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Add hardening tests for payload invariants and catalog edge cases** - `c5cc99070` (test) — RED gate
2. **Task 2: Close serializer and view guard gaps found by hardening tests** - `9239a6b2b` (feat) — GREEN gate
3. **Task 3: Run Phase 1 backend verification and schema checks** - verification only (no code changes) — `makemigrations --check --dry-run` clean, `migrate --plan` lists the seed migration, and all 78 tests pass.

## Files Created/Modified

- `apps/api/plane/app/serializers/project_template.py` — extended `validate_project_template_payload` with `state_names`, `state_sequences`, `label_names`, and `label_orders` set tracking; added missing-name checks for state, label, module, cycle, and starter issue entries.
- `apps/api/plane/tests/unit/serializers/test_project_template.py` — added 9 hardening tests covering duplicate state names, missing state name, missing default, duplicate sequences, duplicate label keys/names/orders, missing label name, missing module name, missing cycle name, and missing starter issue title.
- `apps/api/plane/tests/contract/app/test_project_templates_app.py` — added 4 contract tests covering cross-workspace DELETE 404, inactive custom excluded from list after DELETE, built-in rows unaffected by failed write attempts, and built-in duplicate does not mutate source.

## Decisions Made

- **Validator-driven set tracking** for uniqueness was preferred over a helper function because the rule semantics differ per field (state_name uniqueness vs state_key uniqueness vs sequence uniqueness), and a single flat set per field keeps the intent obvious to future maintainers.
- **No new view guards** were added in Task 2 — the existing `_get_writable_template` helper from Plan 02 already covers cross-workspace and built-in lookups correctly, and the new contract tests confirmed those guards hold against direct UUID tampering.
- **Optional module/cycle date metadata** continues to be type-checked only (must be integer, not bool). Float values are rejected because `isinstance(1.5, int)` returns False, which the existing type guard already handles.

## Deviations from Plan

None — plan executed exactly as written. All hardening tests that initially failed were addressed by extending `validate_project_template_payload` rather than changing model or view code, so the project's create-time contract remains untouched.

## Auth Gates

None. All permission and immutability behavior was verified through local contract tests against the existing `allow_permission` helper and `BaseSessionAuthentication` stack.

## Known Stubs

- Optional module/cycle integer date metadata remains Phase 2 work; Plan 03 only validates type and order, not semantic interpretation.

## Threat Flags

No new threat surface beyond what the plan's threat register already covers. All hardening tests assert only against existing serializer error messages or HTTP status codes; no new HTTP routes, no new model fields, and no new dependencies were introduced. The four new contract tests map directly to T-01-09 (cross-workspace detail/write lookup) and CUST-09 (built-in immutability / inactive filtering).

## TDD Gate Compliance

- RED gate: `c5cc99070` (test-only commit) — confirmed by `pytest` showing 9 failing tests before GREEN implementation.
- GREEN gate: `9239a6b2b` (feat commit) — confirmed by `pytest` showing 78/78 tests passing after the validator extension.
- REFACTOR gate: not required (validator extension was minimal and the existing helper structure was preserved).

## Self-Check: PASSED

- 3 modified files contain the expected additions.
- 2 task commits present in git log: `c5cc99070`, `9239a6b2b`.
- 78/78 targeted tests pass under Docker compose (`pytest plane/tests/unit/serializers/test_project_template.py plane/tests/unit/models/test_project_template.py plane/tests/contract/app/test_project_templates_app.py`).
- `makemigrations --check --dry-run` reports "No changes detected" — schema is consistent with the model layer.
- `migrate --plan` lists `db.0122_projecttemplate` with the expected CreateModel and constraint operations.
