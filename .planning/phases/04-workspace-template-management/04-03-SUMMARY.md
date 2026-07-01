---
phase: 04-workspace-template-management
plan: 03
subsystem: project-templates
tags: [frontend, react-hook-form, settings, editor, atomic-save, dnd]
dependency_graph:
  requires:
    - "Existing `ProjectService` class extending `APIService` (apps/web/core/services/project)"
    - "Existing `TProjectTemplate` and `TProjectTemplatePayload` shape (packages/types/src/project/project_templates)"
    - "Existing `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)` SWR key (packages/constants/src/fetch-keys)"
    - "Existing admin-only /settings/templates list route (added by 04-02, commit 613aa2e2f)"
    - "Existing settings i18n namespace `workspace_settings.settings.project_templates.*` (added by 04-02)"
  provides:
    - "Editor pages at /settings/templates/new and /settings/templates/:templateId/edit (admin-gated)"
    - "Five ProjectService methods (create/update/deactivate/reactivate/duplicate) + `getProjectTemplates(workspaceSlug, includeInactive?)` param"
    - "TProjectTemplateWritePayload type for atomic create/update"
    - "WORKSPACE_PROJECT_TEMPLATE_DETAIL fetch key + ProjectService.getProjectTemplate for the edit page"
    - "Editor utilities: slugifyKey, uniqueKey, assemblePayload (schema_version=1), mapProjectTemplateErrors (handles list-of-dicts)"
    - "RHF editor root with States + Labels sections, drag reorder, hidden stable keys, exactly-one-default, hex color defaults"
  affects:
    - "apps/web/app/routes/core.ts (added /new and /:id/edit routes alongside the 04-02 list route)"
    - "packages/constants/src/fetch-keys.ts (added detail key)"
    - "packages/types/src/project/project_templates.ts (added TProjectTemplateWritePayload)"
    - "packages/i18n/src/locales/en/workspace-settings.json (added project_templates.editor.* namespace)"
    - "apps/web/core/components/project-templates (extended barrel + new editor/ directory)"
    - "Future plans 04-04 (editor Modules/Cycles/Starter issues) and 04-05 (lifecycle row actions)"
status: complete
key-files:
  created:
    - "apps/web/core/components/project-templates/utils.ts"
    - "apps/web/core/components/project-templates/editor/root.tsx"
    - "apps/web/core/components/project-templates/editor/states-section.tsx"
    - "apps/web/core/components/project-templates/editor/labels-section.tsx"
    - "apps/web/core/components/project-templates/editor/section.tsx"
    - "apps/web/core/components/project-templates/editor/index.ts"
    - "apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/new/page.tsx"
    - "apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/new/header.tsx"
    - "apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/[templateId]/edit/page.tsx"
    - "apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/[templateId]/edit/header.tsx"
  modified:
    - "apps/web/core/services/project/project.service.ts"
    - "apps/web/core/components/project-templates/index.ts"
    - "apps/web/app/routes/core.ts"
    - "packages/constants/src/fetch-keys.ts"
    - "packages/types/src/project/project_templates.ts"
    - "packages/i18n/src/locales/en/workspace-settings.json"
