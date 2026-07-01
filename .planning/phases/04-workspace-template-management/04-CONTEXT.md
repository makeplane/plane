# Phase 4: Workspace Template Management - Context

**Gathered:** 2026-07-01
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers a discoverable workspace-settings UI where workspace admins manage custom Project Templates. It adds a "Project Templates" page under workspace settings that lists built-in (read-only) and custom (editable) templates, and provides a structured editor to create, edit, deactivate/reactivate, and duplicate custom templates covering states, labels, modules, cycles, and starter issues.

The backend CRUD API (list / create / PATCH update / DELETE soft-deactivate / duplicate) and the TypeScript template types already exist from Phases 1 and 3. This phase is primarily net-new frontend: settings navigation wiring, list/management screens, the structured template editor, and the frontend service methods that call the existing endpoints.

**One small backend slice is in scope (added during planning research):** the existing list endpoint hard-filters `is_active=True` and the writable-lookup 404s inactive templates, so decisions D-06 ("Show deactivated") and D-07 ("Reactivate") cannot be built frontend-only. This phase therefore adds a minimal backend change to `apps/api` to enable listing and reactivating deactivated **custom workspace** templates (see D-14/D-15), plus backend tests. See [[the-backend-support-for-deactivated-templates]] rationale in D-14/D-15.

This phase does NOT otherwise change backend template semantics, does NOT change the create-Project-modal selector (Phase 3) — its default list behavior must stay active-only — does NOT add template import/export, duplication of existing Projects into templates, version history, or a visual workflow builder — those are out of scope / v2.

</domain>

<decisions>
## Implementation Decisions

### Navigation & Entry Point

- **D-01:** Add a "Project Templates" page to workspace settings in the **Administration** category, alongside Members / Billing / Exports. It is admin-only.
- **D-02:** Sidebar label is **"Project Templates"** (not the shorter "Templates").
- **D-03:** Wire the page through the established 4-touchpoint pattern: route in `apps/web/app/routes/core.ts`, a `WORKSPACE_SETTINGS` entry with `access: [EUserWorkspaceRoles.ADMIN]`, placement in the `ADMINISTRATION` bucket of `GROUPED_WORKSPACE_SETTINGS`, and an icon entry in `WORKSPACE_SETTINGS_ICONS`. The new key literal must be added to the `TWorkspaceSettingsTabs` type.
- **D-04:** Gate the page itself (not just the sidebar) with `useUserPermissions` + `allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE)`, rendering `NotAuthorizedView` for non-admins — matching the webhooks page pattern and the backend's admin-only write permissions.

### List Layout & Provenance

- **D-05:** Distinguish built-in vs custom templates with **two labeled sections on one page**: a "System templates" (built-in, read-only) group and a "Custom templates" (workspace, editable) group. No badges-only flat list, no tabs.
- **D-06:** Deactivated custom templates are **hidden by default**, revealed via a "Show deactivated" filter/toggle. This is where reactivation happens.
- **D-07:** Custom template rows expose **Edit** and **Duplicate** as primary actions, with **Deactivate** in an overflow (⋮) menu. Deactivated custom rows (when revealed) offer **Reactivate** (PATCH `is_active=true`).
- **D-08:** Built-in (system) template rows offer **Duplicate** (creates an editable custom copy) plus a **read-only view/preview**. No edit, no deactivate — built-ins are immutable through the API.

### Editor Surface & Save Model

- **D-09:** The create/edit editor is a **dedicated full-page route** (e.g. `settings/templates/new` and `settings/templates/:id/edit`), deep-linkable, back-navigating to the list. Not a modal or slide-over — 5 structured sections need the width.
- **D-10:** The editor uses an **atomic single save**: one Save submits the whole template (name + description + all 5 sections) as a single payload to the create (POST) or update (PATCH) endpoint. No section-by-section persistence — the backend stores the payload as one validated blob.

### Editor Section Depth

