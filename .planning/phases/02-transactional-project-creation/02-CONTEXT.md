# Phase 2: Transactional Project Creation - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers backend Project creation from a selected Project Template while preserving the existing no-template Project creation behavior. It extends the existing workspace Project create API to accept an optional `template_id`, validates that template against the workspace catalog, and applies template states, labels, modules, cycles, and starter issues inside an all-or-nothing backend transaction. This phase does not build the frontend template selector or workspace template management UI.

</domain>

<decisions>
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

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope

- `.planning/ROADMAP.md` - Defines Phase 2 scope, success criteria, requirement IDs, and primary backend code areas.
- `.planning/REQUIREMENTS.md` - Defines v1 requirements, especially CAT-02, CREATE-01..CREATE-06, GEN-01..GEN-07, and VER-01..VER-04.
- `.planning/PROJECT.md` - Captures project-level intent, constraints, and the requirement to preserve no-template Project creation.
- `.planning/phases/01-template-catalog-foundation/01-CONTEXT.md` - Locks Phase 1 template payload, reference-key, built-in/custom catalog, and permission decisions that Phase 2 consumes.

### Codebase Context

- `.planning/codebase/STACK.md` - Backend stack, Docker pytest flow, and monorepo constraints.
- `.planning/codebase/ARCHITECTURE.md` - Django API architecture, model/serializer/view boundaries, and shared package boundaries.
- `.planning/codebase/INTEGRATIONS.md` - Database, transaction, infrastructure, and test stack context relevant to backend creation behavior.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `apps/api/plane/app/views/project/base.py` - Existing workspace Project create endpoint. It currently validates `ProjectSerializer`, creates project memberships, creates `DEFAULT_STATES`, schedules activity, and returns `ProjectListSerializer`.
- `apps/api/plane/app/serializers/project.py` - Existing `ProjectSerializer` creates the Project and `ProjectIdentifier`.
- `apps/api/plane/app/serializers/project_template.py` - Phase 1 payload fixtures and `validate_project_template_payload(...)` should be reused before template application.
- `apps/api/plane/db/models/project_template.py` - Template catalog model with built-in/global and custom/workspace scope fields.
- `apps/api/plane/db/models/state.py`, `label.py`, `module.py`, `cycle.py`, and `issue.py` - Target generated content models for template application.
- `apps/api/plane/tests/` - Backend pytest area for unit and contract tests covering project creation, template application, and rollback.

### Established Patterns

- Project creation is a Django/DRF view and serializer flow; Phase 2 should stay in the backend API layer.
- Phase 1 already validates template payload structure and stable reference keys. Phase 2 should consume those keys rather than inventing name-based matching.
- `State.objects.bulk_create(...)` is already used in Project creation to avoid per-state save hooks. Similar care is needed where model save hooks would otherwise assign ordering.
- `Issue.save()` assigns sequence IDs under an atomic block and calls `_ensure_default_state` when state is missing. Template starter issues must pass explicit state values.
- API tests run through the Docker test stack described in project instructions and `apps/api/tests/RUNNING_TESTS.md`.

### Integration Points

- The Project create endpoint should accept optional `template_id` alongside existing Project fields.
- Template availability must be checked against global active built-ins plus active custom templates for the current workspace.
- Generated labels, modules, cycles, starter issues, and join rows must be created inside the same transaction as the Project creation.
- The no-template path must still create the existing default project structure and existing success response.

</code_context>

<specifics>
## Specific Ideas

- Template-created Projects should not contain duplicated default states.
- Invalid template IDs should use one generic not-found response for missing, inactive, and foreign-workspace cases.
- Starter issues should start unassigned in v1.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within phase scope.

</deferred>

---

_Phase: 2-Transactional Project Creation_
_Context gathered: 2026-06-30_
