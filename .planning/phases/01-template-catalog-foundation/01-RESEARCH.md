# Phase 01: template-catalog-foundation - Research

**Researched:** 2026-06-30
**Domain:** Django REST API, workspace-scoped catalog models, JSON payload validation, permissions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
## Implementation Decisions

### Template Payload Structure
- **D-01:** Store template contents as a JSON payload with backend schema validation, rather than separate child models for each section.
- **D-02:** Every template payload must include a required `schema_version` from Phase 1 so future payload migrations are possible.
- **D-03:** References inside the payload must use stable internal keys, such as `state_key`, `label_keys`, `module_key`, and `cycle_key`, rather than display names or array indexes.
- **D-04:** Payload validation must be strict when templates are created or edited. It should catch required fields, duplicate keys/names, invalid colors/groups/status/priority values where applicable, dangling references, default-state rules, and ordering issues before a template can be used.

### Custom Template Lifecycle
- **D-05:** Custom template removal is soft deactivate/archive. Inactive templates no longer appear for new project creation, but their data remains for audit and reference safety.
- **D-06:** Editing a custom template affects only future project creation. Projects already created from an older template version remain unchanged.
- **D-07:** Phase 1 API should allow workspace admins to duplicate/copy a built-in template into a custom workspace template that can then be edited.
- **D-08:** Do not implement full version history for custom template edits in v1. Keep `schema_version` plus normal metadata such as `updated_at` and `updated_by`; do not store full old snapshots.

### Built-in Templates
- **D-09:** Built-in templates are seeded into the database as read-only system template records so list APIs can use a unified catalog path.
- **D-10:** Built-in templates are global records without `workspace_id`. Every workspace can see the same built-in templates; custom templates are workspace-scoped.
- **D-11:** Built-in templates cannot be edited or deactivated through custom template APIs. Admins must duplicate built-ins into custom templates before editing.
- **D-12:** Built-in template seed/migration behavior should be idempotent and sync by a stable system key, updating read-only built-ins without touching custom copies.

### Template List/Write Permissions
- **D-13:** Workspace admins and members can list available templates: global built-ins plus active custom templates for the workspace.
- **D-14:** Workspace guests cannot list templates in Phase 1.
- **D-15:** Only workspace admins can create, edit, deactivate, or duplicate templates into custom workspace templates.
- **D-16:** Unauthorized write operations should use standard DRF permission-denied behavior through existing permission classes, returning 403 consistently with the current API.

### the agent's Discretion
- Choose exact model, serializer, permission class, and URL names that match existing Plane backend conventions.
- Choose exact JSON schema implementation details, as long as the decisions above are enforced and tests cover the requirements.

### Deferred Ideas (OUT OF SCOPE)
## Deferred Ideas

None - discussion stayed within phase scope.
</user_constraints>

## Project Constraints (from AGENTS.md)

- Use backend Docker test commands for `apps/api`: `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`, subset `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`, teardown `docker compose -f docker-compose-test.yml down -v`. [VERIFIED: AGENTS.md]
- Run `./setup.sh` once before backend Docker tests if `apps/api/.env` has not been generated. [VERIFIED: AGENTS.md]
- All features require unit tests and should use the existing test framework per package. [VERIFIED: AGENTS.md]
- Python backend formatting and linting are configured with Ruff in `apps/api/pyproject.toml`; TypeScript rules are not the primary constraint for this backend-only phase. [VERIFIED: codebase grep]
- For frontend work, internal imports must use `workspace:*` and external deps must use `catalog:`, but this phase has no frontend implementation scope. [VERIFIED: AGENTS.md]

## Summary

Phase 01 should be planned as a backend catalog slice in `plane.app` plus `plane.db`: add one `ProjectTemplate` model under `apps/api/plane/db/models/`, expose workspace-scoped catalog/custom-template endpoints under `apps/api/plane/app/views/` and `apps/api/plane/app/urls/workspace.py`, validate the JSON payload in serializer/helper code before saving, and seed the three built-ins idempotently through a Django data migration. [VERIFIED: `.planning/phases/01-template-catalog-foundation/01-CONTEXT.md`; VERIFIED: codebase grep]

