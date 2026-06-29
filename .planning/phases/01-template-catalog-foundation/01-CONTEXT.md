# Phase 1: Template Catalog Foundation - Context

**Gathered:** 2026-06-29
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the backend catalog foundation for Project Templates: data model, API surface, payload validation, built-in template availability, custom workspace template lifecycle, and workspace-level permissions. It does not apply templates during project creation and does not build frontend template selection or template management UI.

</domain>

<decisions>
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

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope
- `.planning/ROADMAP.md` — Defines Phase 1 scope, success criteria, requirement IDs, and primary backend code areas.
- `.planning/REQUIREMENTS.md` — Defines v1 requirements and out-of-scope template capabilities.
- `.planning/PROJECT.md` — Captures project-level intent for Plane Project Templates.

### Codebase Context
- `.planning/codebase/STACK.md` — Backend/frontend stack and required commands.
- `.planning/codebase/ARCHITECTURE.md` — Django API architecture, model/serializer/view boundaries, and frontend/backend package boundaries.
- `.planning/codebase/INTEGRATIONS.md` — Database, API, and test infrastructure context relevant to backend catalog work.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/api/plane/db/models/` — Existing domain model location for new Project Template models.
- `apps/api/plane/app/serializers/` — Existing DRF serializer location for validation and API representation.
- `apps/api/plane/app/views/` — Existing API view location for workspace-scoped template catalog endpoints.
- `apps/api/plane/app/permissions/` — Existing permission layer to reuse for admin/member/guest checks.
- `apps/api/plane/tests/` — Existing backend test area for catalog API, validation, and permission coverage.

### Established Patterns
- Backend changes should follow Django/DRF model, serializer, view, URL, and permission boundaries already used by Plane.
- API tests run through the Docker test stack described in project instructions, not through pnpm.
- Built-in and custom templates should be represented through one list path so frontend work in later phases can consume one catalog API.

### Integration Points
- Phase 1 should expose catalog and custom-template management APIs, but it should not modify project creation behavior yet.
- Phase 2 will consume the validated template payload and apply it transactionally during project creation.
- Phase 3 will consume the list API from the existing project create modal.

</code_context>

<specifics>
## Specific Ideas

- Required built-ins for v1 are `Software Project`, `Marketing Campaign`, and `Operations Project`.
- Custom templates are workspace-scoped and admin-managed.
- Built-ins are stable, global, read-only system records that admins can copy into custom templates.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 1-Template Catalog Foundation*
*Context gathered: 2026-06-29*