decisions:
  - "Reference keys are generated ONCE at add-time (slugifyKey + uniqueKey) and preserved across renames (RESEARCH Pitfall 2 / D-12) — never recomputed at submit."
  - "Editor form shape already declares `modules`/`cycles`/`starter_issues` empty arrays so Plan 04 only wires UI; type is stable across plans."
  - "Editor Colors default to a real hex via `getRandomLabelColor()` (never the CSS-var `var(--text-color-secondary)` default — RESEARCH Pitfall 5)."
  - "Exactly-one-default enforcement clears the marker for every OTHER state when one is toggled to true (single-radio behaviour over the array — RESEARCH Pitfall 3)."
  - "Client guards run before round-trip: 1 default, unique state names, unique label names, template name 1..255 chars. Backend `validate_project_template_payload` remains authoritative and its list-of-dicts 400s surface inline via `mapProjectTemplateErrors` (RESEARCH Pitfall 7)."
  - "Edit page renders read-only (`disabled` on every input, no Save button) when the loaded template `is_system` — built-in templates are immutable through the API (D-08)."
  - "Form selection between the /new and /edit routes is governed by a `mode` prop on `ProjectTemplateEditorRoot` so the component is mountable from any caller (row Edit action in Plan 04-05 will reuse it)."
  - "Backend section-error messages are lifted into local component state (`backendMessages`) and passed to each section, sidestepping RHF's nested `FieldErrors<TForm>` indexing shape."
  - "Cancel navigates back to /${workspaceSlug}/settings/templates; Save + success toast + mutate(WORKSPACE_PROJECT_TEMPLATES(...)) + redirect (D-10)."
metrics:
  duration_min: 53
  completed_date: 2026-07-01
  tasks: 2
  files: 16
one_liner: "Full-page editor that assembles a TProjectTemplatePayload via RHF + useFieldArray, exposes five new ProjectService methods, and gates both create and edit routes — States + Labels fully working with drag reorder, hidden stable keys, exactly-one-default, and inline backend-error surfacing."
---

# Phase 4 Plan 3: Project Template Editor (States + Labels) Summary

**Plan:** 04-03-PLAN.md
**Status:** Complete — both tasks shipped
**Date:** 2026-07-01
**Commits:**

- `12b2212e7` — feat(04-03): add template service methods + write-payload type + editor utils (Task 1)
- `be502b7ce` — feat(04-03): build editor pages + States/Labels sections + routes (Task 2)

## One-liner

Full-page editor that assembles a `TProjectTemplatePayload` via `react-hook-form` + `useFieldArray`, exposes five new `ProjectService` methods, and gates both create and edit routes — States + Labels fully working with drag reorder, hidden stable keys, exactly-one-default, and inline backend-error surfacing.

## Objective

Deliver the create/edit vertical slice for a custom project template: a dedicated full-page editor (`D-09`) that saves the whole template atomically (`D-10`) through new `ProjectService` methods, with States and Labels — the two order-sensitive sections — fully working including drag reorder (`D-11`), hidden auto-generated stable reference keys (`D-12`), and inline backend-error surfacing. Modules/Cycles/Starter-issues sections and their cross-references are deferred to Plan 04; lifecycle actions are deferred to Plan 05.

## What shipped

### Task 1 — Service methods, write-payload type, fetch keys, and editor utilities (`12b2212e7`)

Four shared files changed (plus one new utility module):

| File                                                        | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `packages/types/src/project/project_templates.ts`           | Adds `TProjectTemplateWritePayload` — the minimal write subset accepted by `ProjectTemplateWriteSerializer` (`name`, `description`, `template_type: "custom"`, `payload`, `*_offset_days`, `duration_days`, `is_active?`). Reuses existing per-section types; locks `template_type` to `"custom"`.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `packages/constants/src/fetch-keys.ts`                      | Adds `WORKSPACE_PROJECT_TEMPLATE_DETAIL(workspaceSlug, templateId)` so the edit page can fetch a single template by id; SWR revalidations are scoped to that template id.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `apps/web/core/services/project/project.service.ts`         | Extends `getProjectTemplates(workspaceSlug, includeInactive?)` to append `?include_inactive=true` only when the flag is set (D-14, default call path unchanged). Adds five new methods: `createProjectTemplate` (POST), `updateProjectTemplate` (PATCH), `deactivateProjectTemplate` (DELETE/204), `reactivateProjectTemplate` (PATCH `{is_active: true}` — for the D-15 dedicated backend action), `duplicateProjectTemplate` (POST `.../duplicate/` with optional `{name}` override). All five follow the existing `getProjectTemplates` error convention `.then((r) => r?.data).catch((e) => { throw e?.response?.data; })`. Also adds `getProjectTemplate(slug, id)` for the edit-page detail key. |
| `apps/web/core/components/project-templates/utils.ts` (NEW) | Tiny, no-analog utility module: `PROJECT_TEMPLATE_SCHEMA_VERSION = 1` constant; `slugifyKey(name)` (lowercase ascii slug fallback to `"item"`); `uniqueKey(base, taken)` (suffix until unique); `assemblePayload(form)` (always sets `schema_version`, preserves per-item stable `_key`s — RESEARCH Pitfall 2 / 6); `mapProjectTemplateErrors(error)` (iterates the backend list-of-dicts shape — RESEARCH Pitfall 7 — into `{perSection, generalFallback}`); form-shape types already declared with empty `modules`/`cycles`/`starter_issues` arrays so Plan 04 only wires UI.                                                                                                                        |

