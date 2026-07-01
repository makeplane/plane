# Phase 03: Create Modal Template Selection - Research

**Researched:** 2026-07-01
**Domain:** Plane web create Project modal, React/TypeScript dropdown UX, service-layer template catalog fetch
**Confidence:** HIGH for codebase integration, MEDIUM for external docs because Context7 was unavailable and official web docs were used.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

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

### Deferred Ideas (OUT OF SCOPE)

## Deferred Ideas

None - discussion stayed within Phase 3 scope.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID      | Description                                                                                                 | Research Support                                                                                                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAT-01  | Workspace project creation shows available Project Templates inside the existing create Project modal/form. | Implement `ProjectTemplateSelect` in the header location already rendered by `ProjectCreateHeader`. [VERIFIED: codebase grep]                                                                                  |
| CAT-06  | User can see a useful summary of a template before selecting it, including counts or descriptions.          | Show only `name` and optional `description`; Phase 3 decisions make description sufficient and defer counts. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]                   |
| PERM-02 | Workspace members who can create Projects can list and select available templates when creating a Project.  | Backend list endpoint allows workspace admin and member roles, and the selector should call that endpoint through `ProjectService`. [VERIFIED: `apps/api/plane/app/views/workspace/project_template.py`]       |
| UI-01   | The existing `ProjectTemplateSelect` UI is implemented in the create Project header area.                   | Stub exists at `apps/web/ce/components/projects/create/template-select.tsx` and is rendered in `ProjectCreateHeader` top-left cover area. [VERIFIED: codebase grep]                                            |
| UI-02   | Selecting a template updates create Project form state and sends selected `template_id`.                    | `CreateProjectForm` owns `onSubmit`; local selected template state can be merged into the create payload before `createProject`. [VERIFIED: codebase grep]                                                     |
| UI-03   | The selected template is visually clear before submit.                                                      | Button label changes from `Template` to selected template name per UI contract. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md`]                                                |
| UI-04   | Template loading, empty, and error states are handled without blocking no-template Project creation.        | Dropdown must keep `No template` available and submit must omit `template_id` unless selection exists. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]                         |
| VER-05  | Frontend checks cover type safety for template types, services, and create Project form payload changes.    | Use targeted `pnpm turbo run check:types --filter=@plane/types --filter=web` or package-local checks; no frontend test framework is configured for `apps/web`. [VERIFIED: package manifests and codebase scan] |

</phase_requirements>

## Summary

Phase 03 is a frontend integration slice, not a new backend capability: Phase 01 already exposes `/api/workspaces/<slug>/project-templates/`, and Phase 02 already accepts optional `template_id` on Project creation. [VERIFIED: `apps/api/plane/app/urls/workspace.py`; VERIFIED: `apps/api/plane/app/serializers/project.py`] The planner should keep work scoped to frontend types, service method, selector UI, local form state, and type verification. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]

The most compatible implementation is to keep `selectedTemplate` state inside `CreateProjectForm`, fetch available templates through `ProjectService`, pass selector props through `ProjectCreateHeader`, and merge `{ template_id: selectedTemplate.id }` only when a template is selected. [VERIFIED: codebase grep] This preserves the existing no-template modal flow, success toast, cover upload behavior, favorite behavior, and feature-selection step. [VERIFIED: `apps/web/ce/components/projects/create/root.tsx`; VERIFIED: `apps/web/core/components/project/create-project-modal.tsx`]

**Primary recommendation:** build a small Plane-style searchable Combobox selector in `ProjectTemplateSelect`, backed by `ProjectService.getProjectTemplates(workspaceSlug)`, with local `selectedTemplate` state in `CreateProjectForm` and no new external dependencies. [VERIFIED: codebase grep; CITED: https://headlessui.com/react/combobox]

## Project Constraints (from AGENTS.md)

- Use `pnpm dev`, `pnpm build`, `pnpm check`, `pnpm check:lint`, `pnpm check:types`, `pnpm fix`, and `pnpm turbo run <command> --filter=<package>` for frontend validation. [VERIFIED: `AGENTS.md`]
- Internal package imports use `workspace:*`; external dependencies use `catalog:`. [VERIFIED: `AGENTS.md`; VERIFIED: `pnpm-workspace.yaml`]
- TypeScript strict mode is expected; all changed files must remain typed. [VERIFIED: `AGENTS.md`; VERIFIED: package `check:types` scripts]
- Formatting is OxFmt and linting is OxLint; use `pnpm fix:format`/`pnpm fix` when needed. [VERIFIED: `AGENTS.md`]
- State management uses MobX stores in shared state, but Phase 03 decisions forbid adding transient selector state to the Project store. [VERIFIED: `AGENTS.md`; VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
- All features require tests per project guidance, but this repo’s web app currently relies mainly on lint/type/build checks and has no visible `apps/web` test script. [VERIFIED: `AGENTS.md`; VERIFIED: package manifest scan]
- Components should use `@plane/ui` and Storybook when shared UI is added; this phase should keep the selector in the existing CE create component unless a reusable primitive is truly needed. [VERIFIED: `AGENTS.md`; VERIFIED: codebase grep]

## Architectural Responsibility Map

| Capability                      | Primary Tier     | Secondary Tier        | Rationale                                                                                                                                                                                                                |
| ------------------------------- | ---------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Render selector in create modal | Browser / Client | Frontend app services | Header and selector are React components under `apps/web`; fetching goes through `ProjectService`. [VERIFIED: codebase grep]                                                                                             |
| Template catalog authorization  | API / Backend    | Browser / Client      | Backend `WorkspaceProjectTemplateViewSet.list` enforces admin/member access; frontend should not duplicate permission logic beyond handling errors. [VERIFIED: `apps/api/plane/app/views/workspace/project_template.py`] |
| Selected template state         | Browser / Client | —                     | User decision is transient until submit and must reset per modal open. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]                                                                   |
| Submit payload                  | Browser / Client | API / Backend         | Client adds optional `template_id`; backend serializer validates UUID/null and service applies template. [VERIFIED: `apps/api/plane/app/serializers/project.py`]                                                         |
| Template application            | API / Backend    | Database / Storage    | Already handled transactionally by Phase 02 and out of scope for this phase. [VERIFIED: `.planning/phases/02-transactional-project-creation/02-CONTEXT.md`]                                                              |

## Standard Stack

### Core

| Library             | Version                                                                      | Purpose                                                                                                | Why Standard                                                                                                                                                                               |
| ------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@plane/ui`         | `workspace:*`                                                                | Existing dropdown/select primitives such as `CustomSearchSelect`, `CustomSelect`, and `ComboDropDown`. | Plane UI primitives already implement Headless UI + Popper patterns and shared Tailwind token styling. [VERIFIED: codebase grep]                                                           |
| `@headlessui/react` | repo catalog `^1.7.19`; installed family latest `2.2.10` modified 2026-04-13 | Accessible Combobox behavior under Plane dropdowns.                                                    | Official docs define Combobox composition for searchable custom selects; Plane already depends on it. [VERIFIED: npm registry; CITED: https://headlessui.com/react/combobox]               |
| `react-hook-form`   | repo catalog `7.51.5`; registry latest `7.80.0` modified 2026-06-20          | Existing create Project form state and `handleSubmit`.                                                 | `CreateProjectForm` already uses `useForm`/`FormProvider`; local state can be merged in `onSubmit`. [VERIFIED: npm registry; CITED: https://react-hook-form.com/docs/useform/handlesubmit] |
| `swr`               | repo catalog `2.2.4`; registry latest `2.4.2` modified 2026-06-22            | Component-local template catalog fetch with `data`, `error`, `isLoading`, and `mutate` retry.          | `apps/web` is already wrapped in `SWRConfig`, and workspace/project wrappers use SWR for service-backed fetches. [VERIFIED: npm registry; CITED: https://swr.vercel.app/docs/api]          |
| `@plane/types`      | `workspace:*`                                                                | Shared `TProjectTemplate` and create payload typing.                                                   | Existing shared domain types live under `packages/types/src/project/` and are exported via `packages/types/src/project/index.ts`. [VERIFIED: codebase grep]                                |

### Supporting

| Library               | Version                                                              | Purpose                                                    | When to Use                                                                                                                                               |
| --------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `react-popper`        | repo catalog `^2.3.0`; registry latest `2.3.0` modified 2022-06-26   | Dropdown positioning when using a local Combobox pattern.  | Use if `CustomSearchSelect` cannot support pinned `No template` plus inline error/retry cleanly. [VERIFIED: npm registry; VERIFIED: codebase grep]        |
| `@popperjs/core`      | repo catalog `^2.11.8`; registry latest `2.11.8` modified 2023-05-26 | Popper engine used by `react-popper`.                      | Existing Plane dropdowns depend on Popper for placement and overflow prevention. [VERIFIED: npm registry; VERIFIED: codebase grep]                        |
| `@plane/propel/icons` | `workspace:*`                                                        | `ProjectIcon`, `ChevronDownIcon`, and `SearchIcon`.        | UI spec requires Plane icon library rather than adding another icon path. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md`] |
| `@plane/i18n`         | `workspace:*`                                                        | Translation helper for copy where keys exist or are added. | Existing create modal uses `useTranslation`; keep user-facing copy consistent. [VERIFIED: codebase grep]                                                  |

### Alternatives Considered

| Instead of                         | Could Use                                                 | Tradeoff                                                                                                                                                                                                                |
| ---------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CustomSearchSelect`               | Small local Headless UI Combobox in `template-select.tsx` | Local Combobox gives pinned `No template`, custom option layout, and inline retry without changing shared UI; reuse Plane dropdown classes either way. [VERIFIED: codebase grep]                                        |
| Component-local SWR fetch          | MobX Project store addition                               | Store addition would persist catalog state, but locked decisions say selector state stays local and no cross-app persistence is needed. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`] |
| Add new third-party select package | Existing Plane UI/Headless UI                             | New package is unnecessary because Plane already has dropdown primitives and this phase allows no third-party UI registry code. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md`]         |

**Installation:**

```bash
# No new packages. Use existing workspace/catalog dependencies.
pnpm install
```

**Version verification:** `npm view` was run for `@headlessui/react`, `react-hook-form`, `swr`, `react-popper`, `@popperjs/core`, and `typescript`; no recommended package has a `postinstall` script. [VERIFIED: npm registry]

## Package Legitimacy Audit

This phase should not install external packages. Existing catalog packages were checked only because they are part of the recommended stack. [VERIFIED: `pnpm-workspace.yaml`; VERIFIED: npm registry]

| Package             | Registry | Age                | Downloads      | Source Repo                                | Verdict                        | Disposition                                                                      |
| ------------------- | -------- | ------------------ | -------------- | ------------------------------------------ | ------------------------------ | -------------------------------------------------------------------------------- |
| `@headlessui/react` | npm      | created 2020-09-24 | 6,305,165/wk   | github.com/tailwindlabs/headlessui         | OK                             | Existing dependency, approved. [VERIFIED: npm registry]                          |
| `react-hook-form`   | npm      | created 2019-03-20 | 54,885,082/wk  | github.com/react-hook-form/react-hook-form | SUS by seam due latest too-new | Existing dependency only; do not upgrade in this phase. [VERIFIED: npm registry] |
| `swr`               | npm      | created 2018-04-06 | 12,345,771/wk  | github.com/vercel/swr                      | SUS by seam due latest too-new | Existing dependency only; do not upgrade in this phase. [VERIFIED: npm registry] |
| `react-popper`      | npm      | created 2016-10-07 | 5,588,518/wk   | github.com/popperjs/react-popper           | OK                             | Existing dependency, approved. [VERIFIED: npm registry]                          |
| `@popperjs/core`    | npm      | created 2019-11-22 | 22,341,880/wk  | github.com/popperjs/popper-core            | OK                             | Existing dependency, approved. [VERIFIED: npm registry]                          |
| `typescript`        | npm      | created 2012-10-01 | 217,486,890/wk | github.com/microsoft/TypeScript            | OK                             | Existing dependency, approved. [VERIFIED: npm registry]                          |

**Packages removed due to [SLOP] verdict:** none.
**Packages flagged as suspicious [SUS]:** `react-hook-form`, `swr` only by latest-release age; they are already in the repo catalog and should not be installed or upgraded in this phase. [VERIFIED: npm registry]

## Architecture Patterns

### System Architecture Diagram

```text
User opens create Project modal
  -> CreateProjectModal resets step to CREATE_PROJECT on isOpen
  -> CreateProjectForm initializes RHF defaults and selectedTemplate = null
  -> ProjectCreateHeader renders ProjectTemplateSelect in cover header
  -> ProjectTemplateSelect opens searchable dropdown
      -> useSWR calls ProjectService.getProjectTemplates(workspaceSlug)
      -> GET /api/workspaces/{slug}/project-templates/
      -> API returns active built-ins + active workspace custom templates for admin/member
  -> User selects template or No template
      -> selectedTemplate updates local CreateProjectForm state
      -> button label reflects selected name or Template
  -> User submits create form
      -> formData normalized as before
      -> if selectedTemplate exists, payload includes template_id
      -> otherwise payload omits template_id
      -> ProjectStore.createProject -> ProjectService.createProject
      -> POST /api/workspaces/{slug}/projects/
      -> existing success toast + feature-selection step
```

### Recommended Project Structure

```text
apps/web/ce/components/projects/create/
├── root.tsx              # Own local selectedTemplate state and submit payload merge
├── template-select.tsx   # Implement compact searchable selector
└── utils.ts              # Leave existing form defaults unchanged unless payload typing needs a helper

apps/web/core/components/project/create/
└── header.tsx            # Pass selector props through existing header slot

apps/web/core/services/project/
├── project.service.ts    # Add getProjectTemplates and typed create payload
└── index.ts              # Existing export already re-exports project.service

packages/types/src/project/
├── projects.ts           # Add create payload type or importable extension
├── project_templates.ts  # Optional focused template catalog type file
└── index.ts              # Export new template type file if created

packages/constants/src/
└── fetch-keys.ts         # Add WORKSPACE_PROJECT_TEMPLATES key for SWR consistency
```

### Pattern 1: Local Submit-Time Payload Extension

**What:** Store selected template in React state beside the form, not as a persisted MobX field or hidden form input. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
**When to use:** Use when the selected value only affects the one create request and resets with the modal. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
**Example:**

```typescript
// Source: apps/web/ce/components/projects/create/root.tsx + React Hook Form docs
const [selectedTemplate, setSelectedTemplate] = useState<TProjectTemplate | null>(null);

const onSubmit = async (formData: Partial<TProject>) => {
  const payload: TProjectCreatePayload = {
    ...formData,
    ...(selectedTemplate ? { template_id: selectedTemplate.id } : {}),
  };

  return createProject(workspaceSlug.toString(), payload);
};
```

### Pattern 2: Service-Layer Catalog Fetch

**What:** Add a `ProjectService.getProjectTemplates(workspaceSlug)` method that wraps `GET /api/workspaces/${workspaceSlug}/project-templates/`. [VERIFIED: `apps/web/core/services/project/project.service.ts`; VERIFIED: `apps/api/plane/app/urls/workspace.py`]
**When to use:** Use from `ProjectTemplateSelect` through SWR so loading/error/retry state stays local. [CITED: https://swr.vercel.app/docs/api]
**Example:**

```typescript
// Source: existing ProjectService method shape in apps/web/core/services/project/project.service.ts
async getProjectTemplates(workspaceSlug: string): Promise<TProjectTemplate[]> {
  return this.get(`/api/workspaces/${workspaceSlug}/project-templates/`)
    .then((response) => response?.data)
    .catch((error) => {
      throw error?.response?.data;
    });
}
```

### Pattern 3: Plane Combobox Button + Search + Options

**What:** Use existing `CustomSearchSelect` if it can express the required option/state slots; otherwise implement a local Headless UI Combobox that mirrors `ProjectDropdownBase` and `CustomSearchSelect`. [VERIFIED: `packages/ui/src/dropdowns/custom-search-select.tsx`; VERIFIED: `apps/web/core/components/dropdowns/project/base.tsx`]
**When to use:** Use local Combobox if planner needs pinned `No template`, no selected checkmark, custom loading/error rows, and inline retry. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md`]
**Example:**

```typescript
// Source: Headless UI Combobox docs and Plane ProjectDropdownBase pattern
<Combobox value={selectedTemplate?.id ?? null} onChange={handleChange}>
  <Combobox.Button as={Fragment}>
    <button type="button" aria-label={ariaLabel}>{buttonContent}</button>
  </Combobox.Button>
  <Combobox.Options static>
    <Combobox.Input value={query} onChange={(event) => setQuery(event.target.value)} />
    <Combobox.Option value={null}>No template</Combobox.Option>
    {filteredTemplates.map((template) => (
      <Combobox.Option key={template.id} value={template.id}>
        {template.name}
      </Combobox.Option>
    ))}
  </Combobox.Options>
</Combobox>
```

### Anti-Patterns to Avoid

- **Persisting selector state in MobX:** It contradicts D-20 and risks carrying a stale selection across modal sessions. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
- **Sending `template_id: null`:** Backend allows null, but D-19 requires omission when no template is selected. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`; VERIFIED: `apps/api/plane/app/serializers/project.py`]
- **Adding template details/counts in dropdown:** Phase 3 limits summary to name and description, even though backend exposes full payload. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`; VERIFIED: `apps/api/plane/app/serializers/project_template.py`]
- **Showing built-in/custom badges:** D-07 and UI spec forbid provenance labels in this flow. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
- **Blocking submit on template-list failure:** D-17 requires no-template Project creation to remain available. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]

## Don't Hand-Roll

| Problem                               | Don't Build                                           | Use Instead                                              | Why                                                                                                                                                                                                                       |
| ------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accessible searchable select behavior | Custom keyboard/focus management from scratch         | Plane `CustomSearchSelect` or local Headless UI Combobox | Combobox already handles common keyboard/select semantics. [CITED: https://headlessui.com/react/combobox]                                                                                                                 |
| API transport                         | Inline `fetch`/Axios in component                     | `ProjectService` method                                  | Existing web services centralize API base URL and error shape. [VERIFIED: codebase grep]                                                                                                                                  |
| Global selector store                 | New MobX observable for selected template             | React local state in `CreateProjectForm`                 | Selection is modal-local and must reset per open. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]                                                                                         |
| Backend template availability logic   | Frontend filtering by role/template type              | Backend list endpoint                                    | Backend already returns only active built-ins plus active workspace custom templates for admin/member callers. [VERIFIED: `apps/api/plane/app/views/workspace/project_template.py`]                                       |
| Payload validation                    | Client-side UUID/template validation beyond selection | Backend serializer/service                               | Backend already validates `template_id` and maps unavailable templates generically. [VERIFIED: `apps/api/plane/app/serializers/project.py`; VERIFIED: `.planning/phases/02-transactional-project-creation/02-CONTEXT.md`] |

**Key insight:** the planner should treat this as a connector between already-built backend seams and existing Plane UI patterns, not as a template engine, permissions system, or new shared UI package. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]

## Common Pitfalls

### Pitfall 1: Selector State Survives Modal Reopen

**What goes wrong:** The previous template remains selected when a fresh create modal opens. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
**Why it happens:** State is put in a long-lived store or initialized from the existing `templateId` prop. [VERIFIED: codebase grep]
**How to avoid:** Keep `useState(null)` inside `CreateProjectForm` and do not consume `templateId` in Phase 03. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
**Warning signs:** `templateId` appears in submit payload without user selection, or Project store gains template selector fields. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]

### Pitfall 2: Dropdown Primitive Cannot Render Required States

**What goes wrong:** `CustomSearchSelect` automatically renders checkmarks, generic loading text, or lacks inline retry/pinned clear option. [VERIFIED: `packages/ui/src/dropdowns/custom-search-select.tsx`]
**Why it happens:** Shared primitive is optimized for simple option arrays. [VERIFIED: codebase grep]
**How to avoid:** Use `CustomSearchSelect` only if requirements fit; otherwise copy the local Combobox pattern from `ProjectDropdownBase` into `template-select.tsx`. [VERIFIED: `apps/web/core/components/dropdowns/project/base.tsx`]
**Warning signs:** Planner starts modifying `packages/ui` just to support one modal-specific state matrix. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md`]

### Pitfall 3: Type Safety Stops at `Partial<TProject>`

**What goes wrong:** `template_id` is added through `any`, leaving VER-05 weak. [VERIFIED: `apps/web/core/store/project/project.store.ts` currently has `createProject(data: any)`]
**Why it happens:** Existing store create method accepts `any` even though service is typed as `Partial<TProject>`. [VERIFIED: codebase grep]
**How to avoid:** Add a narrow create payload type such as `TProjectCreatePayload = Partial<TProject> & { template_id?: string }` and use it in service/store/form signatures where practical. [VERIFIED: `packages/types/src/project/projects.ts`]
**Warning signs:** `as any` around create payload or service call. [VERIFIED: codebase grep]

### Pitfall 4: Error State Uses Toasts

**What goes wrong:** Template catalog fetch failure emits a global toast and distracts from normal no-template creation. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
**Why it happens:** Existing create submit errors use toasts, but template-list errors are dropdown-local. [VERIFIED: `apps/web/ce/components/projects/create/root.tsx`]
**How to avoid:** Render `Could not load templates` plus `Retry` inside the dropdown and keep submit behavior unchanged. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md`]
**Warning signs:** `setToast` appears in `template-select.tsx`. [VERIFIED: codebase grep]

## Code Examples

Verified patterns from official sources and existing code:

### SWR Fetch With Local Retry

```typescript
// Source: SWR API docs + apps/web SWR patterns
const {
  data: templates,
  error,
  isLoading,
  mutate,
} = useSWR(
  workspaceSlug ? WORKSPACE_PROJECT_TEMPLATES(workspaceSlug) : null,
  workspaceSlug ? () => projectService.getProjectTemplates(workspaceSlug) : null,
  { revalidateIfStale: false, revalidateOnFocus: false }
);

const handleRetry = () => mutate();
```

### Omit `template_id` Unless Selected

```typescript
// Source: Phase 03 D-19/D-21 and existing CreateProjectForm.onSubmit
const createPayload: TProjectCreatePayload = {
  ...formData,
  ...(selectedTemplate ? { template_id: selectedTemplate.id } : {}),
};
```

### Template Type Shape For Selector

```typescript
// Source: apps/api/plane/app/serializers/project_template.py
export type TProjectTemplate = {
  id: string;
  name: string;
  description: string;
  template_type: "built_in" | "custom";
  system_key: string | null;
  is_system: boolean;
  is_active: boolean;
  payload: Record<string, unknown>;
  workspace: string | null;
  start_offset_days: number | null;
  target_offset_days: number | null;
  duration_days: number | null;
  created_at: string;
  updated_at: string;
};
```

## State of the Art

| Old Approach                                    | Current Approach                                                                  | When Changed                                | Impact                                                                                                                                                          |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Create Project always posts only Project fields | Backend accepts optional write-only `template_id`                                 | Phase 02, verified before Phase 03 planning | Frontend can add one optional field without changing backend semantics. [VERIFIED: `.planning/phases/02-transactional-project-creation/02-VERIFICATION.md`]     |
| Template catalog unavailable to frontend        | Workspace template endpoint returns active built-ins and active workspace customs | Phase 01, verified before Phase 03 planning | Selector can use one list endpoint rather than separate built-in/custom calls. [VERIFIED: `.planning/phases/01-template-catalog-foundation/01-VERIFICATION.md`] |
| `ProjectTemplateSelect` is empty                | Stub is already rendered in header cover area                                     | Current codebase                            | Implementation can stay in the intended insertion point. [VERIFIED: codebase grep]                                                                              |

**Deprecated/outdated:**

- Treating `templateId` prop as initial selection is out of scope for Phase 03; ignore it per D-18. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]
- Adding detailed template previews in this dropdown is out of scope; description-only satisfies CAT-06 for this phase. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]

## Assumptions Log

| #   | Claim                                                                                                                                      | Section                              | Risk if Wrong                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| A1  | Exact frontend type names such as `TProjectTemplate` and `TProjectCreatePayload` are recommendations, not locked existing names. [ASSUMED] | Code Examples / Standard Stack       | Planner may choose different names, but must preserve field shape and payload typing.                             |
| A2  | A local Combobox implementation may be simpler than extending `CustomSearchSelect` for the full state matrix. [ASSUMED]                    | Alternatives / Architecture Patterns | Planner should inspect implementation effort before locking; either approach is acceptable if UI contract is met. |

## Open Questions (RESOLVED)

1. **Should new i18n keys be added for selector copy?**
   - What we know: Existing create modal uses `useTranslation`, while UI spec locks exact English copy. [VERIFIED: codebase grep; VERIFIED: `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md`]
   - Resolution: Use UI-SPEC copy through existing i18n conventions where practical. If an exact existing key is available, use `t(...)`; if no exact key exists, the Phase 03 plans may keep the UI-SPEC literal copy local to `ProjectTemplateSelect` because local component copy is already present in frontend code paths such as Plane dropdown loading states. Do not add broad locale churn for this narrow selector unless the executor finds an established nearby key namespace that can be updated surgically. [VERIFIED: `packages/ui/src/dropdowns/custom-search-select.tsx`; VERIFIED: codebase grep]

2. **Should `WORKSPACE_PROJECT_TEMPLATES` be added to `packages/constants/src/fetch-keys.ts`?**
   - What we know: Existing SWR keys are centralized for many workspace/project resources. [VERIFIED: `packages/constants/src/fetch-keys.ts`]
   - Resolution: Add and use `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)` for the selector SWR key. This keeps the new catalog fetch aligned with the planned service-layer integration and with existing workspace/project fetch-key conventions. [VERIFIED: `packages/constants/src/fetch-keys.ts`]

## Environment Availability

| Dependency   | Required By                                       | Available | Version              | Fallback                                                            |
| ------------ | ------------------------------------------------- | --------- | -------------------- | ------------------------------------------------------------------- |
| Node.js      | Type checks/build scripts                         | yes       | v22.22.1             | none needed. [VERIFIED: local command]                              |
| pnpm         | Workspace checks                                  | yes       | 11.3.0               | none needed. [VERIFIED: local command]                              |
| Docker       | Backend tests if planner chooses API smoke checks | yes       | 29.6.0               | Not required for frontend-only Phase 03. [VERIFIED: local command]  |
| ctx7         | Documentation lookup fallback                     | no        | —                    | Official web docs used. [VERIFIED: local command]                   |
| npm registry | Package/version verification                      | yes       | queried successfully | Use repo catalog versions; do not upgrade. [VERIFIED: npm registry] |

**Missing dependencies with no fallback:**

- None for implementation planning. [VERIFIED: local command]

**Missing dependencies with fallback:**

- `ctx7`; fallback was official docs through web search. [VERIFIED: local command; CITED: https://headlessui.com/react/combobox]

## Security Domain

### Applicable ASVS Categories

| ASVS Category         | Applies                        | Standard Control                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V2 Authentication     | no direct new auth             | Existing authenticated workspace routes protect APIs. [VERIFIED: codebase grep]                                                                                                                                                                          |
| V3 Session Management | no direct new session handling | Use existing API service/session behavior. [VERIFIED: codebase grep]                                                                                                                                                                                     |
| V4 Access Control     | yes                            | Backend list endpoint uses `@allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")`; frontend handles forbidden/error as inline non-blocking dropdown error. [VERIFIED: `apps/api/plane/app/views/workspace/project_template.py`] |
| V5 Input Validation   | yes                            | Only submit backend-provided template UUIDs; backend serializer uses `UUIDField(required=False, allow_null=True, write_only=True)`. [VERIFIED: `apps/api/plane/app/serializers/project.py`]                                                              |
| V6 Cryptography       | no                             | No cryptographic operation in this phase. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]                                                                                                                                |

