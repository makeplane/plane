# Phase 02: transactional-project-creation - Research

**Researched:** 2026-06-30
**Domain:** Django REST API transactional project scaffolding and template application
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

## Implementation Decisions

### Template Selection Validation And Permissions

- **D-01:** Workspace admins and members may use built-in templates and active custom templates from the current workspace when creating a Project. This is Project creation permission, not template management permission. Guests remain blocked by the existing Project create route.
- **D-02:** Invalid template lookup must return a generic 404 for missing templates, inactive templates, and templates from another workspace. Do not expose whether a template exists but is unavailable.
- **D-03:** Omitted `template_id` and `template_id = null` mean no-template Project creation. An empty string `template_id` is a validation error.
- **D-04:** Re-run Phase 1 template payload validation before applying a saved template. Stale, corrupted, or directly modified payload data should fail safely before any partial Project remains.

### Transaction Boundary

- **D-05:** For the template path, wrap the full Project create flow in one database transaction: Project, ProjectIdentifier, creator admin membership, project lead admin membership when provided, generated states, labels, modules, cycles, starter issues, and related join rows.
- **D-06:** The no-template Project creation path should also run inside an atomic transaction. Successful behavior must remain the same, but failures in identifier, membership, or default state creation should roll back cleanly.
- **D-07:** When a valid template is selected, do not create `DEFAULT_STATES`. Template-created Projects must contain only states generated from the template payload.
- **D-08:** Async activity/logging enqueue failure, such as `model_activity.delay(...)`, should not roll back a successfully committed Project. The transaction protects core database state; activity failure is not core Project data.

### Generated Content Mapping

- **D-09:** Generated states must preserve the payload's `sequence` and `default` marker exactly. The implementation should avoid model save hooks overriding template-provided state sequence.
- **D-10:** Generated labels, modules, and cycles should preserve order or sort metadata from the template when available. If a section lacks an explicit sort field, use payload array order to produce stable initial ordering instead of relying on save timing.
- **D-11:** Starter issues must be created with an explicit state resolved from `state_key`. Do not rely on `Issue._ensure_default_state` for template starter issues.
- **D-12:** Starter issue links must be created from the newly generated objects resolved through `label_keys`, `module_key`, and `cycle_key`.
- **D-13:** If any payload reference key cannot resolve during application, fail hard and roll back the entire Project creation. Do not create a Project with missing or silently skipped template references.

### Relative Dates And Ownership

- **D-14:** Resolve template relative date offsets from the Project creation date.
- **D-15:** If `target_offset_days` is present, use it as the explicit target/end offset. Use `duration_days` only as a fallback to calculate an end/target date from a start date when `target_offset_days` is absent.
- **D-16:** Use the Project creator (`request.user`) as `created_by` for generated content and as `Cycle.owned_by`.
- **D-17:** Leave starter issue assignees and subscribers empty in Phase 2. User-reference mapping was not locked by Phase 1 and should not be added to this phase.

### The Agent's Discretion

- Choose exact service/helper boundaries for template application, as long as the decisions above are enforced.
- Choose exact serializer/view validation placement for `template_id`, as long as no-template behavior remains backwards-compatible and tests cover null, omitted, empty string, invalid, inactive, and foreign-workspace template values.
- Choose exact rollback test mechanics, as long as tests prove no partial Project or generated content remains after template application failure.

### Deferred Ideas (OUT OF SCOPE)

## Deferred Ideas

None - discussion stayed within phase scope.
</user_constraints>

## Project Constraints (from AGENTS.md)

- Use `pnpm` only for TypeScript/frontend workspace checks; `apps/api` backend validation uses Python and Docker pytest. [VERIFIED: AGENTS.md]
- Backend full suite command is `docker compose -f docker-compose-test.yml up --build --abort-on-container-exit --exit-code-from api-tests`. [VERIFIED: AGENTS.md]
- Backend subset command is `docker compose -f docker-compose-test.yml run --rm api-tests pytest -m unit`. [VERIFIED: AGENTS.md]
- Run `./setup.sh` once if `apps/api/.env` is absent; `apps/api/.env` is present in this workspace. [VERIFIED: AGENTS.md; VERIFIED: shell probe]
- All features require unit tests and should use the existing package test framework. [VERIFIED: AGENTS.md]
- Backend Python style follows Ruff settings in `apps/api/pyproject.toml`; tests use `apps/api/pytest.ini` discovery and markers. [VERIFIED: .planning/codebase/CONVENTIONS.md; VERIFIED: apps/api/pytest.ini]

## Summary