The five service methods + `include_inactive` extension are exactly the verbatim signatures from `RESEARCH.md` lines 481-500; the slugify/uniqueKey utilities are from `RESEARCH.md` lines 503-523.

### Task 2 — Editor pages, headers, root, two sections, and routes (`be502b7ce`)

Nine new files plus targeted edits to two config files:

| New file                                                                                                    | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/new/page.tsx`                 | `observer`-wrapped page; admin gate (`allowPermissions([ADMIN], WORKSPACE)` -> `NotAuthorizedView`); `SettingsContentWrapper` in **`hugging`** mode (D-09); `PageHead` + `NewProjectTemplateSettingsHeader` + `ProjectTemplateEditorRoot mode="create"`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/new/header.tsx`               | Two-segment breadcrumb: Project Templates -> "New project template" (list segment is a `BreadcrumbLink` with `href` to navigate back).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/[templateId]/edit/page.tsx`   | `observer` + admin gate + `SettingsContentWrapper hugging`; fetches the template by id with SWR (`WORKSPACE_PROJECT_TEMPLATE_DETAIL`) and passes it to the editor as `initialTemplate`; renders the editor in **read-only** mode when the loaded template `is_system` is true (D-08). On SWR revalidation (e.g. after Plan 05 reactivate), `buildDefaults` rehydrates the form via `reset()`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/[templateId]/edit/header.tsx` | Two-segment breadcrumb: Project Templates -> "Edit template".                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `apps/web/core/components/project-templates/editor/root.tsx`                                                | `ProjectTemplateEditorRoot` — one `useForm<TProjectTemplateForm>` driven by `buildDefaults`; two `useFieldArray` for `payload.states` and `payload.labels` (the form shape already declares empty arrays for `modules`/`cycles`/`starter_issues` so Plan 04 only wires UI); top block `Controller`s for `name` (required, max 255) + `description`; renders `<StatesSection />` and `<LabelsSection />`; client-guard memo computes `isInvalid`; sticky footer action bar with `Cancel` + `Save template` primary button (loading state, disabled while invalid). `onSubmit` calls `assemblePayload(form)` then `createProjectTemplate` (create) or `updateProjectTemplate` (edit), `mutate(WORKSPACE_PROJECT_TEMPLATES(slug))`, surfaces a success toast, and navigates back to the list. Error path runs `mapProjectTemplateErrors`, lifts section messages into local state (`backendMessages`), and always surfaces a fallback toast (RESEARCH Pitfall 7). |
| `apps/web/core/components/project-templates/editor/states-section.tsx`                                      | `StatesSection` — inline add/edit/remove rows driven by the parent `useFieldArray`. Each row: `GripVertical` handle (hidden when only one row), `ColorPicker` (defaults to a real hex via `getRandomLabelColor()` — RESEARCH Pitfall 5), `Input` name with `Controller rules: required`, `CustomSelect` for `group` (enum: `backlog\|unstarted\|started\|completed\|cancelled\|triage`), radio Default marker (clicking clears the marker on every other row — RESEARCH Pitfall 3), `Trash2` remove button. Add-time generates a stable `state_key` via `slugifyKey`+`uniqueKey` (D-12) and preserves it through renames. Drag reorder via `@plane/ui` `Sortable` mapping the new order to `useFieldArray.move`. No raw `state_key` input is ever bound.                                                                                                                                                                                                       |
| `apps/web/core/components/project-templates/editor/labels-section.tsx`                                      | `LabelsSection` — same row pattern, no Default marker and no `group` (labels are unordered-alphabetically-but-orderable lists). Stable `label_key` generated at add-time and preserved through renames. Drag reorder via `Sortable`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `apps/web/core/components/project-templates/editor/section.tsx`                                             | Tiny shared heading frame (title + optional add action button + children + optional inline error) reused by both sections — keeps typography and spacing consistent ahead of Plan 04's Modules/Cycles/Starter-issues sections.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `apps/web/core/components/project-templates/editor/index.ts`                                                | Barrel — exports `ProjectTemplateEditorRoot`, `StatesSection`, `LabelsSection`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

