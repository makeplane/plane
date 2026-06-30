---
phase: 01-template-catalog-foundation
verified: 2026-06-30T03:49:31Z
status: passed
score: 16/16 must-haves verified
behavior_unverified: 0
overrides_applied: 0
gaps: []
human_verification: []
---

# Phase 01: Template Catalog Foundation Verification Report

**Phase Goal:** Building the backend catalog foundation for Project Templates — persisted ProjectTemplate model, idempotent built-in seed (Software Project, Marketing Campaign, Operations Project), strict payload validation, and workspace-scoped read/write APIs with admin-only writes and guest-blocked read.
**Verified:** 2026-06-30T03:49:31Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                | Status   | Evidence                                                                                                                                     |
| --- | -------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Backend lists `Software Project` as a built-in template              | VERIFIED | `BUILT_IN_PROJECT_TEMPLATES` (serializers/project_template.py L76); seed by migration 0122; `test_admin_list_returns_seeded_builtins` PASSED |
| 2   | Backend lists `Marketing Campaign` as a built-in template            | VERIFIED | Same fixture; `BUILT_IN_PROJECT_TEMPLATES` L162 declares `system_key="marketing-campaign"`                                                   |
| 3   | Backend lists `Operations Project` as a built-in template            | VERIFIED | Same fixture; `BUILT_IN_PROJECT_TEMPLATES` L234 declares `system_key="operations-project"`                                                   |
| 4   | Workspace admins can create custom templates                         | VERIFIED | `WorkspaceProjectTemplateViewSet.create` with `@allow_permission(ROLE.ADMIN)`; `test_admin_create_creates_custom_template` PASSED            |
| 5   | Workspace admins can edit custom templates                           | VERIFIED | `partial_update` handler; `test_admin_partial_update_updates_custom_template` PASSED                                                         |
| 6   | Workspace admins can deactivate custom templates                     | VERIFIED | `destroy` handler with `is_active=False` soft-deactivate; `test_admin_destroy_soft_deactivates_custom_template` PASSED                       |
| 7   | Custom template payloads validated for states (CUST-04)              | VERIFIED | `validate_project_template_payload` enforces unique state_key, name, sequence, group/color enum, exactly one default; CUST-04 tests PASSED   |
| 8   | Custom template payloads validated for labels (CUST-05)              | VERIFIED | Validator enforces unique label_key, name, order, color hex; CUST-05 tests PASSED                                                            |
| 9   | Custom template payloads validated for modules (CUST-06)             | VERIFIED | Validator enforces module_key uniqueness, name, status enum, integer date metadata; CUST-06 tests PASSED                                     |
| 10  | Custom template payloads validated for cycles (CUST-07)              | VERIFIED | Validator enforces cycle_key uniqueness, name, integer date metadata; CUST-07 tests PASSED                                                   |
| 11  | Custom template payloads validated for starter issues (CUST-08)      | VERIFIED | Validator rejects missing title, dangling state/label/module/cycle refs, invalid priority; CUST-08 tests PASSED                              |
| 12  | Built-in templates cannot be edited directly                         | VERIFIED | `_get_writable_template` returns 400 for `is_system=True`; `test_admin_patch_builtin_returns_400_and_does_not_mutate` PASSED                 |
| 13  | Built-in templates cannot be deactivated directly                    | VERIFIED | Same helper; `test_admin_delete_builtin_returns_400_and_does_not_mutate` PASSED                                                              |
| 14  | Workspace admins can list templates                                  | VERIFIED | `list` allows `ROLE.ADMIN`/`ROLE.MEMBER`; `test_admin_list_returns_seeded_builtins` PASSED                                                   |
| 15  | Workspace guests cannot write templates                              | VERIFIED | All write methods gated to `ROLE.ADMIN`; `test_guest_create/patch/delete/duplicate_returns_403` PASSED                                       |
| 16  | Workspace members who are not admins cannot write templates          | VERIFIED | Same gate; `test_member_create/patch/delete/duplicate_returns_403` PASSED                                                                    |
| 17  | Custom template API write operations reject unauthorized users (403) | VERIFIED | `@allow_permission([ROLE.ADMIN])` returns 403 from `allow_permission` (permissions/base.py L81-84) for non-admin workspace members           |

