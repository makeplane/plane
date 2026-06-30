# Phase 3: Create Modal Template Selection - Context

**Gathered:** 2026-06-30
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the frontend Project Template selector inside the existing Workspace create Project modal. Users who can create Projects can list available active built-in and workspace custom templates, search/select one, see a lightweight summary before submit, clear back to no-template, and submit the selected `template_id` with the existing Project creation request.

This phase does not build workspace template management UI, does not edit custom templates, does not change backend template application semantics, and does not change the existing post-create feature-selection flow.

</domain>

<decisions>
## Implementation Decisions

### Selector Placement And Shape

- **D-01:** Keep the template selector as a compact button on the create Project header cover, using the existing `ProjectTemplateSelect` stub location in the top-left cover area.
- **D-02:** The compact button should use an icon plus text. Before selection it displays `Template`; after selection it displays the selected template name truncated as needed.
- **D-03:** The selector opens a simple searchable dropdown. Prefer reusing existing Plane dropdown/search-select patterns rather than introducing a large custom panel.
- **D-04:** Mobile should keep the same compact cover button pattern. The dropdown/popover must fit the viewport rather than moving the selector into a separate mobile-only form location.

### Template Preview Before Selection

- **D-05:** Each template option should show the template `name` and short `description` only. Do not show detailed states, labels, modules, cycles, or starter issue previews in the main dropdown.
- **D-06:** For Phase 3, `description` is the useful template summary for CAT-06. Counts are not required in this phase.
- **D-07:** Do not visually distinguish built-in and custom templates with badges or group headers in the create flow. Keep the option focused on name and description.
- **D-08:** If a template has no description, show only the template name. Do not add fallback copy such as `No description`.

### Selected Template State And Clearing

- **D-09:** After selection, show the chosen template state by changing the compact cover button label to the truncated selected template name. Do not add a separate form line or modal banner.
- **D-10:** Include a `No template` option in the dropdown. Selecting it clears the template selection and returns the create flow to the no-template path.
- **D-11:** Do not warn when the user changes templates before submit. Template selection affects only submit-time Project creation and does not mutate any data before submit.
- **D-12:** Each newly opened create Project modal resets to no-template. Do not persist the prior modal's template selection across close/open cycles.

### Loading, Empty, And Error Fallbacks

- **D-13:** While templates are loading, keep the selector clickable and show `Loading...` inside the dropdown. If the user submits with no selected template while loading, create a no-template Project.
- **D-14:** If the template list is empty, keep the dropdown available with `No template` plus light empty text such as `No templates available`.
- **D-15:** If the list API fails, show an inline dropdown error such as `Could not load templates`, do not show a toast, and keep `No template` available.
- **D-16:** Include a small `Retry` action in the dropdown error state.
- **D-17:** Loading, empty, and error states must not block no-template Project creation.

### Form Payload And `templateId` Prop

- **D-18:** Ignore the existing `templateId` prop in Phase 3. The modal opens in no-template state and users select templates manually.
- **D-19:** When no template is selected, omit `template_id` from the create Project payload rather than sending `null`.
- **D-20:** Keep template selection as local state in `CreateProjectForm`. Do not add transient selector state to the MobX Project store.
- **D-21:** On submit, merge `template_id` into the create payload only when a template is selected.
- **D-22:** After successful creation from a template, keep the existing success toast and transition to the existing feature-selection step. Do not change post-create UI copy or skip feature selection in this phase.

### the agent's Discretion

- Choose exact icon, dropdown primitive, and layout classes that best match existing Plane UI conventions.
- Choose whether the frontend template list is fetched by a small dedicated service/hook or a lightweight store addition, as long as selector state remains local to the create Project form and the API call goes through existing service-layer patterns.
- Choose exact type names for Project Template frontend contracts in `packages/types/src/`, as long as backend serializer fields are represented accurately enough for the selector.
- Choose exact copy for inline loading, empty, error, and retry states, keeping it concise and consistent with existing i18n patterns.

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Planning Scope