### Known Threat Patterns for Plane Web Selector

| Pattern                                      | STRIDE                 | Standard Mitigation                                                                                                                                                               |
| -------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Template ID tampering                        | Tampering              | Backend validates availability and returns generic 404 for unavailable templates. [VERIFIED: `.planning/phases/02-transactional-project-creation/02-CONTEXT.md`]                  |
| Permission probing through catalog errors    | Information Disclosure | Show generic inline load error; do not expose role/template availability detail in UI. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`]            |
| Unsafe rendering of template description     | XSS                    | Render description as plain React text, not HTML. [VERIFIED: `ProjectTemplateSerializer` exposes `description` as data; ASSUMED mitigation based on React escaping]               |
| Denial of create flow through catalog outage | Denial of Service      | No-template Project creation must remain available and submit must omit `template_id` when unset. [VERIFIED: `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md`] |

## Sources

### Primary (HIGH confidence)

- `AGENTS.md` - repo commands and coding constraints. [VERIFIED: codebase grep]
- `.planning/phases/03-create-modal-template-selection/03-CONTEXT.md` - locked phase decisions D-01 through D-22. [VERIFIED: codebase grep]
- `.planning/phases/03-create-modal-template-selection/03-UI-SPEC.md` - selector UI contract. [VERIFIED: codebase grep]
- `apps/web/ce/components/projects/create/root.tsx`, `template-select.tsx`, `apps/web/core/components/project/create/header.tsx`, `create-project-modal.tsx` - modal/form/header integration. [VERIFIED: codebase grep]
- `apps/api/plane/app/views/workspace/project_template.py`, `apps/api/plane/app/serializers/project_template.py`, `apps/api/plane/app/serializers/project.py` - backend API contracts. [VERIFIED: codebase grep]

### Secondary (MEDIUM confidence)

- https://headlessui.com/react/combobox - Combobox composition and accessible select behavior. [CITED: official docs]
- https://react-hook-form.com/docs/useform/handlesubmit - submit callback pattern. [CITED: official docs]
- https://swr.vercel.app/docs/api - `data`, `error`, `isLoading`, and `mutate` API. [CITED: official docs]
- npm registry queries for package versions, modified dates, repositories, downloads, and postinstall scripts. [VERIFIED: npm registry]

### Tertiary (LOW confidence)

- None used as authoritative source; assumptions are isolated in the Assumptions Log. [ASSUMED]

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - existing packages and versions are verified from repo manifests and npm registry; no new installs required. [VERIFIED: npm registry; VERIFIED: codebase grep]
- Architecture: HIGH - integration points are already present in source code and locked by CONTEXT/UI-SPEC. [VERIFIED: codebase grep]
- Pitfalls: HIGH for codebase pitfalls, MEDIUM for external primitive behavior because Context7 was unavailable and official web docs were used. [VERIFIED: codebase grep; CITED: official docs]

**Research date:** 2026-07-01
**Valid until:** 2026-07-31 for codebase-local guidance; recheck npm/docs before dependency upgrades.