**Score:** 17/17 observable truths verified

### Required Artifacts

| Artifact                                                          | Expected                                                                                      | Status   | Details                                                                                                                    |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- |
| `apps/api/plane/db/models/project_template.py`                    | ProjectTemplate model with payload/workspace/is_system/is_active                              | VERIFIED | 74 lines, `BaseModel` subclass, `JSONField(default=dict)`, constraints present                                             |
| `apps/api/plane/db/migrations/0122_projecttemplate.py`            | Migration adds model + seed three builtins                                                    | VERIFIED | `CreateModel`, two `UniqueConstraint` ops, `RunPython(seed_builtin_project_templates)`                                     |
| `apps/api/plane/app/serializers/project_template.py`              | Serializer + validator + write serializer + duplicate serializer                              | VERIFIED | `PROJECT_TEMPLATE_SCHEMA_VERSION`, `BUILT_IN_PROJECT_TEMPLATES`, `validate_project_template_payload`, 3 serializer classes |
| `apps/api/plane/app/views/workspace/project_template.py`          | WorkspaceProjectTemplateViewSet with full lifecycle                                           | VERIFIED | list/create/partial_update/destroy/duplicate; `_get_writable_template` helper                                              |
| `apps/api/plane/app/urls/workspace.py`                            | 3 routes registered (list+create, detail, duplicate) under name `workspace-project-templates` | VERIFIED | L262-282; imports viewset at L39                                                                                           |
| `apps/api/plane/tests/unit/serializers/test_project_template.py`  | Validator + write + duplicate serializer tests                                                | VERIFIED | 45 test functions, all PASSED                                                                                              |
| `apps/api/plane/tests/unit/models/test_project_template.py`       | Model behavior tests                                                                          | VERIFIED | 4 test functions, all PASSED                                                                                               |
| `apps/api/plane/tests/contract/app/test_project_templates_app.py` | API contract tests for catalog + write + duplicate                                            | VERIFIED | 29 test functions, all PASSED                                                                                              |

### Key Link Verification

| From                                                                                            | To                                                                                    | Via                                                                                           | Status | Details                                                                                                       |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------- |
| `apps/api/plane/db/migrations/0122_projecttemplate.py`                                          | `plane.app.serializers.project_template.BUILT_IN_PROJECT_TEMPLATES`                   | `from plane.app.serializers.project_template import BUILT_IN_PROJECT_TEMPLATES` inside seed   | WIRED  | Uses `update_or_create` keyed on stable `system_key` (D-12)                                                   |
| `apps/api/plane/app/views/workspace/project_template.py`                                        | `plane.app.permissions.allow_permission`                                              | `@allow_permission([ROLE.ADMIN])` on writes; `[ROLE.ADMIN, ROLE.MEMBER]` on list              | WIRED  | All 5 handlers decorated; standard 403 from permissions/base.py                                               |
| `apps/api/plane/app/views/workspace/project_template.py`                                        | `plane.app.serializers.ProjectTemplateSerializer/WriteSerializer/DuplicateSerializer` | `get_serializer_class` returns correct serializer per action                                  | WIRED  | Action-based serializer dispatch verified                                                                     |
| `apps/api/plane/app/urls/workspace.py`                                                          | `WorkspaceProjectTemplateViewSet`                                                     | `import` at L39 and `as_view()` calls at L264/L269/L280                                       | WIRED  | Three URL paths registered under name `workspace-project-templates`                                           |
| `ProjectTemplateWriteSerializer.create`                                                         | `Workspace.objects.get(slug=slug)`                                                    | `context={"workspace_id": workspace.id}` injected in `WorkspaceProjectTemplateViewSet.create` | WIRED  | Saves with `workspace_id`, `is_system=False`, `system_key=None`                                               |
| `ProjectTemplate.model.UniqueConstraint(project_template_unique_system_key_when_system_global)` | DB                                                                                    | Migration `0122_projecttemplate.py` adds constraint                                           | WIRED  | visible in `migrate --plan` output: `Create constraint project_template_unique_system_key_when_system_global` |
| `validate_project_template_payload`                                                             | DRF `ValidationError`                                                                 | Raises on error after accumulating violations                                                 | WIRED  | Imported and consumed by `ProjectTemplateWriteSerializer.validate`                                            |