- `.planning/ROADMAP.md` - Defines Phase 3 scope, success criteria, requirement IDs, and primary frontend code areas.
- `.planning/REQUIREMENTS.md` - Defines CAT-01, CAT-06, PERM-02, UI-01..UI-04, and VER-05.
- `.planning/PROJECT.md` - Captures project-level intent and the requirement to keep template choice inside the existing create Project modal.
- `.planning/phases/01-template-catalog-foundation/01-CONTEXT.md` - Locks catalog, built-in/custom, permission, and payload-shape decisions consumed by the frontend selector.
- `.planning/phases/02-transactional-project-creation/02-CONTEXT.md` - Locks backend `template_id` semantics and no-template behavior consumed by the frontend submit flow.

### Codebase Maps

- `.planning/codebase/CONVENTIONS.md` - TypeScript, service, MobX, styling, and package conventions.
- `.planning/codebase/STRUCTURE.md` - Monorepo and app/package layout.
- `.planning/codebase/STACK.md` - React, TypeScript, pnpm, Turborepo, and verification commands.

### Frontend Integration Points

- `apps/web/ce/components/projects/create/template-select.tsx` - Existing empty selector stub to implement.
- `apps/web/ce/components/projects/create/root.tsx` - Create Project form owner where local template selection state should live.
- `apps/web/core/components/project/create/header.tsx` - Existing cover/header location where `ProjectTemplateSelect` is rendered.
- `apps/web/core/components/project/create-project-modal.tsx` - Modal lifecycle and existing `templateId` prop, which Phase 3 should ignore.
- `apps/web/core/services/project/project.service.ts` - Existing create Project service call that should accept a payload including optional `template_id`.
- `apps/web/core/store/project/project.store.ts` - Existing Project store create flow; do not store transient template selection here.
- `packages/types/src/project/projects.ts` - Existing Project types that may need a create-payload type extension for optional `template_id`.

### Backend API Contract

- `apps/api/plane/app/urls/workspace.py` - Workspace template catalog endpoint: `/api/workspaces/<slug>/project-templates/`.
- `apps/api/plane/app/views/workspace/project_template.py` - List endpoint combines active global built-ins and active workspace custom templates for admin/member callers.
- `apps/api/plane/app/serializers/project_template.py` - Read serializer fields available to the frontend, including `id`, `name`, `description`, `template_type`, `is_system`, `payload`, and relative date metadata.

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `ProjectTemplateSelect` is already imported into `ProjectCreateHeader` and rendered at the top-left of the cover. It is currently a no-op stub and is the natural implementation target.
- `ProjectCreateHeader` already accepts `handleTemplateSelect`, but `CreateProjectForm` does not currently pass or use it. The selector can be wired through this existing header extension point or by passing richer selector props.
- `CreateProjectForm` owns the create form and `onSubmit`; it is the right place for local selected-template state and for merging optional `template_id` into the submit payload.
- `ProjectService.createProject` posts to `/api/workspaces/${workspaceSlug}/projects/`; Phase 2 backend already accepts optional `template_id`.
- `CustomSearchSelect` and `CustomSelect` in `@plane/ui` provide existing dropdown/search-select patterns with loading/no-results affordances that can guide the selector implementation.
- `ProjectSelect` in analytics shows an existing app-level example of using `CustomSearchSelect` with a custom button and mapped options.

### Established Patterns

- Frontend API calls should go through service classes rather than inline fetch/Axios calls.
- User-facing form state can stay local when it only affects a modal submission and does not need cross-app persistence.
- Plane UI favors compact dropdown/popover controls for filter-like selections and uses Tailwind utility classes plus shared `cn` helpers.
- Public UI copy should use existing i18n conventions where feasible.

### Integration Points

- Add or expose frontend Project Template types in `packages/types/src/`.
- Add a frontend service method for the workspace project-template list endpoint.
- Wire a template-list loading/error/retry flow into the create modal selector without blocking no-template submission.
- Extend the Project create payload type or submit cast so `template_id` is included only when selected.
- Keep existing create success handling, favorite handling, cover-image handling, and feature-selection step intact.

</code_context>

<specifics>
## Specific Ideas

- The create modal should feel unchanged for users who do not use templates: they can ignore the selector and create a Project normally.
- `No template` is an explicit dropdown option, not a separate close or clear icon on the cover button.
- Built-in/custom provenance is intentionally hidden in this create flow; the user's decision should be based on template name and description.

</specifics>

<deferred>
## Deferred Ideas

None - discussion stayed within Phase 3 scope.

</deferred>

---

_Phase: 3-Create Modal Template Selection_
_Context gathered: 2026-06-30_
