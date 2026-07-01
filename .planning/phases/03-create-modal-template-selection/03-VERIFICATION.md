---
phase: 03-create-modal-template-selection
verified: 2026-07-01T13:18:00Z
status: passed
score: 12/12 must-haves verified
behavior_unverified: 0
overrides_applied: 0
overrides: []
requirement_coverage:
  CAT-01:
    status: covered
    evidence: "Create Project modal exposes a compact Project Template selector in the header area and fetches workspace templates through ProjectService."
  CAT-06:
    status: covered
    evidence: "Selector renders template name plus optional description; backend payloads now carry richer generated content for useful post-create structure."
  PERM-02:
    status: covered
    evidence: "Members who can create projects can list/select available templates without gaining custom-template admin permissions."
  UI-01:
    status: covered
    evidence: "Existing ProjectTemplateSelect UI is implemented in the create Project header area."
  UI-02:
    status: covered
    evidence: "Selected template is held in modal-local state and submit payload conditionally includes template_id."
  UI-03:
    status: covered
    evidence: "Selected template name replaces the default Template label before submit."
  UI-04:
    status: covered
    evidence: "Loading, empty, and error states are inline and keep No template available."
  VER-05:
    status: covered
    evidence: "Frontend type checks passed; shared project-template types include rich payload sections used by backend and frontend contracts."
human_verification:
  - source: "03-UAT.md"
    status: passed
    evidence: "8/8 UAT checks passed after resolving the template-content depth gap in Test 5."
gaps: []
deferred: []
behavior_unverified_items: []
---

# Phase 03: Create Modal Template Selection - Verification Report

**Phase Goal:** Let users select and preview Project Templates in the existing create Project modal, then submit `template_id` with the create request.
**Verified:** 2026-07-01
**Status:** passed
**Re-verification:** Yes - UAT uncovered a content-depth gap in template application; this report includes the backend fix and retest evidence.

## User Flow Coverage

| #   | User-flow step                     | Expected                                                                                | Evidence                                                                                                                               | Status |
| --- | ---------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | Open Create Project modal          | Compact template selector appears in the cover/header area and defaults to no template  | `03-UAT.md` Test 1; `apps/web/ce/components/projects/create/template-select.tsx`; `apps/web/core/components/project/create/header.tsx` | PASS   |
| 2   | Open selector and search           | Dropdown search filters rows showing only name and optional description                 | `03-UAT.md` Test 2; Phase 03 Plan 02/03 source assertions                                                                              | PASS   |
| 3   | Select a template                  | Dropdown closes and button shows selected template name with no warning/toast           | `03-UAT.md` Test 3; `selectedTemplate` local state in create form path                                                                 | PASS   |
| 4   | Clear selection                    | "No template" clears selection and preserves normal create flow                         | `03-UAT.md` Test 4 and Test 6                                                                                                          | PASS   |
| 5   | Submit with a template             | Project create request includes `template_id`; backend applies rich generated structure | `03-UAT.md` Test 5; service/unit/contract tests listed below                                                                           | PASS   |
| 6   | Reopen modal                       | Prior selection does not carry over                                                     | `03-UAT.md` Test 7; per-open form session key                                                                                          | PASS   |
| 7   | Loading/empty/error catalog states | No-template creation remains available and retry is inline                              | `03-UAT.md` Test 8; Phase 03 Plan 03 assertions                                                                                        | PASS   |

## Must-Have Truths