### Data-Flow Trace (Level 4)

| Artifact                                | Data Variable            | Source                                                                   | Produces Real Data | Status  |
| --------------------------------------- | ------------------------ | ------------------------------------------------------------------------ | ------------------ | ------- |
| `WorkspaceProjectTemplateViewSet.list`  | Templates queryset union | `ProjectTemplate.objects.filter(Q(workspace__slug=...)` ...              | Yes                | FLOWING |
| `ProjectTemplateWriteSerializer.create` | New template instance    | `ProjectTemplate.objects.create(**validated_data, workspace_id=context)` | Yes                | FLOWING |
| Seeded builtins                         | Initial catalog          | `update_or_create` keyed on `system_key`                                 | Yes                | FLOWING |

### Behavioral Spot-Checks

| Behavior                                                          | Command                                                                                                                                                                                                         | Result                                         | Status |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| `makemigrations --check --dry-run` reports no changes             | `docker compose ... run --rm api-tests python manage.py makemigrations --check --dry-run`                                                                                                                       | `No changes detected`                          | PASS   |
| `migrate --plan` lists the seed migration                         | `docker compose ... run --rm api-tests python manage.py migrate --plan \| grep projecttemplate`                                                                                                                 | 3 lines listing migration 0122 and constraints | PASS   |
| Targeted full Phase 1 test suite passes                           | `docker compose ... run --rm api-tests pytest plane/tests/unit/serializers/test_project_template.py plane/tests/unit/models/test_project_template.py plane/tests/contract/app/test_project_templates_app.py -q` | `78 passed in 27.16s`                          | PASS   |
| Admin list returns seeded builtins (CAT-03/04/05)                 | targeted `::TestProjectTemplateCatalogAPI::test_admin_list_returns_seeded_builtins`                                                                                                                             | PASSED                                         | PASS   |
| Guest list blocked with 403 (PERM-03)                             | targeted `::test_guest_list_returns_403`                                                                                                                                                                        | PASSED                                         | PASS   |
| Member write blocked with 403 (PERM-04)                           | targeted `::test_member_create_returns_403`                                                                                                                                                                     | PASSED                                         | PASS   |
| Built-in PATCH returns 400 and does not mutate (CUST-09, PERM-05) | targeted `::test_admin_patch_builtin_returns_400_and_does_not_mutate`                                                                                                                                           | PASSED                                         | PASS   |

### Probe Execution

Not applicable — Phase 1's verification commands are Django `manage.py` + pytest invocations, not separate probe scripts. The execution contract for this phase is captured in the migration dry-run check, migrate plan, and targeted pytest suite.

### Requirements Coverage