Phase 02 should be planned as a backend transaction/service slice, not as scattered controller code: accept an optional non-model `template_id`, validate template availability, create the Project and core scaffolding inside one `transaction.atomic()` block, then apply either `DEFAULT_STATES` or the selected template payload. [VERIFIED: `.planning/phases/02-transactional-project-creation/02-CONTEXT.md`; VERIFIED: apps/api/plane/app/views/project/base.py; VERIFIED: apps/api/plane/api/views/project.py]

The safest implementation boundary is a shared helper or service used by the app project endpoint and, if Phase 2 covers the v1 API surface, the API-key endpoint too. The two current create paths diverge: `plane.app` creates `ProjectIdentifier` in `ProjectSerializer.create()` but does not yet wrap create in `transaction.atomic()` or defer activity with `transaction.on_commit()`, while `plane.api` already wraps the no-template flow in `transaction.atomic()` and defers `model_activity.delay()` with `robust=True`. [VERIFIED: apps/api/plane/app/serializers/project.py; VERIFIED: apps/api/plane/app/views/project/base.py; VERIFIED: apps/api/plane/api/views/project.py; CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/]

**Primary recommendation:** add a project creation service that owns `template_id` lookup, re-validation, all generated object creation, rollback semantics, and post-commit activity registration; keep serializers focused on project-field validation and make `template_id` an explicit write-only input that is never persisted on `Project`. [VERIFIED: apps/api/plane/app/serializers/project.py; VERIFIED: apps/api/plane/app/serializers/project_template.py; CITED: https://www.django-rest-framework.org/api-guide/fields/#core-arguments]

## Architectural Responsibility Map

| Capability                             | Primary Tier       | Secondary Tier                  | Rationale                                                                                                                                                                                                                   |
| -------------------------------------- | ------------------ | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accept `template_id` on Project create | API / Backend      | Frontend Server / Browser later | The backend endpoint must accept the field now while frontend selection is Phase 3. [VERIFIED: REQUIREMENTS.md]                                                                                                             |
| Validate template availability         | API / Backend      | Database / Storage              | Availability depends on workspace-scoped query rules for active global built-ins and active current-workspace custom templates. [VERIFIED: 02-CONTEXT.md; VERIFIED: apps/api/plane/app/views/workspace/project_template.py] |
| Transactional project scaffolding      | API / Backend      | Database / Storage              | Atomicity covers project row, identifier, memberships, states, labels, modules, cycles, issues, and join rows. [VERIFIED: 02-CONTEXT.md; CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/]              |
| Generated content persistence          | Database / Storage | API / Backend                   | Model constraints and save hooks affect ordering, audit fields, sequence IDs, and join-row validity. [VERIFIED: apps/api/plane/db/models/state.py; VERIFIED: apps/api/plane/db/models/issue.py]                             |
| Activity/log enqueue                   | API / Backend      | Queue / Worker                  | Activity enqueue is non-core and must run after successful commit without rolling back a committed project. [VERIFIED: 02-CONTEXT.md; VERIFIED: apps/api/plane/api/views/project.py]                                        |

<phase_requirements>

## Phase Requirements

| ID        | Description                                                                                            | Research Support                                                                                                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAT-02    | User can create a Project without selecting a template and receives existing default Project behavior. | Preserve no-template `DEFAULT_STATES` creation and existing memberships/response. [VERIFIED: REQUIREMENTS.md; VERIFIED: apps/api/plane/app/views/project/base.py]                                                             |
| CREATE-01 | Project creation API accepts optional `template_id`.                                                   | Add explicit write-only serializer field; omitted/null means no template, empty string is 400. [VERIFIED: 02-CONTEXT.md; CITED: https://www.django-rest-framework.org/api-guide/fields/#core-arguments]                       |
| CREATE-02 | Creation without `template_id` preserves current behavior.                                             | Existing app route creates Project, ProjectIdentifier, creator admin, optional lead admin, and default states. [VERIFIED: apps/api/plane/app/views/project/base.py; VERIFIED: apps/api/plane/app/serializers/project.py]      |
| CREATE-03 | Creation with `template_id` validates selected template availability.                                  | Reuse Phase 1 catalog rules: active global built-in or active custom in current workspace. [VERIFIED: apps/api/plane/app/views/workspace/project_template.py]                                                                 |
| CREATE-04 | Creation with `template_id` applies contents in a single transaction.                                  | Wrap service in `transaction.atomic()`. [VERIFIED: 02-CONTEXT.md; CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/]                                                                                       |
| CREATE-05 | Template failure leaves no partial data.                                                               | Raise validation/integrity errors inside the atomic block and assert no Project/content remains. [VERIFIED: apps/api/plane/tests/contract/api/test_projects.py]                                                               |
| CREATE-06 | Existing create success behavior remains intact.                                                       | Preserve project lead, favorite/cover fields via existing serializers and response serializers. [VERIFIED: REQUIREMENTS.md; VERIFIED: apps/api/plane/app/serializers/project.py]                                              |
| GEN-01    | Template project contains template workflow states instead of default states.                          | Branch state creation: no `DEFAULT_STATES` when template is selected. [VERIFIED: 02-CONTEXT.md]                                                                                                                               |
| GEN-02    | Template project contains template labels.                                                             | Create `Label` rows with payload color/description/order or stable array-order fallback. [VERIFIED: apps/api/plane/db/models/label.py; VERIFIED: apps/api/plane/app/serializers/project_template.py]                          |
| GEN-03    | Template project contains template modules.                                                            | Create `Module` rows with status, description, dates, and sort order. [VERIFIED: apps/api/plane/db/models/module.py; VERIFIED: apps/api/plane/app/serializers/project_template.py]                                            |
| GEN-04    | Template project contains template cycles.                                                             | Create `Cycle` rows with creator as `owned_by` and resolved start/end dates. [VERIFIED: apps/api/plane/db/models/cycle.py; VERIFIED: 02-CONTEXT.md]                                                                           |
| GEN-05    | Template project contains starter issues.                                                              | Use normal `Issue.objects.create()` so sequence and stripped description hooks run. [VERIFIED: apps/api/plane/db/models/issue.py]                                                                                             |
| GEN-06    | Starter issues are assigned to correct states.                                                         | Resolve `state_key` to generated `State` and pass explicit `state`. [VERIFIED: 02-CONTEXT.md; VERIFIED: apps/api/plane/db/models/issue.py]                                                                                    |
| GEN-07    | Starter issues link to generated labels/modules/cycles.                                                | Create `IssueLabel`, `ModuleIssue`, and `CycleIssue` through rows from key maps. [VERIFIED: apps/api/plane/db/models/issue.py; VERIFIED: apps/api/plane/db/models/module.py; VERIFIED: apps/api/plane/db/models/cycle.py]     |
| VER-01    | Backend tests cover no-template creation.                                                              | Extend existing contract tests for app and/or v1 project create. [VERIFIED: apps/api/plane/tests/contract/app/test_project_app.py; VERIFIED: apps/api/plane/tests/contract/api/test_projects.py]                              |
| VER-02    | Backend tests cover each built-in template type at apply-service level.                                | Phase 1 seeded three built-ins in migration and constants. [VERIFIED: apps/api/plane/app/serializers/project_template.py; VERIFIED: apps/api/plane/db/migrations/0122_projecttemplate.py]                                     |
| VER-03    | Backend tests cover custom template CRUD permissions.                                                  | Phase 1 already has contract coverage in `test_project_templates_app.py`; Phase 2 should add create-from-custom permission/availability coverage. [VERIFIED: apps/api/plane/tests/contract/app/test_project_templates_app.py] |
| VER-04    | Backend tests cover rollback behavior when template application fails.                                 | Existing rollback style patches `State.objects.bulk_create`; Phase 2 should patch service/apply steps after Project creation. [VERIFIED: apps/api/plane/tests/contract/api/test_projects.py]                                  |

</phase_requirements>

## Standard Stack

### Core

| Library                | Version       | Purpose                                                                    | Why Standard                                                                                                                                                                        |
| ---------------------- | ------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Django                 | 4.2.30        | ORM, `transaction.atomic()`, `transaction.on_commit()`, model constraints. | Repository pin and current backend foundation. [VERIFIED: apps/api/requirements/base.txt]                                                                                           |
| Django REST framework  | 3.15.2        | Serializers, request validation, response handling.                        | Repository pin and existing Plane API serializer/view stack. [VERIFIED: apps/api/requirements/base.txt]                                                                             |
| PostgreSQL via psycopg | 3.3.0         | Primary database, FK constraints, advisory locks used by `Issue.save()`.   | Repository pin; `Issue.save()` uses PostgreSQL advisory transaction locks for sequence IDs. [VERIFIED: apps/api/requirements/base.txt; VERIFIED: apps/api/plane/db/models/issue.py] |
| Celery                 | 5.4.0         | Background activity/webhook task dispatch.                                 | Existing `model_activity.delay()` is the activity path. [VERIFIED: apps/api/requirements/base.txt; VERIFIED: apps/api/plane/app/views/project/base.py]                              |
| pytest / pytest-django | 9.0.3 / 4.5.2 | Backend unit and contract tests.                                           | Repository test stack. [VERIFIED: apps/api/requirements/test.txt; VERIFIED: apps/api/pytest.ini]                                                                                    |

### Supporting

| Library     | Version | Purpose                              | When to Use                                                                                                                                                                        |
| ----------- | ------- | ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| factory-boy | 3.3.0   | Optional repeated test object setup. | Use only if template application tests become repetitive; existing fixtures may be enough. [VERIFIED: apps/api/requirements/test.txt; VERIFIED: apps/api/plane/tests/factories.py] |
| freezegun   | 1.2.2   | Date/time freezing in tests.         | Use for relative-date assertions if `timezone.now().date()` makes tests brittle. [VERIFIED: apps/api/requirements/test.txt]                                                        |

### Alternatives Considered

| Instead of                                                  | Could Use                                                | Tradeoff                                                                                                                                                                                                                                     |
| ----------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared creation service                                     | Add template logic directly to `ProjectViewSet.create()` | Not recommended because app and v1 API create flows already diverge and transaction behavior should not be duplicated. [VERIFIED: apps/api/plane/app/views/project/base.py; VERIFIED: apps/api/plane/api/views/project.py]                   |
| Normal `.create()` for ordered states/labels/modules/cycles | `bulk_create` with explicit fields                       | `.create()` triggers ordering hooks that can overwrite payload order; `bulk_create` preserves explicit values but bypasses per-object save hooks. [VERIFIED: apps/api/plane/db/models/state.py; VERIFIED: apps/api/plane/db/models/label.py] |
| `bulk_create` for issues                                    | Normal `Issue.objects.create()`                          | Avoid bulk issue creation because `Issue.save()` assigns `sequence_id`, creates `IssueSequence`, strips HTML, and uses an advisory lock. [VERIFIED: apps/api/plane/db/models/issue.py]                                                       |

**Installation:**

```bash
# No new external packages are recommended for Phase 02.
```

## Package Legitimacy Audit

No new external packages are recommended or installed for this phase. [VERIFIED: codebase grep]

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
| ------- | -------- | --- | --------- | ----------- | ------- | ----------- |
| None    | -        | -   | -         | -           | -       | No install  |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** none.

## Architecture Patterns

### System Architecture Diagram

```text
POST /api/workspaces/{slug}/projects/
  -> Project serializer validates Project fields + template_id input
  -> ProjectCreationService.create(...)
       -> resolve workspace
       -> resolve template_id
            -> omitted/null: no-template branch
            -> "": serializer 400
            -> unavailable/missing/inactive/foreign: generic 404
            -> available: re-run validate_project_template_payload(payload)
       -> transaction.atomic()
            -> create Project + ProjectIdentifier
            -> create creator ProjectMember admin
            -> create distinct project_lead ProjectMember admin when provided
            -> if no template: create DEFAULT_STATES
            -> if template:
                 -> create template states and key map
                 -> create labels/modules/cycles and key maps
                 -> create starter issues with explicit state
                 -> create IssueLabel / ModuleIssue / CycleIssue joins
            -> register model_activity with transaction.on_commit(..., robust=True)
       -> serialize existing Project response
```

### Recommended Project Structure

```text
apps/api/plane/app/services/
+-- project_creation.py       # shared create flow and transaction boundary
+-- project_template_apply.py # template payload application helpers

apps/api/plane/app/serializers/project.py
  # accept write-only template_id on app ProjectSerializer

apps/api/plane/api/serializers/project.py
  # accept write-only template_id if v1 API create is in scope

apps/api/plane/app/views/project/base.py
  # delegate create to service and keep response shape

apps/api/plane/api/views/project.py
  # delegate create to service if v1 API create is in scope

apps/api/plane/tests/unit/services/
+-- test_project_template_apply.py

apps/api/plane/tests/contract/app/
+-- test_project_template_creation_app.py
```

### Pattern 1: Non-Model `template_id` Input

**What:** Declare `template_id` explicitly as an input-only serializer field, validate empty string as 400, and remove/consume it before `Project.objects.create(...)`. [CITED: https://www.django-rest-framework.org/api-guide/fields/#core-arguments; VERIFIED: apps/api/plane/app/serializers/project.py]
**When to use:** Use on project create serializers so the frontend can send `template_id` without adding a Project model column. [VERIFIED: REQUIREMENTS.md]
**Example:**

```python
# Source basis: DRF write_only field docs and local ProjectSerializer.create
template_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

def validate_template_id(self, value):
    if value == "":
        raise serializers.ValidationError("template_id cannot be blank")
    return value

def create(self, validated_data):
    template_id = validated_data.pop("template_id", None)
    project = Project.objects.create(**validated_data, workspace_id=self.context["workspace_id"])
    ProjectIdentifier.objects.create(name=project.identifier, project=project, workspace_id=self.context["workspace_id"])
    return project
```

### Pattern 2: Atomic Core, Robust Post-Commit Activity

**What:** Wrap database writes in `transaction.atomic()` and register activity dispatch with `transaction.on_commit(..., robust=True)`. [CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/]
**When to use:** Use for both no-template and template branches so partial Project rows do not survive failures and activity enqueue errors do not break committed data. [VERIFIED: 02-CONTEXT.md; VERIFIED: apps/api/plane/api/views/project.py]
**Example:**

```python
# Source basis: apps/api/plane/api/views/project.py
with transaction.atomic():
    project = create_project_core(...)
    apply_default_states_or_template(...)

    def _dispatch_model_activity():
        model_activity.delay(model_name="project", model_id=str(project.id), ...)

    transaction.on_commit(_dispatch_model_activity, robust=True)
```

### Pattern 3: Key Maps During Template Apply

**What:** Build dictionaries from payload keys to newly generated objects after each section is created. [VERIFIED: 02-CONTEXT.md; VERIFIED: apps/api/plane/app/serializers/project_template.py]
**When to use:** Use for `state_key`, `label_keys`, `module_key`, and `cycle_key` resolution before starter issue and join-row creation. [VERIFIED: 02-CONTEXT.md]
**Example:**

```python
# Source basis: Phase 1 payload validator and target through models
state_by_key = {}
for state_payload in payload["states"]:
    state = State(...)
    state_by_key[state_payload["state_key"]] = state

for issue_payload in payload["starter_issues"]:
    state = state_by_key[issue_payload["state_key"]]
    issue = Issue.objects.create(project=project, workspace=workspace, state=state, name=issue_payload["name"])
```

### Anti-Patterns to Avoid

- **Applying templates after returning 201:** This would violate the single-transaction requirement and can leave partial Projects. [VERIFIED: 02-CONTEXT.md]
- **Skipping Phase 1 payload validation because templates were validated at save time:** Phase 2 explicitly requires re-validation before apply. [VERIFIED: 02-CONTEXT.md]
- **Letting `Issue._ensure_default_state()` choose template starter issue states:** Starter issues must pass explicit state resolved from `state_key`. [VERIFIED: 02-CONTEXT.md; VERIFIED: apps/api/plane/db/models/issue.py]
- **Using `.create()` for template states when sequence matters:** `State.save()` overwrites sequence for new states when the project already has states; `bulk_create` avoids that hook. [VERIFIED: apps/api/plane/db/models/state.py]
- **Using `ignore_conflicts=True` for template references:** Reference mistakes should fail hard and roll back, not silently skip join rows. [VERIFIED: 02-CONTEXT.md]

## Don't Hand-Roll

| Problem                     | Don't Build                                  | Use Instead                               | Why                                                                                                                                                                                                               |
| --------------------------- | -------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transaction management      | Manual cleanup/deletes after failure         | `transaction.atomic()`                    | Official Django transaction boundary rolls back DB writes on exceptions. [CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/]                                                                   |
| Post-commit activity safety | Try/except around in-transaction Celery call | `transaction.on_commit(..., robust=True)` | Existing v1 route already uses this to avoid firing on rollback and avoid 500 after commit. [VERIFIED: apps/api/plane/api/views/project.py; CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/] |
| Template payload validation | New ad hoc validator                         | `validate_project_template_payload(...)`  | Phase 1 helper validates schema version, uniqueness, groups, statuses, priorities, dates, and dangling references. [VERIFIED: apps/api/plane/app/serializers/project_template.py]                                 |
| Issue sequence generation   | Manual sequence ID math in template service  | Normal `Issue.objects.create()`           | `Issue.save()` uses project-level advisory lock and creates `IssueSequence`. [VERIFIED: apps/api/plane/db/models/issue.py]                                                                                        |
| Template availability       | Separate queries with distinguishable errors | One generic availability resolver         | D-02 requires identical 404 for missing, inactive, or foreign templates. [VERIFIED: 02-CONTEXT.md]                                                                                                                |

**Key insight:** The hard part is not creating rows; it is preserving existing create semantics while bypassing model hooks only where payload order must win and keeping hooks where Plane depends on them for derived state such as issue sequences. [VERIFIED: apps/api/plane/db/models/state.py; VERIFIED: apps/api/plane/db/models/issue.py]

## Common Pitfalls

### Pitfall 1: Only Updating the App Endpoint

**What goes wrong:** `/api/workspaces/.../projects/` supports templates but `/api/v1/workspaces/.../projects/` remains no-template-only or has different rollback semantics. [VERIFIED: apps/api/plane/app/urls/project.py; VERIFIED: apps/api/plane/api/urls/project.py]
**Why it happens:** The repo has separate app and v1 project create stacks. [VERIFIED: apps/api/plane/app/views/project/base.py; VERIFIED: apps/api/plane/api/views/project.py]
**How to avoid:** Planner should either explicitly scope v1 out or route both through a shared service. [VERIFIED: REQUIREMENTS.md]
**Warning signs:** Tests pass for one URL prefix but fail or omit the other. [VERIFIED: apps/api/plane/tests/contract/app/test_project_app.py; VERIFIED: apps/api/plane/tests/contract/api/test_projects.py]

### Pitfall 2: Activity Task Inside the Atomic Block

**What goes wrong:** Activity can fire for a Project that later rolls back, or broker failure can turn a committed Project into a 500 response. [VERIFIED: apps/api/plane/tests/contract/api/test_projects.py]
**Why it happens:** Direct `model_activity.delay()` is currently used in the app endpoint after writes. [VERIFIED: apps/api/plane/app/views/project/base.py]
**How to avoid:** Use `transaction.on_commit(..., robust=True)` as in the v1 endpoint. [VERIFIED: apps/api/plane/api/views/project.py; CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/]
**Warning signs:** Rollback tests observe `model_activity.delay` called, or broker-dispatch failure returns 500 after persisted data. [VERIFIED: apps/api/plane/tests/contract/api/test_projects.py]

### Pitfall 3: Order Hooks Overwriting Template Order

**What goes wrong:** Template state sequences, label orders, module orders, or cycle orders differ from payload order. [VERIFIED: 02-CONTEXT.md]
**Why it happens:** `State.save()`, `Label.save()`, `Module.save()`, and `Cycle.save()` assign sequence/sort_order on new records. [VERIFIED: apps/api/plane/db/models/state.py; VERIFIED: apps/api/plane/db/models/label.py; VERIFIED: apps/api/plane/db/models/module.py; VERIFIED: apps/api/plane/db/models/cycle.py]
**How to avoid:** Use `bulk_create` with explicit `sequence`/`sort_order` for sections whose payload order must win. [VERIFIED: apps/api/plane/app/views/project/base.py]
**Warning signs:** A template with custom sequence/order values persists as 65535 or hook-derived increments. [VERIFIED: apps/api/plane/db/models/state.py]

### Pitfall 4: Bulk-Creating Issues

**What goes wrong:** Starter issues miss correct `sequence_id`, `IssueSequence`, stripped description, or advisory-lock behavior. [VERIFIED: apps/api/plane/db/models/issue.py]
**Why it happens:** `bulk_create` bypasses `Issue.save()`. [VERIFIED: Django ORM behavior from local code reliance; CITED: https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create]
**How to avoid:** Create starter issues one by one with explicit state and then bulk-create join rows. [VERIFIED: apps/api/plane/db/models/issue.py]
**Warning signs:** `next_work_item_sequence` is wrong after template creation. [VERIFIED: apps/api/plane/app/serializers/project.py]

### Pitfall 5: Silent Reference Skips

**What goes wrong:** A starter issue references a missing label/module/cycle and the Project still commits. [VERIFIED: 02-CONTEXT.md]
**Why it happens:** Existing serializers sometimes catch `IntegrityError` or use `ignore_conflicts=True` for user-driven relation writes. [VERIFIED: apps/api/plane/app/serializers/issue.py; VERIFIED: apps/api/plane/app/serializers/module.py]
**How to avoid:** Template apply should raise `serializers.ValidationError` or a domain exception inside the transaction for any missing key. [VERIFIED: 02-CONTEXT.md]
**Warning signs:** Tests mutate a saved payload to contain a dangling key and still receive 201. [VERIFIED: 02-CONTEXT.md]

## Code Examples

Verified patterns from local and official sources:

### Availability Resolver

```python
# Source basis: apps/api/plane/app/views/workspace/project_template.py and 02-CONTEXT.md
def get_available_template_or_404(template_id, workspace):
    if template_id is None:
        return None
    return ProjectTemplate.objects.filter(
        Q(pk=template_id, is_system=True, is_active=True, workspace__isnull=True)
        | Q(pk=template_id, is_system=False, is_active=True, workspace=workspace)
    ).first()
```

### Relative Date Resolution

```python
# Source basis: 02-CONTEXT.md D-14/D-15 and Cycle/Module date fields
def resolve_dates(section, creation_date):
    start = creation_date + timedelta(days=section.get("start_offset_days") or 0)
    target_offset = section.get("target_offset_days")
    if target_offset is None and section.get("duration_days") is not None:
        target_offset = (section.get("start_offset_days") or 0) + section["duration_days"]
    target = creation_date + timedelta(days=target_offset) if target_offset is not None else None
    return start, target
```

### Template Section Creation Shape

```python
# Source basis: target model fields and Phase 1 payload keys
states = State.objects.bulk_create(
    [
        State(
            name=item["name"],
            color=item["color"],
            group=item["group"],
            sequence=item["sequence"],
            default=item.get("default", False),
            project=project,
            workspace=workspace,
            created_by=user,
            updated_by=user,
        )
        for item in payload["states"]
    ]
)
state_by_key = {payload_item["state_key"]: state for payload_item, state in zip(payload["states"], states)}
```

## State of the Art

| Old Approach                                    | Current Approach                                         | When Changed                          | Impact                                                                                                                                                               |
| ----------------------------------------------- | -------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project create always creates default states    | Optional template branch creates template states instead | Phase 02 requirement                  | Planner must keep no-template branch unchanged and skip `DEFAULT_STATES` only for template branch. [VERIFIED: REQUIREMENTS.md; VERIFIED: 02-CONTEXT.md]              |
| App route enqueues activity directly            | v1 route defers activity with robust `on_commit`         | Existing v1 tests encode this pattern | Planner should align app route with robust post-commit behavior. [VERIFIED: apps/api/plane/app/views/project/base.py; VERIFIED: apps/api/plane/api/views/project.py] |
| Phase 1 validates payload at template save time | Phase 2 re-validates saved payload before applying       | Locked by D-04                        | Planner must add tests for stale/corrupted payload rollback. [VERIFIED: 02-CONTEXT.md]                                                                               |

**Deprecated/outdated:**

- Treating Project creation as several independent saves without an atomic boundary is outdated for this phase; D-05/D-06 require transaction rollback for both template and no-template paths. [VERIFIED: 02-CONTEXT.md]

## Assumptions Log

| #   | Claim                                                                                                                     | Section        | Risk if Wrong                                                                   |
| --- | ------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------- |
| A1  | Phase 02 supports both the app endpoint and the v1/API-key endpoint for Project create behavior. [RESOLVED]               | Open Questions | Planner should wire and test both endpoint surfaces through the shared service. |
| A2  | Generated label/module/cycle fallback `sort_order` uses `10000 + index * 10000` when no explicit value exists. [RESOLVED] | Open Questions | UI ordering is deterministic and consistent across generated content sections.  |

Planner resolved these assumptions during revision iteration 1; execution tasks should treat them as locked research guidance.

## Open Questions (RESOLVED)

1. **Should Phase 02 support the v1 API-key create endpoint or only the app endpoint?**
   - What we know: The phase primary code areas name `apps/api/plane/app/views/project/base.py` and `apps/api/plane/app/serializers/project.py`, but existing rollback tests are under the v1 API path too. [VERIFIED: user prompt; VERIFIED: apps/api/plane/tests/contract/api/test_projects.py]
   - RESOLVED: Phase 02 supports both app endpoint `apps/api/plane/app/views/project/base.py` and v1/API-key endpoint `apps/api/plane/api/views/project.py` for Project create behavior. Plan a shared service and wire both endpoint surfaces. [VERIFIED: apps/api/plane/app/views/project/base.py; VERIFIED: apps/api/plane/api/views/project.py]

2. **Should generated modules/cycles use payload array order or existing hook order when no `order` is present?**
   - What we know: D-10 requires stable initial ordering from payload array order when no explicit sort field exists. [VERIFIED: 02-CONTEXT.md]
   - RESOLVED: Deterministic fallback convention is `sort_order = 10000 + index * 10000` for generated labels, modules, and cycles when payload order is used and no explicit order/sort value exists, using zero-based `index`. Labels use explicit payload `order` when present; otherwise labels use the same fallback. [VERIFIED: apps/api/plane/db/models/label.py; VERIFIED: apps/api/plane/db/models/module.py; VERIFIED: apps/api/plane/db/models/cycle.py]

## Environment Availability

| Dependency                | Required By                                | Available | Version      | Fallback                          |
| ------------------------- | ------------------------------------------ | --------- | ------------ | --------------------------------- |
| Docker CLI/daemon         | Backend pytest stack                       | yes       | 29.6.0       | none                              |
| `docker-compose-test.yml` | Backend pytest stack                       | yes       | file present | none                              |
| `apps/api/.env`           | Backend pytest prerequisite                | yes       | file present | run `./setup.sh`                  |
| Python                    | Local inspection / possible helper scripts | yes       | 3.14.4       | Docker test image                 |
| pnpm                      | Root workspace checks if frontend touched  | yes       | 11.3.0       | not needed for backend-only phase |
| npm                       | Registry/version inspection fallback       | yes       | 9.2.0        | not needed                        |

**Missing dependencies with no fallback:**

- None found. [VERIFIED: shell probe]

**Missing dependencies with fallback:**

- None found. [VERIFIED: shell probe]

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies          | Standard Control                                                                                                                                                                                               |
| --------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | yes              | Existing app session/API-key authentication; do not add custom auth. [VERIFIED: apps/api/plane/tests/conftest.py]                                                                                              |
| V3 Session Management | no direct change | Existing middleware/session stack remains unchanged. [VERIFIED: .planning/codebase/ARCHITECTURE.md]                                                                                                            |
| V4 Access Control     | yes              | Existing Project create permission blocks guests; template availability query hides inactive/foreign templates with generic 404. [VERIFIED: 02-CONTEXT.md; VERIFIED: apps/api/plane/app/views/project/base.py] |
| V5 Input Validation   | yes              | DRF serializers plus `validate_project_template_payload(...)`; reject blank `template_id` and stale payloads. [VERIFIED: apps/api/plane/app/serializers/project_template.py]                                   |
| V6 Cryptography       | no direct change | No new crypto, secret, or token handling. [VERIFIED: phase scope]                                                                                                                                              |

### Known Threat Patterns for Django/DRF Backend

| Pattern                                | STRIDE                 | Standard Mitigation                                                                                                                                                                     |
| -------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template ID probing across workspaces  | Information Disclosure | Generic 404 for missing/inactive/foreign templates. [VERIFIED: 02-CONTEXT.md]                                                                                                           |
| Unauthorized guest project creation    | Elevation of Privilege | Keep existing `[ROLE.ADMIN, ROLE.MEMBER]` create permission. [VERIFIED: apps/api/plane/app/views/project/base.py]                                                                       |
| Stored XSS through Project description | Tampering              | Preserve existing `validate_html_content` validation in Project serializers. [VERIFIED: apps/api/plane/app/serializers/project.py; VERIFIED: apps/api/plane/api/serializers/project.py] |
| Partial data after validation failure  | Tampering / Integrity  | Use `transaction.atomic()` and fail hard on missing payload references. [VERIFIED: 02-CONTEXT.md; CITED: https://docs.djangoproject.com/en/4.2/topics/db/transactions/]                 |

## Sources

### Primary (HIGH confidence)

- `.planning/phases/02-transactional-project-creation/02-CONTEXT.md` - locked decisions and scope. [VERIFIED]
- `.planning/REQUIREMENTS.md` - requirement IDs and success criteria. [VERIFIED]
- `AGENTS.md` - workspace commands and test constraints. [VERIFIED]
- `apps/api/plane/app/views/project/base.py` - app project create flow. [VERIFIED]
- `apps/api/plane/app/serializers/project.py` - app Project serializer and ProjectIdentifier creation. [VERIFIED]
- `apps/api/plane/api/views/project.py` - v1 API transaction/on_commit pattern. [VERIFIED]
- `apps/api/plane/app/serializers/project_template.py` - built-ins and payload validator. [VERIFIED]
- `apps/api/plane/db/models/state.py`, `label.py`, `module.py`, `cycle.py`, `issue.py`, `project.py` - target model fields, hooks, constraints, and through rows. [VERIFIED]
- `apps/api/plane/tests/contract/app/test_project_app.py`, `apps/api/plane/tests/contract/api/test_projects.py`, `apps/api/plane/tests/contract/app/test_project_templates_app.py` - existing contract test patterns. [VERIFIED]

### Secondary (MEDIUM confidence)

- https://docs.djangoproject.com/en/4.2/topics/db/transactions/ - `atomic()` and `on_commit(..., robust=True)`. [CITED]
- https://docs.djangoproject.com/en/4.2/ref/models/querysets/#bulk-create - `bulk_create` caveats. [CITED]
- https://www.django-rest-framework.org/api-guide/fields/#core-arguments - `write_only`, `required`, and `allow_null` serializer field arguments. [CITED]

### Tertiary (LOW confidence)

- None.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - versions and commands verified from repository files. [VERIFIED: apps/api/requirements/base.txt; VERIFIED: apps/api/requirements/test.txt]
- Architecture: HIGH - grounded in existing app/v1 views, serializers, and model hooks. [VERIFIED: codebase grep]
- Pitfalls: HIGH - each pitfall is tied to current code or locked Phase 2 decisions. [VERIFIED: codebase grep; VERIFIED: 02-CONTEXT.md]

**Research date:** 2026-06-30
**Valid until:** 2026-07-30 for local code findings; re-check dependencies if backend package versions change.