| #   | Truth                                                                                                   | Status   | Evidence                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Frontend project-template contracts include fields needed by the selector                               | VERIFIED | `packages/types/src/project/project_templates.ts`; Phase 03 Plan 01 type checks                                                                 |
| 2   | Project create payload supports optional `template_id` without forcing no-template requests to send one | VERIFIED | `packages/types/src/project/projects.ts`; `apps/web/ce/components/projects/create/root.tsx`; Phase 03 Plan 02 assertions                        |
| 3   | Template catalog access goes through ProjectService and SWR fetch keys                                  | VERIFIED | `apps/web/core/services/project/project.service.ts`; `packages/constants/src/fetch-keys.ts`; Phase 03 Plan 01/02 assertions                     |
| 4   | Selector is modal-local state, not MobX global state                                                    | VERIFIED | Phase 03 Plan 01/02 checks for no selected-template observable/action                                                                           |
| 5   | Selector supports search, selection, clear, and selected-name display                                   | VERIFIED | `03-UAT.md` Tests 2-4                                                                                                                           |
| 6   | Submitting with a template includes selected `template_id`                                              | VERIFIED | `03-UAT.md` Test 5; Phase 03 Plan 02 payload assertions                                                                                         |
| 7   | Submitting without a template preserves existing behavior                                               | VERIFIED | `03-UAT.md` Test 6                                                                                                                              |
| 8   | Modal reopen resets template selection                                                                  | VERIFIED | `03-UAT.md` Test 7                                                                                                                              |
| 9   | Loading/empty/error catalog states do not block no-template project creation                            | VERIFIED | `03-UAT.md` Test 8                                                                                                                              |
| 10  | Built-in project templates seed enough generated content for practical use                              | VERIFIED | Serializer/apply-service tests confirm richer states, labels, modules, cycles, starter issues, intakes, views, pages, and project feature flags |
| 11  | Migration 0122 can seed built-in templates from the current payload shape                               | VERIFIED | Fresh `manage.py migrate` passed; migration regression test covers the `KeyError: 'name'` failure path                                          |
| 12  | Shared template payload types model backend rich sections                                               | VERIFIED | `pnpm --filter=@plane/types check:types` passed after adding intakes/views/pages/starter issue metadata                                         |

**Score:** 12/12 truths verified (100%)

## Regression Fixed During Verification

UAT Test 5 initially passed the basic creation flow but exposed a major product gap: projects created from templates did not have enough useful generated data for intake, views, pages, cycles, and work items.

Fixes applied:

- `apps/api/plane/db/migrations/0122_projecttemplate.py` now reads the current built-in template entry shape and no longer raises `KeyError: 'name'`.
- `apps/api/plane/app/serializers/project_template.py` validates and ships richer payload sections: `intakes`, `views`, `pages`, richer starter issue metadata, and expanded built-in content.
- `apps/api/plane/app/services/project_template_apply.py` creates `Intake`, `IssueView`, `Page`, `ProjectPage`, `PageLabel`, richer starter issues, and enables project feature flags for generated sections.
- `packages/types/src/project/project_templates.ts` models the richer payload contract.

## Verification Commands

| Command                                                                                                                                                                                                                                               | Result                                                    | Status |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/unit/migrations/test_projecttemplate_migration.py -q`                                                                                                                | 1 passed                                                  | PASS   |
| `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/unit/serializers/test_project_template.py plane/tests/unit/services/test_project_template_apply.py plane/tests/unit/migrations/test_projecttemplate_migration.py -q` | 69 passed                                                 | PASS   |
| `docker compose -f docker-compose-test.yml run --rm api-tests pytest plane/tests/contract/app/test_project_template_creation_app.py -q`                                                                                                               | 13 passed                                                 | PASS   |
| `docker compose -f docker-compose-test.yml down -v && docker compose -f docker-compose-test.yml run --rm api-tests python manage.py migrate`                                                                                                          | fresh migrations passed through `db.0122_projecttemplate` | PASS   |
| `pnpm --filter=@plane/types check:types`                                                                                                                                                                                                              | `tsc --noEmit` passed                                     | PASS   |
| `git diff --check -- <touched files>`                                                                                                                                                                                                                 | no whitespace errors                                      | PASS   |
| `node $HOME/.codex/gsd-core/bin/gsd-tools.cjs query audit-open`                                                                                                                                                                                       | all artifact types clear                                  | PASS   |

## Requirements Coverage

| Requirement | Status  | Evidence                                                                                                   |
| ----------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| CAT-01      | COVERED | Template selector appears in existing create Project modal and lists available templates                   |
| CAT-06      | COVERED | Selector summary is visible; backend-created template projects now contain richer useful generated content |
| PERM-02     | COVERED | Project creators can list/select available templates through the creation flow                             |
| UI-01       | COVERED | Existing ProjectTemplateSelect UI implemented in the create Project header                                 |
| UI-02       | COVERED | Selection updates form state and sends `template_id`                                                       |
| UI-03       | COVERED | Selected template is clear before submit                                                                   |
| UI-04       | COVERED | Loading/empty/error states are non-blocking                                                                |
| VER-05      | COVERED | Frontend type checks and shared payload types passed                                                       |

## Gaps Summary

No open gaps. The only UAT issue found in Test 5 was resolved and verified with migration, unit, contract, type, and fresh-migration checks.

---

_Verified: 2026-07-01T13:18:00Z_
_Verifier: Codex_