- **D-11:** Each of the 5 sections (states / labels / modules / cycles / starter issues) is an **inline reorderable list** of add/edit/remove rows, with drag-to-reorder where order matters (states, labels), modeled on the existing project-states editor.
- **D-12:** Payload reference keys (`state_key`, `label_key`, `module_key`, `cycle_key`) are **auto-generated and hidden** — slugified from the item name with uniqueness enforced. Admins never see or edit raw keys; they work with names.
- **D-13:** Starter-issue references (state / labels / module / cycle) are **dropdowns populated from the items defined in the sections above**, picked by name and resolved to keys on save — preventing dangling references the backend would reject.

### Backend Support for Deactivated Templates

- **D-14:** Add an opt-in `include_inactive` query parameter to the workspace project-templates **list** endpoint. It defaults to false so the Phase 3 create-modal selector (which calls the same endpoint) keeps returning active templates only. When `true` (used only by the management UI), the response also includes deactivated **custom workspace** templates. Built-in/system templates remain active-only and read-only regardless.
- **D-15:** Add an admin-only, workspace-scoped way to **reactivate** a deactivated custom template (set `is_active=true`). It must reject built-in/system templates and foreign-workspace templates (consistent with the existing writable-lookup 400/404 behavior). A dedicated reactivate action is preferred over loosening the general writable-lookup so the existing edit/deactivate guarantees stay intact. Backend tests must cover include_inactive listing, reactivation, permission enforcement, and that built-ins/foreign templates are rejected.

### Claude's Discretion

- Choose the exact Lucide icon for the settings entry (e.g. `LayoutTemplate`) and the precise route path/segment names, matching existing settings conventions.
- Choose the form library approach for the editor (react-hook-form is preferred per recent labels/webhook code; the project-states manual-`useState` form is an acceptable fallback) and the exact color-picker primitive (`TwitterPicker`-in-`Popover` or `@plane/ui` `ColorPicker`).
- Choose how backend payload-validation errors (unique keys, exactly-one-default-state, `#RRGGBB` colors, enum group/status/priority, resolvable references, `start_offset_days ≤ target_offset_days`) are surfaced inline in the editor — but the editor should prevent the obvious invalid states client-side (e.g. enforce exactly one default state, constrain group/status/priority to enum dropdowns) rather than relying solely on backend rejection.
- Choose exact copy for the deactivate/reactivate confirmation (`AlertModalCore`), empty states (`EmptyStateCompact`), and loading skeletons (`Loader`), consistent with existing i18n patterns.
- Choose whether the duplicate flow prompts for a name inline before opening the editor or opens the editor pre-filled from the copy; the backend `duplicate` endpoint accepts an optional `name` override.
- Choose the read-only built-in "view/preview" presentation (e.g. the same editor route in a disabled/read-only mode vs a lighter preview panel).

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope

- `.planning/ROADMAP.md` — Defines Phase 4 scope, success criteria, requirement ID (UI-05), and primary frontend code areas.
- `.planning/REQUIREMENTS.md` — Defines UI-05 and the surrounding v1 requirements; confirms CRUD, permission, and payload-section expectations.
- `.planning/PROJECT.md` — Project-level intent, constraints (brownfield compatibility, admin-only template management, tech-stack alignment), and key decisions.
- `.planning/phases/01-template-catalog-foundation/01-CONTEXT.md` — Locks the template data model, payload schema, reference-key rules, built-in immutability, soft-deactivate lifecycle, and admin-only write permissions that this UI must respect.
- `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md` — Locks the existing frontend template types, the `getProjectTemplates` service method, and the SWR fetch-key conventions this phase builds on.

### Codebase Maps

- `.planning/codebase/CONVENTIONS.md` — TypeScript, service, MobX, styling, and package conventions.
- `.planning/codebase/STRUCTURE.md` — Monorepo and app/package layout.
- `.planning/codebase/STACK.md` — React, TypeScript, pnpm, Turborepo, and verification commands.
- `.planning/codebase/TESTING.md` — Frontend/package check commands relevant to VER-style type-safety verification.