The closest local analog is not a separate catalog feature; it is the workspace/project resource pattern: models inherit `BaseModel` or `WorkspaceBaseModel`, serializers inherit `BaseSerializer`, viewsets inherit `BaseViewSet` or `BaseAPIView`, routes are explicit `path(...)` entries, and app API tests live under `apps/api/plane/tests/contract/app/`. [VERIFIED: codebase grep] The closest payload/relationship validation analog is `DraftIssueCreateSerializer`, which validates state, label, assignee, module, and cycle references before creating or updating related objects. [VERIFIED: codebase grep]

**Primary recommendation:** implement `ProjectTemplate` as a `BaseModel` with nullable `workspace`, stable `system_key`, `template_type`/`is_system`, `is_active`, and `payload = models.JSONField(default=dict)`, then route all create/edit/copy/deactivate operations through one serializer-level validator and admin-only workspace endpoint. [VERIFIED: codebase grep; CITED: https://docs.djangoproject.com/en/4.2/ref/models/fields/#jsonfield]

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Store built-in templates | Database / Storage | API / Backend | Built-ins are locked as database records and synced by migration using stable system keys. [VERIFIED: CONTEXT.md] |
| List available catalog | API / Backend | Database / Storage | The API must combine global built-ins and active workspace custom templates while enforcing workspace membership. [VERIFIED: CONTEXT.md] |
| Create/edit/deactivate custom templates | API / Backend | Database / Storage | Writes require workspace-admin authorization, serializer validation, and persisted audit metadata. [VERIFIED: CONTEXT.md; VERIFIED: codebase grep] |
| Validate template payload | API / Backend | Database / Storage | Strict validation must run before templates are saved or copied for future project creation. [VERIFIED: CONTEXT.md] |
| Prevent built-in edits | API / Backend | Database / Storage | Write endpoints must reject `is_system` or null-workspace records rather than relying on frontend hiding. [VERIFIED: CONTEXT.md] |

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAT-03 | User can select the built-in `Software Project` template when creating a Project. | Seed `software-project` built-in and expose it in the workspace catalog list. [VERIFIED: REQUIREMENTS.md] |
| CAT-04 | User can select the built-in `Marketing Campaign` template when creating a Project. | Seed `marketing-campaign` built-in and expose it in the workspace catalog list. [VERIFIED: REQUIREMENTS.md] |
| CAT-05 | User can select the built-in `Operations Project` template when creating a Project. | Seed `operations-project` built-in and expose it in the workspace catalog list. [VERIFIED: REQUIREMENTS.md] |
| CUST-01 | Workspace admin can create a custom Project Template scoped to that workspace. | Use admin-only create endpoint and nullable/global distinction. [VERIFIED: REQUIREMENTS.md] |
| CUST-02 | Workspace admin can edit a custom Project Template scoped to that workspace. | Use scoped queryset `workspace__slug=slug`, reject built-ins, validate payload on update. [VERIFIED: codebase grep] |
| CUST-03 | Workspace admin can delete, archive, or deactivate a custom Project Template. | Prefer `is_active=False` soft deactivation for this model. [VERIFIED: CONTEXT.md] |
| CUST-04 | Workspace admin can define template states. | Validate state keys, names, colors, groups, sequence/order, and exactly one usable default. [VERIFIED: CONTEXT.md; VERIFIED: codebase grep] |
| CUST-05 | Workspace admin can define template labels. | Validate label keys, names, colors, optional descriptions, and ordering. [VERIFIED: REQUIREMENTS.md] |
| CUST-06 | Workspace admin can define template modules. | Validate module keys, status values, descriptions, and optional date fields. [VERIFIED: REQUIREMENTS.md; VERIFIED: codebase grep] |
| CUST-07 | Workspace admin can define template cycles. | Validate cycle keys, descriptions, and relative date/duration metadata as payload-only data. [VERIFIED: REQUIREMENTS.md] |
| CUST-08 | Workspace admin can define starter issues. | Validate issue state/label/module/cycle references by stable keys and priority values. [VERIFIED: CONTEXT.md; VERIFIED: codebase grep] |
| CUST-09 | Workspace admin cannot edit built-in system templates directly. | Filter write queryset to custom templates and add serializer/view guard for system records. [VERIFIED: CONTEXT.md] |
| PERM-01 | Workspace admins can list built-in and workspace custom templates. | List endpoint should allow admin and member roles except guests per Phase 1 context. [VERIFIED: CONTEXT.md] |
| PERM-03 | Workspace guests cannot create, edit, delete, archive, or deactivate custom templates. | Admin-only decorator/permission blocks guest writes with 403. [VERIFIED: codebase grep] |
| PERM-04 | Workspace members who are not admins cannot write custom templates. | Use `ROLE.ADMIN` only; do not use `WorkSpaceAdminPermission` because it allows members. [VERIFIED: codebase grep] |
| PERM-05 | API write operations reject unauthorized users with permission error. | `allow_permission` returns HTTP 403 with Plane's standard error payload. [VERIFIED: codebase grep] |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Django | 4.2.30 | ORM model, migrations, JSONField, constraints, app routing. | Pinned in `apps/api/requirements/base.txt` and used by `apps/api/plane/db` and `apps/api/plane/app`. [VERIFIED: codebase grep] |
| Django REST framework | 3.15.2 | Serializers, APIView/ViewSet, permissions, Response/status handling. | Pinned in `apps/api/requirements/base.txt`; Plane app APIs inherit DRF-based base classes. [VERIFIED: codebase grep] |
| PostgreSQL via psycopg | 3.3.0 | Primary relational persistence and JSONB backing for `JSONField`. | Pinned in `apps/api/requirements/base.txt`; integrations map identifies PostgreSQL as the primary application database. [VERIFIED: codebase grep] |
| pytest + pytest-django | 9.0.3 / 4.5.2 | Unit and contract test runner for API code. | Pinned in `apps/api/requirements/test.txt`; `apps/api/pytest.ini` configures `plane.settings.test`. [VERIFIED: codebase grep] |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| django-filter | 24.2 | Existing filtering backend for base API classes. | Reuse if template list gains query filters such as `type` or `is_active`; `BaseAPIView` and `BaseViewSet` include `DjangoFilterBackend`. [VERIFIED: codebase grep] |
| factory-boy | 3.3.0 | Test object factories. | Add a `ProjectTemplateFactory` only if tests need repeated template fixtures. [VERIFIED: codebase grep] |
| jsonmodels | 2.7.0 | Existing dependency labeled "json model". | Do not adopt unless there is a clear local pattern; grep found no application usage for template-like validation. [VERIFIED: codebase grep] |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-code Python payload validator | Add `jsonschema` or another schema package | Not recommended for Phase 1 because no schema package is already installed and the payload has cross-reference rules that still require custom validation. [VERIFIED: codebase grep] |
| One JSON payload model | Separate child models for states/labels/modules/cycles/issues | Out of scope because D-01 explicitly locks JSON payload storage. [VERIFIED: CONTEXT.md] |
| `WorkSpaceAdminPermission` | `WorkspaceOwnerPermission` or `allow_permission([ROLE.ADMIN], level="WORKSPACE")` | `WorkSpaceAdminPermission` includes members, which conflicts with admin-only template writes. [VERIFIED: codebase grep] |

**Installation:**

```bash
# No new package install is recommended for Phase 01.
```

**Version verification:** Versions above were verified from `apps/api/requirements/base.txt`, `apps/api/requirements/test.txt`, and `apps/api/pytest.ini`; no registry lookup is needed because Phase 01 should not install new dependencies. [VERIFIED: codebase grep]

## Package Legitimacy Audit

No new external packages are recommended or installed for this phase. [VERIFIED: codebase grep]

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| None | - | - | - | - | - | No install |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```text
Authenticated /api/ request
  -> workspace template URL under plane.app.urls.workspace
  -> BaseViewSet/BaseAPIView authentication and timezone handling
  -> workspace role check
       -> list: allow admin/member, reject guest
       -> write/copy/deactivate: admin only
  -> queryset scope
       -> built-ins: workspace IS NULL, is_system true, active
       -> custom: workspace slug matches request, active for list
  -> ProjectTemplateSerializer
       -> validate metadata
       -> validate payload schema_version
       -> validate states/labels/modules/cycles/issues and key references
  -> ProjectTemplate model
       -> PostgreSQL row with JSON payload
       -> built-ins synced by data migration using stable system_key
  -> serialized catalog response for later create-project UI/API phases
```

### Recommended Project Structure

```text
apps/api/plane/db/models/
+-- project_template.py          # ProjectTemplate model and template type choices
+-- __init__.py                  # Export ProjectTemplate

apps/api/plane/db/migrations/
+-- 0122_projecttemplate_seed_builtins.py  # schema + idempotent RunPython seed

apps/api/plane/app/serializers/
+-- project_template.py          # read/write serializers and duplicate serializer
+-- __init__.py                  # Export serializers

apps/api/plane/app/views/workspace/
+-- project_template.py          # catalog/custom template endpoints

apps/api/plane/app/urls/
+-- workspace.py                 # workspace route registrations

apps/api/plane/tests/
+-- unit/serializers/test_project_template.py
+-- unit/models/test_project_template.py
+-- contract/app/test_project_templates_app.py
```

### Pattern 1: Workspace-Scoped ViewSet

**What:** Use `BaseViewSet`, `get_queryset()`, and explicit workspace URL routes as the local API shape. [VERIFIED: codebase grep]
**When to use:** Use for custom template CRUD because it maps to existing `workspace/<slug>/...` API conventions. [VERIFIED: codebase grep]
**Example:**

```python
# Source: apps/api/plane/app/views/workspace/draft.py
class WorkspaceDraftIssueViewSet(BaseViewSet):
    model = DraftIssue

    def get_queryset(self):
        return DraftIssue.objects.filter(workspace__slug=self.kwargs.get("slug"))
```

### Pattern 2: Admin-Only Workspace Writes

**What:** Use `@allow_permission([ROLE.ADMIN], level="WORKSPACE")` for create/edit/deactivate/copy template methods. [VERIFIED: codebase grep]
**When to use:** Use when non-admin members and guests must receive 403 for writes. [VERIFIED: CONTEXT.md]
**Example:**

```python
# Source: apps/api/plane/app/permissions/base.py
@allow_permission([ROLE.ADMIN], level="WORKSPACE")
def create(self, request, slug):
    ...
```

### Pattern 3: Serializer-First Validation

**What:** Put request validation in a `BaseSerializer` subclass and return `serializer.errors` with HTTP 400 from the view. [VERIFIED: codebase grep]
**When to use:** Use for payload rules so invalid templates never persist. [VERIFIED: CONTEXT.md]
**Example:**

```python
# Source: apps/api/plane/app/serializers/module.py
def validate(self, data):
    if data.get("start_date") and data.get("target_date") and data["start_date"] > data["target_date"]:
        raise serializers.ValidationError("Start date cannot exceed target date")
    return data
```

### Anti-Patterns to Avoid

- **Using `WorkSpaceAdminPermission` for admin-only writes:** It permits roles `[Admin, Member]`, so it would violate PERM-04. [VERIFIED: codebase grep]
- **Letting built-in rows share the same write endpoint queryset as custom rows:** Built-ins have `workspace_id = NULL` by decision and must be read-only. [VERIFIED: CONTEXT.md]
- **Saving invalid payloads for later Phase 2 validation:** D-04 requires strict validation when templates are created or edited. [VERIFIED: CONTEXT.md]
- **Referencing payload sections by display names or array indexes:** D-03 requires stable internal keys for cross-section references. [VERIFIED: CONTEXT.md]
- **Hard deleting custom templates:** D-05 requires soft deactivate/archive semantics. [VERIFIED: CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP auth/session handling | Custom auth middleware | Existing `BaseSessionAuthentication` through `BaseAPIView`/`BaseViewSet` | Plane app APIs already use this stack. [VERIFIED: codebase grep] |
| Workspace role lookup | Ad hoc role constants in each method | Existing `ROLE` enum and `allow_permission` decorator | Local permission payload and 403 behavior are already implemented. [VERIFIED: codebase grep] |
| JSON storage format | Text blobs or manual JSON encoding | Django `models.JSONField(default=dict)` | Official Django docs support `JSONField`; callable defaults avoid shared mutable defaults. [CITED: https://docs.djangoproject.com/en/4.2/ref/models/fields/#jsonfield] |
| Data seeding | Runtime seed-on-first-request | Django migration with `RunPython` and historical models | Official migration docs recommend historical models via `apps.get_model` in data migrations. [CITED: https://docs.djangoproject.com/en/4.2/topics/migrations/#data-migrations] |
| Payload cross-reference checks | Best-effort frontend checks | Backend serializer/helper validation | Phase 1 requires validation before project creation use. [VERIFIED: CONTEXT.md] |

**Key insight:** JSON payload storage is the locked persistence choice, but validation must be explicit backend domain code because template correctness depends on cross-section invariants such as dangling state/label/module/cycle references. [VERIFIED: CONTEXT.md]

## Common Pitfalls

### Pitfall 1: Misnamed Permission Class
**What goes wrong:** Planner assigns `WorkSpaceAdminPermission` to write endpoints and accidentally allows workspace members to write templates. [VERIFIED: codebase grep]
**Why it happens:** The class name says admin, but the implementation checks `role__in=[Admin, Member]`. [VERIFIED: codebase grep]
**How to avoid:** Use `WorkspaceOwnerPermission` or `allow_permission([ROLE.ADMIN], level="WORKSPACE")`. [VERIFIED: codebase grep]
**Warning signs:** A member role receives 201/200/204 on template create, patch, deactivate, or duplicate tests. [VERIFIED: REQUIREMENTS.md]

### Pitfall 2: Built-In Mutation Through Generic Update
**What goes wrong:** A global built-in template can be patched or deactivated by passing its UUID to a custom-template endpoint. [VERIFIED: CONTEXT.md]
**Why it happens:** Built-ins and custom templates share one table by decision. [VERIFIED: CONTEXT.md]
**How to avoid:** Filter write querysets to `workspace__slug=slug, is_system=False`, and add a serializer/view guard that rejects system templates. [VERIFIED: CONTEXT.md]
**Warning signs:** A test can change `Software Project` without duplicating it first. [VERIFIED: REQUIREMENTS.md]

### Pitfall 3: Weak Payload Validation
**What goes wrong:** A template stores starter issues that point to missing state, label, module, or cycle keys, causing Phase 2 project creation to fail late. [VERIFIED: CONTEXT.md]
**Why it happens:** DRF `JSONField` validates JSON shape only; it does not know domain invariants. [CITED: https://www.django-rest-framework.org/api-guide/fields/#jsonfield]
**How to avoid:** Write a dedicated validator that builds key sets per section and validates references, allowed enum values, duplicate keys/names, ordering, and default-state rules. [VERIFIED: CONTEXT.md]
**Warning signs:** Serializer unit tests only assert that `payload` is a dict. [VERIFIED: codebase grep]

### Pitfall 4: Idempotent Seed Overwrites Custom Copies
**What goes wrong:** A migration updates copied custom templates when refreshing built-ins. [VERIFIED: CONTEXT.md]
**Why it happens:** Seed sync matches by name instead of stable `system_key` plus system/global flags. [VERIFIED: CONTEXT.md]
**How to avoid:** Seed with stable system keys and update only records where `is_system=True` and `workspace_id IS NULL`. [VERIFIED: CONTEXT.md]
**Warning signs:** Built-in refresh touches rows with non-null `workspace_id`. [VERIFIED: CONTEXT.md]

## Code Examples

### Model Skeleton

```python
# Source basis: apps/api/plane/db/models/base.py and workspace/project models
class ProjectTemplate(BaseModel):
    class TemplateType(models.TextChoices):
        BUILT_IN = "built_in", "Built-in"
        CUSTOM = "custom", "Custom"

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, null=True, blank=True)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    template_type = models.CharField(max_length=20, choices=TemplateType.choices)
    system_key = models.SlugField(max_length=100, null=True, blank=True)
    is_system = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    payload = models.JSONField(default=dict)
```

### Payload Validator Shape

```python
# Source basis: apps/api/plane/app/serializers/draft.py validation pattern
def validate_project_template_payload(payload):
    if payload.get("schema_version") != 1:
        raise serializers.ValidationError({"payload": "Unsupported schema_version"})

    state_keys = require_unique_keys(payload.get("states", []), "state_key")
    label_keys = require_unique_keys(payload.get("labels", []), "label_key")
    module_keys = require_unique_keys(payload.get("modules", []), "module_key")
    cycle_keys = require_unique_keys(payload.get("cycles", []), "cycle_key")

    for issue in payload.get("starter_issues", []):
        require_member(issue["state_key"], state_keys, "state_key")
        require_members(issue.get("label_keys", []), label_keys, "label_keys")
        require_optional_member(issue.get("module_key"), module_keys, "module_key")
        require_optional_member(issue.get("cycle_key"), cycle_keys, "cycle_key")

    return payload
```

### Idempotent Data Migration Shape

```python
# Source: Django data migration docs recommend apps.get_model in RunPython.
def seed_project_templates(apps, schema_editor):
    ProjectTemplate = apps.get_model("db", "ProjectTemplate")
    for template in BUILT_IN_TEMPLATES:
        ProjectTemplate.objects.update_or_create(
            system_key=template["system_key"],
            is_system=True,
            workspace__isnull=True,
            defaults={**template, "workspace": None, "is_active": True},
        )
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Empty project plus default states only | Catalog-backed built-in/custom templates | Phase 01 introduces the catalog; Phase 02 applies templates | Phase 01 should not modify project creation behavior yet. [VERIFIED: ROADMAP.md] |
| Hard delete for removable resources | Soft deactivate/archive for custom templates | Locked by D-05 | Plans need a deactivate endpoint or destroy override that sets `is_active=False`. [VERIFIED: CONTEXT.md] |
| Frontend-only selection data | Database-backed catalog API | Locked by D-09 | Built-ins must be seeded as records, not hard-coded only in frontend. [VERIFIED: CONTEXT.md] |

**Deprecated/outdated:**
- Using Django 4.2.30 is the current repository pin, but Django 4.2 documentation now displays an unsupported-version warning as of the official docs site; upgrading Django is outside Phase 01 scope but should remain a security maintenance concern. [VERIFIED: codebase grep; CITED: https://docs.djangoproject.com/en/4.2/]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | The built-in template payload content itself can be represented with static in-repo Python dictionaries in a migration/helper module. [ASSUMED] | Architecture Patterns | Planner may need to split seed data into JSON fixtures or a dedicated constants module if maintainers prefer non-migration payload definitions. |

## Open Questions (RESOLVED)

1. **Exact endpoint names**
   - What we know: Workspace routes use explicit names like `workspace-draft-issues` and `workspace-quick-links`. [VERIFIED: codebase grep]
   - RESOLVED: Use `/api/workspaces/{slug}/project-templates/`, `/api/workspaces/{slug}/project-templates/{pk}/`, and `/api/workspaces/{slug}/project-templates/{pk}/duplicate/` via `WorkspaceProjectTemplateViewSet` in `apps/api/plane/app/views/workspace/project_template.py`, registered in `apps/api/plane/app/urls/workspace.py` with route name `workspace-project-templates`. [RESOLVED]

2. **Exact payload date metadata**
   - What we know: Requirements allow optional date fields for modules and optional relative date/duration metadata for cycles. [VERIFIED: REQUIREMENTS.md]
   - RESOLVED: Keep Phase 1 payload minimal and structural only, with optional module/cycle date metadata fields as integers relative to project creation: `start_offset_days`, `target_offset_days`, and `duration_days`. Phase 1 validates only integer type and ordering, including `start_offset_days <= target_offset_days` when both offsets are present. Phase 2 will interpret these values during template application. [RESOLVED]

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Python | Django API and tests | yes | 3.14.4 from local shell | Use Docker test stack Python if local interpreter is incompatible. [VERIFIED: command] |
| Docker | Backend test stack | yes | Docker 29.6.0, Compose v5.1.4 | None needed. [VERIFIED: command] |
| pnpm | Monorepo commands | yes | 11.3.0 | Not needed for backend-only Phase 01. [VERIFIED: command] |
| Node | GSD tooling and monorepo | yes | v22.22.1 | Not needed for backend-only tests except tooling. [VERIFIED: command] |
| pytest on host | Direct local tests | no | not on PATH | Use Docker commands from AGENTS.md. [VERIFIED: command] |

**Missing dependencies with no fallback:** none. [VERIFIED: command]

**Missing dependencies with fallback:** host `pytest` is missing; use the Docker test stack. [VERIFIED: command; VERIFIED: AGENTS.md]

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | yes | Existing session authentication through `BaseSessionAuthentication` in `BaseAPIView`/`BaseViewSet`. [VERIFIED: codebase grep] |
| V3 Session Management | yes | Reuse existing authenticated app API stack; do not add custom auth/session code. [VERIFIED: codebase grep] |
| V4 Access Control | yes | Workspace role checks with `ROLE.ADMIN` for writes and explicit guest exclusion for list. [VERIFIED: CONTEXT.md; VERIFIED: codebase grep] |
| V5 Input Validation | yes | Serializer/helper validation for all template payload sections before save. [VERIFIED: CONTEXT.md] |
| V6 Cryptography | no | This phase does not introduce cryptographic storage or token handling. [VERIFIED: ROADMAP.md] |

### Known Threat Patterns for Django/DRF Template Catalog

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized template mutation by workspace member | Elevation of privilege | Admin-only write decorator and contract tests for member/guest 403. [VERIFIED: codebase grep] |
| Built-in template tampering | Tampering | Write queryset excludes `is_system=True` and null-workspace rows; serializer rejects system records. [VERIFIED: CONTEXT.md] |
| Malformed payload stored for later execution | Tampering | Strict backend validation of enum values, references, duplicate keys, and required fields. [VERIFIED: CONTEXT.md] |
| Cross-workspace custom template access | Information disclosure | Querysets must filter custom templates by `workspace__slug=slug`; list adds global built-ins separately. [VERIFIED: CONTEXT.md; VERIFIED: codebase grep] |

## Sources

### Primary (HIGH confidence)
- `AGENTS.md` - commands, backend Docker tests, code style constraints. [VERIFIED: AGENTS.md]
- `.planning/phases/01-template-catalog-foundation/01-CONTEXT.md` - locked phase decisions. [VERIFIED: CONTEXT.md]
- `.planning/REQUIREMENTS.md` - requirement descriptions and traceability. [VERIFIED: REQUIREMENTS.md]
- `.planning/ROADMAP.md` - phase goal, primary code areas, success criteria. [VERIFIED: ROADMAP.md]
- `apps/api/plane/db/models/`, `apps/api/plane/app/serializers/`, `apps/api/plane/app/views/`, `apps/api/plane/app/urls/`, `apps/api/plane/app/permissions/`, `apps/api/plane/tests/` - local implementation patterns. [VERIFIED: codebase grep]

### Secondary (MEDIUM confidence)
- Django docs: JSONField, constraints, and data migrations. [CITED: https://docs.djangoproject.com/en/4.2/ref/models/fields/#jsonfield; CITED: https://docs.djangoproject.com/en/4.2/ref/models/constraints/; CITED: https://docs.djangoproject.com/en/4.2/topics/migrations/#data-migrations]
- DRF docs: serializers, fields, permissions. [CITED: https://www.django-rest-framework.org/api-guide/serializers/; CITED: https://www.django-rest-framework.org/api-guide/fields/#jsonfield; CITED: https://www.django-rest-framework.org/api-guide/permissions/]

### Tertiary (LOW confidence)
- A1 payload constants organization remains assumed because no existing project-template domain exists. [ASSUMED] The resolved endpoint routes and date metadata schema are recorded above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - package versions and test config were read from repository files. [VERIFIED: codebase grep]
- Architecture: HIGH - based on locked context and direct Plane API analogs. [VERIFIED: CONTEXT.md; VERIFIED: codebase grep]
- Pitfalls: HIGH - derived from explicit permission implementation, locked decisions, and local serializer patterns. [VERIFIED: codebase grep]

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 for local codebase patterns; re-check framework docs and dependency pins before planning if the repo changes. [ASSUMED]