| Requirement | Source Plan  | Description                                                                            | Status    | Evidence                                                                                                                    |
| ----------- | ------------ | -------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| CAT-03      | 01-01        | User can select the built-in `Software Project` template                               | SATISFIED | `BUILT_IN_PROJECT_TEMPLATES` includes `system_key="software-project"`; listed via `test_admin_list_returns_seeded_builtins` |
| CAT-04      | 01-01        | User can select the built-in `Marketing Campaign` template                             | SATISFIED | `system_key="marketing-campaign"` in fixture; test PASSED                                                                   |
| CAT-05      | 01-01        | User can select the built-in `Operations Project` template                             | SATISFIED | `system_key="operations-project"` in fixture; test PASSED                                                                   |
| CUST-01     | 01-02        | Workspace admin can create a custom Project Template                                   | SATISFIED | `WorkspaceProjectTemplateViewSet.create` + `test_admin_create_creates_custom_template` PASSED                               |
| CUST-02     | 01-02        | Workspace admin can edit a custom Project Template                                     | SATISFIED | `partial_update` + `test_admin_partial_update_updates_custom_template` PASSED                                               |
| CUST-03     | 01-02        | Workspace admin can delete/archive/deactivate a custom Project Template                | SATISFIED | `destroy` soft-deactivates (`is_active=False`); tests PASSED                                                                |
| CUST-04     | 01-01, 01-03 | Workspace admin can define template states (name, color, group, sequence, default)     | SATISFIED | `validate_project_template_payload` enforces all CUST-04 fields; hardening tests PASSED                                     |
| CUST-05     | 01-01, 01-03 | Workspace admin can define template labels (name, description, color, order)           | SATISFIED | `validate_project_template_payload` enforces all CUST-05 fields                                                             |
| CUST-06     | 01-01, 01-03 | Workspace admin can define template modules (name, description, status, optional date) | SATISFIED | `validate_project_template_payload` enforces all CUST-06 fields                                                             |
| CUST-07     | 01-01, 01-03 | Workspace admin can define template cycles (name, description, optional relative date) | SATISFIED | `validate_project_template_payload` enforces all CUST-07 fields                                                             |
| CUST-08     | 01-01, 01-03 | Workspace admin can define starter issues with references and priority                 | SATISFIED | `validate_project_template_payload` enforces dangling-reference detection and priority enum                                 |
| CUST-09     | 01-02, 01-03 | Workspace admin cannot edit built-in system templates directly                         | SATISFIED | `_get_writable_template` returns 400 for `is_system=True`; tests prove no mutation on failure                               |
| PERM-01     | 01-01        | Workspace admins can list built-in and workspace custom templates                      | SATISFIED | `list` allowed for `ROLE.ADMIN`/`ROLE.MEMBER`; `test_admin_list_returns_seeded_builtins` PASSED                             |
| PERM-03     | 01-02, 01-03 | Workspace guests cannot create, edit, delete, archive, or deactivate custom templates  | SATISFIED | `test_guest_create/patch/delete/duplicate_returns_403` all PASSED                                                           |
| PERM-04     | 01-02, 01-03 | Workspace members who are not admins cannot write custom templates                     | SATISFIED | `test_member_create/patch/delete/duplicate_returns_403` all PASSED                                                          |
| PERM-05     | 01-02, 01-03 | API write operations for custom templates reject unauthorized users                    | SATISFIED | Standard 403 body from `allow_permission`; tests assert exact body and status                                               |

All 16 requirement IDs (CAT-03, CAT-04, CAT-05, CUST-01..CUST-09, PERM-01, PERM-03, PERM-04, PERM-05) are accounted for with substantive behavioral evidence. No orphaned requirements.

### Anti-Patterns Found

No anti-patterns detected in any file modified by this phase. Specifically:

- No `TBD`/`FIXME`/`XXX` debt markers in any of the 4 implementation files
- No `console.log`-only stub functions in implementation files
- No empty `return null/{}`/`console.log` responses in viewset handlers
- No hardcoded empty data flowing to rendering

### Human Verification Required

None — all phase 1 must-haves are proven by automated behavioral tests in this verification environment. The behavioral tests exercise the actual code paths, not just symbol presence.

### Gaps Summary

No gaps. All 17 observable truths verified, all 8 required artifacts present and substantive, all 7 critical wirings confirmed, all 16 requirement IDs covered, all 78 targeted tests pass through Docker compose.

---

_verified: 2026-06-30T03:49:31Z_
_verifier: Claude (gsd-verifier)_