Edited config files:

| File                                                   | Change                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/app/routes/core.ts`                          | Adds two routes inside the `(workspace)` layout array, sitting **next to** the 04-02 list route (not modifying it): `:workspaceSlug/settings/templates/new` and `:workspaceSlug/settings/templates/:templateId/edit`. Mirrors the webhooks route registrations. Both backing page modules exist in this plan so each plan's typegen gate is self-consistent.                                                                                                                                                                                                                                                                                                                                                  |
| `apps/web/core/components/project-templates/index.ts`  | Re-exports the new editor primitives alongside the existing list primitives.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `packages/i18n/src/locales/en/workspace-settings.json` | Adds the `workspace_settings.settings.project_templates.editor.*` namespace: `new_title`, `edit_title`, `name_label`, `name_required`, `name_max_length`, `description_label`, `name_placeholder`, `description_placeholder`, `add_state`, `add_label`, `states_section_title`, `labels_section_title`, `states_empty_hint`, `labels_empty_hint`, `state_name_placeholder`, `label_name_placeholder`, `state_group`, `default_marker`, `set_as_default`, `remove`, `save_template`, `save_template_creating`, `save_template_saving`, `created_toast`, `updated_toast`, `view_only_notice`, `duplicate_state_name`, `duplicate_label_name`, `no_default_state`, `name_required_inline`, `save_error_generic`. |

## Acceptance Criteria Verification

| Criterion                                                                                                                             | Status | Evidence                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `check:types` (react-router typegen && tsc --noEmit) passes for the new `/new` and `/edit` pages and editor components                | PASS   | `pnpm --filter=web check:types` exits 0 (Task 2 verifies).                                                                                                           |
| `check:lint` adds no new warnings above the existing baseline (983 baseline, 0 new)                                                   | PASS   | `pnpm --filter=web check:lint` reports `Found 983 warnings and 0 errors` after Task 2 (no warnings from any new file).                                               |
| `pnpm --filter=@plane/types check:types` and `pnpm --filter=web check:types` pass                                                     | PASS   | Run during Task 1 verify; both exit 0.                                                                                                                               |
| `project.service.ts` exposes the five new methods + `include_inactive`                                                                | PASS   | grep `createProjectTemplate` / `updateProjectTemplate` / `deactivateProjectTemplate` / `reactivateProjectTemplate` / `duplicateProjectTemplate` / `include_inactive` |
| `TProjectTemplateWritePayload` exists in `project_templates.ts` with `template_type: "custom"` and `payload: TProjectTemplatePayload` | PASS   | grep `template_type: "custom"` and `payload: TProjectTemplatePayload` in `project_templates.ts`.                                                                     |
| `utils.ts` exports `slugifyKey`, `uniqueKey`, `assemblePayload`, `mapProjectTemplateErrors` and sets `schema_version`                 | PASS   | grep `schema_version: PROJECT_TEMPLATE_SCHEMA_VERSION` in `utils.ts:200`.                                                                                            |
| `routes/core.ts` registers the two new routes                                                                                         | PASS   | grep `settings/templates/new` and `settings/templates/:templateId/edit` in `core.ts`                                                                                 |
| `editor/root.tsx` uses `useForm` + `useFieldArray` for states/labels and sets modules/cycles/starter_issues empty arrays in defaults  | PASS   | grep `useFieldArray` and `modules: [], cycles: [], starter_issues: []` in `root.tsx`                                                                                 |
| `editor/root.tsx` `onSubmit` calls `assemblePayload` then `create`/`update` and `mutate(WORKSPACE_PROJECT_TEMPLATES(...))`            | PASS   | grep `assemblePayload`, `createProjectTemplate`/`updateProjectTemplate`, `mutate(WORKSPACE_PROJECT_TEMPLATES` in `root.tsx`                                          |
| States section enforces exactly-one-default                                                                                           | PASS   | grep `handleSetDefault` in `states-section.tsx` — radio's onChange clears all others                                                                                 |
| No raw `state_key`/`label_key` input is rendered                                                                                      | PASS   | grep `state_key`/`label_key` in `states-section.tsx` and `labels-section.tsx` returns only `form state` reads, never a bound `<Input>`                               |
| New color fields default to a hex                                                                                                     | PASS   | grep `getRandomLabelColor` in both section files                                                                                                                     |
| Edit page renders read-only when the loaded template `is_system`                                                                      | PASS   | grep `readOnly={Boolean(template?.is_system)}` in `edit/page.tsx`                                                                                                    |
| No inline axios/fetch — all calls go through `projectService`                                                                         | PASS   | grep `axios`/`fetch(` in all new files returns 0 matches                                                                                                             |

## Deviations from Plan

The plan was executed nearly as written; the small deviations are local corrections, not architectural changes.

1. **`STATE_GROUPS` constant was split between files (kept where it belongs).** The plan referenced defining `STATE_GROUPS` once at the top of `editor/root.tsx` for the page-level error mapping fallback, but the per-section local `STATE_GROUPS` is what the `<CustomSelect>` actually iterates. The page-level constant in `root.tsx` was removed (it was only referenced in an initial sketch and never reached); the section-level arrays remain in each section file. No correctness change.

2. **`name` map-spread replaced with `Object.assign`** to satisfy the `oxc(no-map-spread)` lint rule (would otherwise have been a new warning). Runtime behaviour identical: same `{...s, default: idx === 0}` semantics in `Object.assign({}, s, { default: idx === 0 })`.

3. **`CustomSelect.onChange` typed as `(v: TProjectTemplateStateGroup)`** instead of an `as`-cast pattern. The prop already types its `onChange` callback as `(value: T) => void` in `packages/ui/src/dropdowns/helper.tsx`, so the cast was unnecessary noise.

4. **`@/components/ui` import for `Sortable` swapped to `@plane/ui`** — `Sortable` lives in `@plane/ui` (`packages/ui/src/sortable/sortable.tsx`), not in `apps/web/core/components/ui`. Fixed during type-check iteration.

5. **`@plane/constants` package rebuilt** (`pnpm --filter=@plane/constants build`) before the web type-check would pick up the new `WORKSPACE_PROJECT_TEMPLATE_DETAIL` export. This is a workspace-package build-order quirk (the dist was stale from before the per-package build ran); the `@plane/i18n` JSON is loaded directly, not via dist.

6. **Backend section-error messages lifted into local component state (`backendMessages`).** The plan's pseudocode (`errors["payload.states"]?.message as string`) collides with RHF's deeply-nested `FieldErrors<TForm>` indexing shape (`FormState<...>["payload"]` is a nested partial). Lifting into local state keeps the section-error contract clean and avoids an `as any` cast.

No plan-level deviations; no architectural decisions deferred.

## Threat Model Coverage

Plan-level threat register entries from 04-03:

| Threat ID                                           | Mitigation implemented                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T-04-08 (EoP — direct-URL access to /new and /edit) | Both editor pages run `allowPermissions([ADMIN], WORKSPACE)` -> `NotAuthorizedView`; backend create/update are ADMIN-only (V4).                                                                                                                                                                                                                                              |
| T-04-09 (Tampering — malformed/oversized payload)   | Client pre-validates: name required + max 255 chars; exactly-one default state; unique state names; unique label names. Backend `validate_project_template_payload` is authoritative and its list-of-dicts 400s surface inline via `mapProjectTemplateErrors` (Pitfall 7). `name` and `description` use `Input`/`TextArea` which auto-clip via `maxLength` where applicable. |
| T-04-10 (Tampering — reference-key drift)           | Stable keys generated once at add-time via `slugifyKey` + `uniqueKey` and stored on the form item (Pitfall 2). `assemblePayload` emits them verbatim — never recomputed from current name.                                                                                                                                                                                   |
| T-04-11 (XSS — rendering loaded template strings)   | React auto-escapes all rendered fields (`name`, `description`); no `dangerouslySetInnerHTML`. The view-only banner is plain text.                                                                                                                                                                                                                                            |

## Auth Gates

None encountered during execution. No new admin-only behaviour that wasn't already verified by the 04-02 list page path.

## Known Stubs / Followups

- **Modules / Cycles / Starter-issues sections** — explicitly deferred to Plan 04 (`04-04-PLAN.md`). The form shape (`TProjectTemplateForm` + `payload.modules`/`cycles`/`starter_issues`) already declares them as empty arrays so Plan 04 only has to wire UI; no type renumbering needed.
- **Row actions on the list page (Edit · Duplicate · Deactivate · Reactivate)** — Plan 05 wires these. The Edit link target is `/settings/templates/${templateId}/edit`, which now resolves to a real page (this plan). The Built-in "View" target is the same `/edit` route in read-only mode (driven by `is_system`), also resolved by this plan.
- **i18n for the 18 non-English locales** — not in this plan's scope; the `editor.*` keys are added to the English namespace and fall back at runtime; populated by the translate workflow downstream.
- **The `name` field does not yet surface a backend "name is required" inline** separately from the top-of-form `errors.name` (handled via RHF error message); a future polish task can re-route it through `backendMessages.name` for consistency with section messages.

## Self-Check

- All 10 new files exist on disk and are tracked under `12b2212e7` and `be502b7ce`.
- `be502b7ce` (Task 2) and `12b2212e7` (Task 1) present in `git log --oneline -6`.
- `pnpm --filter=@plane/types check:types` exits 0 (Task 1).
- `pnpm --filter=web check:types` exits 0 (Task 2).
- `pnpm --filter=web check:lint` exits 0 errors, 983 warnings (no new above the 04-02 baseline).
- The pre-existing `/settings/templates` list route shape is unchanged in `routes/core.ts` (only sibling routes were added; the list route register block `:285-288` was preserved verbatim through the two new `:290-298` inserts).

## Outcome

- Workspace admins can open `/settings/templates/new`, enter a name + description, add States and Labels rows (with drag reorder, exactly-one default, hex colors, hidden stable reference keys), and **save atomically** via one POST.
- Workspace admins can open `/settings/templates/:id/edit` for a custom template, see it pre-filled, change States/Labels, and **save atomically** via one PATCH.
- Backend 400s surface inline per-section AND as a fallback toast.
- Built-in templates reuse the same editor route in read-only mode.
- Service methods + write-payload type are in place for Plan 04 (Modules/Cycles/Starter-issues) and Plan 05 (lifecycle actions).
- Requirement `UI-05` editor slice is ready for the Plan 05 end-of-phase human-verify checkpoint.