### Frontend Integration Points (settings navigation)

- `apps/web/app/routes/core.ts` — Workspace settings route registration; add the templates route inside the `(workspace)` settings layout (sibling to `webhooks`, `exports`, `members`, `billing`).
- `packages/constants/src/settings/workspace.ts` — `WORKSPACE_SETTINGS` map (add entry with `access: [EUserWorkspaceRoles.ADMIN]`) and `GROUPED_WORKSPACE_SETTINGS` (`ADMINISTRATION` bucket).
- `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx` — `WORKSPACE_SETTINGS_ICONS` map; add an icon for the new key.
- `apps/web/core/components/settings/workspace/sidebar/item-categories.tsx` — Sidebar renderer that filters by `allowPermissions(item.access, WORKSPACE, slug)`.
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx` + `header.tsx` — Closest end-to-end example of an admin-only workspace settings list+modal page (page gating, `SettingsContentWrapper`, `SettingsHeading`, breadcrumb header).

### Frontend Integration Points (management UI patterns)

- `apps/web/core/components/project-states/` (`root.tsx`, `group-list.tsx`, `state-item.tsx`, `create-update/form.tsx`, `state-delete-modal.tsx`, `options/`) — Best pattern for the states section: grouped, reorderable list with color/name/group/default and per-item overflow actions.
- `apps/web/core/components/labels/` (`project-setting-label-list.tsx`, `create-update-label-inline.tsx`, `delete-label-modal.tsx`, `label-drag-n-drop-HOC.tsx`) — react-hook-form inline CRUD + operations-callback pattern + drag-drop reordering for the labels section.
- `apps/web/core/components/web-hooks/` (`create-webhook-modal.tsx`, `delete-webhook-modal.tsx`, `webhooks-list.tsx`) — Workspace-scoped admin list + modal reference.

### Frontend Contracts & Services

- `packages/types/src/project/project_templates.ts` — Existing template types (`TProjectTemplate`, `TProjectTemplatePayload`, per-section types, `template_type`, `is_system`, `is_active`, offset fields). Reuse; extend only if a write/create payload type is needed.
- `apps/web/core/services/project/project.service.ts` — Currently only `getProjectTemplates(workspaceSlug)`. Add `createProjectTemplate`, `updateProjectTemplate`, `deactivateProjectTemplate` (DELETE), `reactivate` (PATCH `is_active=true`), and `duplicateProjectTemplate` methods hitting the endpoints below.
- `apps/web/ce/components/projects/create/template-select.tsx` — Existing list-fetch example (SWR key `WORKSPACE_PROJECT_TEMPLATES`); mirror service/fetch-key conventions in the management UI.
- `packages/constants/src/fetch-keys.ts` — Fetch-key definitions; add management-list/detail keys as needed.

### Backend API Contract (mostly implemented — small additions per D-14/D-15)

- `apps/api/plane/app/urls/workspace.py` — Endpoints: `GET/POST /api/workspaces/<slug>/project-templates/`, `GET/PATCH/DELETE /api/workspaces/<slug>/project-templates/<pk>/`, `POST /api/workspaces/<slug>/project-templates/<pk>/duplicate/`. **This phase adds** a reactivate route (D-15) and honors `?include_inactive` on the list route (D-14).
- `apps/api/plane/app/views/workspace/project_template.py` — Verb→role→behavior matrix: list (ADMIN+MEMBER, union of active custom + active built-ins), create/update/destroy/duplicate (ADMIN only); DELETE is soft-deactivate (`is_active=False`, 204); built-ins reject mutation with 400/404. **This phase modifies** `get_queryset`/`list` to honor `include_inactive` (default false, D-14) and adds an admin-only reactivate path (D-15), preserving existing active-only defaults and built-in/foreign rejection.
- `apps/api/plane/app/serializers/project_template.py` — `ProjectTemplateSerializer` (read), `ProjectTemplateWriteSerializer` (create/update: `name, description, payload, offset fields`; blocks `is_system`/`system_key`), `ProjectTemplateDuplicateSerializer` (optional `name`), and `validate_project_template_payload` rules the editor must satisfy.
- `apps/api/plane/tests/` — Backend pytest area (Docker `docker-compose-test.yml` flow). Add tests for `include_inactive` listing, reactivation, and permission/rejection behavior (D-15).

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- Settings scaffolding: `SettingsContentWrapper` (`@/components/settings/content-wrapper`), `SettingsHeading` (`@/components/settings/heading`, title/description/control-slot), `SettingsPageHeader` + `Breadcrumbs`/`BreadcrumbLink` for the header bar.
- Permission gating: `useUserPermissions` hook + `allowPermissions`, `EUserPermissions.ADMIN`, `EUserPermissionsLevel.WORKSPACE` (from `@plane/constants`); `EUserWorkspaceRoles.ADMIN` (from `@plane/types`) for the sidebar `access` array.
- Form primitives: `react-hook-form` (`useForm`/`Controller`), `Input`/`TextArea`/`ColorPicker` from `@plane/ui`, `TwitterPicker` (`react-color`) in a `Popover`, `Button` from `@plane/propel/button`.
- List/CRUD primitives: `AlertModalCore` (deactivate/reactivate confirm), `EmptyStateCompact` (`@plane/propel/empty-state`), `Loader`/`Loader.Item` skeletons, `TOAST_TYPE`/`setToast` (`@plane/propel/toast`).
- Reorder primitives: `@plane/ui` `Sortable`/`Draggable`/`DragHandle`, or raw `@atlaskit/pragmatic-drag-and-drop` as used in the labels page.
- Existing template list fetch via SWR with key `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)` calling `projectService.getProjectTemplates`.

### Established Patterns

- New workspace settings page = 4 registration touchpoints (route + `WORKSPACE_SETTINGS` entry + `GROUPED_WORKSPACE_SETTINGS` category + icon) plus a `page.tsx`/`header.tsx` pair under `.../(settings)/settings/(workspace)/<name>/`.
- Two-layer admin gating: role-array `access` on the sidebar entry + `allowPermissions(...)` + `NotAuthorizedView` guard inside the page.
- Frontend API calls go through service classes, never inline fetch/axios.
- The template payload is a single JSON blob validated atomically by the backend; the frontend editor should assemble and submit the whole payload at once.

### Integration Points

- Add frontend service methods for create/update/deactivate/reactivate/duplicate against the existing endpoints.
- Add fetch keys for the management list (and detail if needed); keep them distinct from or reuse the create-modal list key consistently.
- Auto-generate reference keys client-side from names before building the submit payload; resolve starter-issue reference dropdowns to those keys on save.
- Surface backend validation errors inline; enforce the deterministic rules (one default state, enum-constrained selects, hex colors) client-side to minimize round-trip failures.

</code_context>

<specifics>
## Specific Ideas

- Built-in templates are read-only in this UI; the primary way to customize them is "Duplicate → edit the custom copy," matching the Phase 1 immutability decision.
- Deactivation is deliberately a secondary (overflow) action so the prominent custom-row actions stay Edit and Duplicate; deactivated templates remain recoverable via the "Show deactivated" filter and Reactivate.
- Admins should work entirely in terms of human names (state name, label name); the stable `*_key` identifiers required by the payload are an implementation detail generated behind the scenes.
- The editor should feel like the existing project-states/labels management screens so admins recognize the interaction model.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 4 scope. (Duplicating an existing Project into a template, import/export, version history, and a visual workflow builder remain explicitly v2 / out of scope per REQUIREMENTS.md.)

</deferred>

---

_Phase: 4-Workspace Template Management_
_Context gathered: 2026-07-01_
