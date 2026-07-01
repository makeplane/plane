# Phase 4: Workspace Template Management - Research

**Researched:** 2026-07-01
**Domain:** Frontend feature build in a brownfield React Router + MobX + SWR monorepo (Plane). Net-new workspace-settings UI wired against pre-existing backend template CRUD APIs (Phases 1-3) and the in-house `@plane/ui` / `@plane/propel` design system.
**Confidence:** HIGH (all findings verified by reading the actual source files in this repo)

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Add a "Project Templates" page to workspace settings in the **Administration** category, alongside Members / Billing / Exports. It is admin-only.
- **D-02:** Sidebar label is **"Project Templates"** (not the shorter "Templates").
- **D-03:** Wire the page through the established 4-touchpoint pattern: route in `apps/web/app/routes/core.ts`, a `WORKSPACE_SETTINGS` entry with `access: [EUserWorkspaceRoles.ADMIN]`, placement in the `ADMINISTRATION` bucket of `GROUPED_WORKSPACE_SETTINGS`, and an icon entry in `WORKSPACE_SETTINGS_ICONS`. The new key literal must be added to the `TWorkspaceSettingsTabs` type.
- **D-04:** Gate the page itself (not just the sidebar) with `useUserPermissions` + `allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE)`, rendering `NotAuthorizedView` for non-admins — matching the webhooks page pattern and the backend's admin-only write permissions.
- **D-05:** Distinguish built-in vs custom templates with **two labeled sections on one page**: a "System templates" (built-in, read-only) group and a "Custom templates" (workspace, editable) group. No badges-only flat list, no tabs.
- **D-06:** Deactivated custom templates are **hidden by default**, revealed via a "Show deactivated" filter/toggle. This is where reactivation happens.
- **D-07:** Custom template rows expose **Edit** and **Duplicate** as primary actions, with **Deactivate** in an overflow (⋮) menu. Deactivated custom rows (when revealed) offer **Reactivate** (PATCH `is_active=true`).
- **D-08:** Built-in (system) template rows offer **Duplicate** (creates an editable custom copy) plus a **read-only view/preview**. No edit, no deactivate — built-ins are immutable through the API.
- **D-09:** The create/edit editor is a **dedicated full-page route** (e.g. `settings/templates/new` and `settings/templates/:id/edit`), deep-linkable, back-navigating to the list. Not a modal or slide-over — 5 structured sections need the width.
- **D-10:** The editor uses an **atomic single save**: one Save submits the whole template (name + description + all 5 sections) as a single payload to the create (POST) or update (PATCH) endpoint. No section-by-section persistence.
- **D-11:** Each of the 5 sections (states / labels / modules / cycles / starter issues) is an **inline reorderable list** of add/edit/remove rows, with drag-to-reorder where order matters (states, labels), modeled on the existing project-states editor.
- **D-12:** Payload reference keys (`state_key`, `label_key`, `module_key`, `cycle_key`) are **auto-generated and hidden** — slugified from the item name with uniqueness enforced. Admins never see or edit raw keys; they work with names.
- **D-13:** Starter-issue references (state / labels / module / cycle) are **dropdowns populated from the items defined in the sections above**, picked by name and resolved to keys on save.

### Claude's Discretion

- Exact Lucide icon for the settings entry (e.g. `LayoutTemplate`) and the precise route path/segment names.
- Form library approach for the editor (react-hook-form preferred; project-states manual-`useState` form is an acceptable fallback) and the exact color-picker primitive (`TwitterPicker`-in-`Popover` or `@plane/ui` `ColorPicker`).
- How backend payload-validation errors are surfaced inline — but the editor should prevent obvious invalid states client-side.
- Exact copy for deactivate/reactivate confirmation (`AlertModalCore`), empty states (`EmptyStateCompact`), and loading skeletons (`Loader`).
- Whether the duplicate flow prompts for a name inline before opening the editor or opens the editor pre-filled; the backend `duplicate` endpoint accepts an optional `name` override.
- The read-only built-in "view/preview" presentation (same editor route in disabled/read-only mode vs a lighter preview panel).

### Deferred Ideas (OUT OF SCOPE)

None deferred within Phase 4. Explicitly out of scope / v2: duplicating an existing Project into a template, import/export, version history, visual workflow builder, template usage analytics, label parent/child hierarchy, advanced cycle scheduling presets.
</user_constraints>

<phase_requirements>

## Phase Requirements

| ID    | Description                                                                                         | Research Support                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-05 | Workspace admins have a discoverable workspace settings area for managing custom Project Templates. | Fully supported. The 4-touchpoint settings registration is documented below with exact diffs (Standard Stack + Architecture). List/management UI reuses `project-states` and `labels` component idioms. The 5-section editor maps 1:1 to the existing `TProjectTemplatePayload` type and the backend `validate_project_template_payload` rules. Frontend service methods map directly to confirmed backend endpoints. |

</phase_requirements>

## Summary

This is a frontend-only phase in a mature brownfield app. Every backend endpoint, TypeScript type, and design-system primitive this feature needs already exists and has been read and confirmed in this session. The work is: (1) register a new admin-only workspace-settings page across the established 4 touchpoints, (2) add five frontend service methods to the existing `ProjectService`, (3) build a two-section list/management screen modeled on `webhooks` + `labels`, and (4) build a full-page 5-section structured editor modeled on `project-states` + `labels`.

The single most load-bearing engineering decision is the editor's form model. Because the payload is five nested arrays that must be assembled and validated as one atomic blob (D-10), and because reference keys must be auto-generated from names and resolved on save (D-12/D-13), **react-hook-form with `useFieldArray` is the recommended approach** — it is already a project dependency, `useFieldArray` is already used in four places in the codebase, and it cleanly handles nested array add/edit/remove/reorder plus per-field inline error surfacing. The `project-states` manual-`useState` form is a viable fallback but scales poorly to five coordinated sections with cross-references.

**One material backend contract gap was discovered that the planner MUST account for** (see Common Pitfalls, Pitfall 1): the backend list endpoint and the writable-template lookup both hard-filter `is_active=True`. This means the frontend as-built **cannot** list deactivated templates or reactivate them via the documented endpoints. D-06 ("Show deactivated") and D-07 ("Reactivate via PATCH is_active=true") are therefore not achievable against the current backend without a backend change. This contradicts the "frontend-only" framing and must be resolved during planning.

**Primary recommendation:** Build the list + editor using react-hook-form + `useFieldArray`, reuse `SettingsContentWrapper`/`SettingsHeading`/`AlertModalCore`/`EmptyStateCompact`/`CustomMenu`/`Sortable`, add five methods to `ProjectService`, and escalate the `is_active` filtering gap (Pitfall 1) to the planner before locking D-06/D-07 scope.

## Architectural Responsibility Map

| Capability                             | Primary Tier                                              | Secondary Tier                | Rationale                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Settings navigation registration       | Shared constants (`packages/constants`, `packages/types`) | Frontend Server (route table) | Nav entries are declarative config consumed by both sidebar and route table.                                                  |
| Admin gating                           | Frontend (client)                                         | API (already enforces)        | UI hides/blocks via `useUserPermissions`; backend independently enforces admin-only writes.                                   |
| Template list fetch                    | Frontend (SWR)                                            | API                           | SWR client cache keyed by workspace slug; API owns the union of built-ins + custom.                                           |
| CRUD calls                             | Frontend service class (`packages/`-style APIService)     | API                           | All calls go through `ProjectService`, never inline axios (CONVENTIONS.md).                                                   |
| Payload assembly + key generation      | Frontend (client)                                         | —                             | Reference keys are slugified client-side from names before submit (D-12).                                                     |
| Payload validation                     | API (authoritative)                                       | Frontend (pre-check UX)       | Backend `validate_project_template_payload` is the source of truth; client mirrors deterministic rules to reduce round-trips. |
| Template persistence / soft-deactivate | API + DB                                                  | —                             | Owned entirely by backend; DELETE = soft `is_active=False`.                                                                   |

## Standard Stack

No new packages. Everything below is already a dependency of `apps/web` (verified in `apps/web/package.json`).

### Core

| Library                              | Version                                                               | Purpose                                                                                                                                                     | Why Standard                                                                            |
| ------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `react-hook-form`                    | `catalog:` (already installed) `[VERIFIED: apps/web/package.json:61]` | Editor form state, nested arrays via `useFieldArray`, inline errors                                                                                         | Preferred per recent labels/webhook code; `useFieldArray` already used in 4 repo files. |
| `swr`                                | `catalog:` `[VERIFIED: template-select.tsx uses useSWR]`              | List fetch + `mutate` revalidation                                                                                                                          | Established data-fetching pattern; `WORKSPACE_PROJECT_TEMPLATES` key already exists.    |
| `mobx-react` (`observer`)            | `catalog:`                                                            | Wrap pages/components                                                                                                                                       | Every settings page is an `observer`.                                                   |
| `@plane/ui`                          | `workspace:*`                                                         | `Input`, `TextArea`, `ColorPicker`, `Popover`, `CustomSelect`, `CustomMenu`, `AlertModalCore`, `Loader`, `Sortable`/`Draggable`/`DragHandle`, `Breadcrumbs` | In-house primitives, no net-new UI.                                                     |
| `@plane/propel`                      | `workspace:*`                                                         | `Button` (`@plane/propel/button`), `EmptyStateCompact` (`@plane/propel/empty-state`), `setToast`/`TOAST_TYPE` (`@plane/propel/toast`)                       | Design-system buttons/toasts/empty states.                                              |
| `@plane/constants`                   | `workspace:*`                                                         | `EUserPermissions`, `EUserPermissionsLevel`, `WORKSPACE_SETTINGS`, `WORKSPACE_PROJECT_TEMPLATES` fetch key, `LABEL_COLOR_OPTIONS`, `getRandomLabelColor`    | Permission enums + fetch keys + color palette.                                          |
| `@plane/types`                       | `workspace:*`                                                         | `TProjectTemplate`, `TProjectTemplatePayload`, per-section types, `EUserWorkspaceRoles`, `TWorkspaceSettingsTabs`                                           | Existing template types; reuse verbatim.                                                |
| `@plane/i18n`                        | `workspace:*`                                                         | `useTranslation` / `t()`                                                                                                                                    | All copy through i18n.                                                                  |
| `react-color` (`TwitterPicker`)      | `catalog:` `[VERIFIED: apps/web/package.json:57]`                     | Swatch color picker in a Popover (labels/states idiom)                                                                                                      | Alternative to `@plane/ui` `ColorPicker`.                                               |
| `@atlaskit/pragmatic-drag-and-drop*` | `catalog:` `[VERIFIED: apps/web/package.json:20-22]`                  | Underlying DnD engine (used raw by project-states, wrapped by `@plane/ui` `Sortable`)                                                                       | Drag-to-reorder for States/Labels.                                                      |

### Supporting

| Library               | Version       | Purpose                                                        | When to Use             |
| --------------------- | ------------- | -------------------------------------------------------------- | ----------------------- |
| `@plane/utils` (`cn`) | `workspace:*` | Class merge                                                    | All styling.            |
| `lucide-react`        | `catalog:`    | Icons (`LayoutTemplate` for settings entry, row action glyphs) | Icon map + row actions. |

### Alternatives Considered

| Instead of                                              | Could Use                                                                      | Tradeoff                                                                                                                                                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| react-hook-form + `useFieldArray`                       | manual `useState` form (project-states StateForm)                              | Simpler per-field, but 5 coordinated nested arrays + cross-section reference resolution + inline backend-error mapping become error-prone. RHF is the safer choice here.                                                              |
| `@plane/ui` `Sortable` (pragmatic wrapper)              | Raw `@atlaskit` `draggable`/`dropTargetForElements` (as `state-item.tsx` does) | Raw gives per-group drop-edge control (needed if states are grouped by state-group); `Sortable` is simpler for a flat ordered list (labels-style). Choose per section.                                                                |
| `@plane/ui` `ColorPicker` (native `<input type=color>`) | `TwitterPicker` in `Popover`                                                   | `ColorPicker` emits any hex from the OS picker (matches `#RRGGBB`), compact. `TwitterPicker` constrains to a curated palette (`LABEL_COLOR_OPTIONS`) and matches labels/states visually. Either satisfies the `#RRGGBB` backend rule. |

**Installation:** None required. All dependencies present.

**Version verification:** N/A — no new packages. All imports resolve to `workspace:*` internal packages or already-installed `catalog:` externals.

## Package Legitimacy Audit

Not applicable. This phase installs **no** external packages. All libraries are pre-existing workspace packages (`@plane/*` via `workspace:*`) or already-declared `catalog:` dependencies in `apps/web/package.json`. No registry verification required.

## Architecture Patterns

### System Architecture Diagram

```
                    Workspace Settings Sidebar
                    (item-categories.tsx filters by allowPermissions)
                              │
          ┌───────────────────┴────────────────────┐
          │  reads WORKSPACE_SETTINGS + GROUPED_    │
          │  WORKSPACE_SETTINGS + WORKSPACE_        │
          │  SETTINGS_ICONS (packages/constants)    │
          └───────────────────┬────────────────────┘
                              ▼
   Route table (apps/web/app/routes/core.ts) maps
   :workspaceSlug/settings/templates ──────────► List page.tsx + header.tsx
   :workspaceSlug/settings/templates/new ──────► Editor page.tsx (create)
   :workspaceSlug/settings/templates/:id/edit ─► Editor page.tsx (edit)
                              │
        ┌─────────────────────┴──────────────────────┐
        ▼                                              ▼
   LIST PAGE (admin gate)                        EDITOR PAGE (admin gate)
   useSWR(WORKSPACE_PROJECT_TEMPLATES) ──┐        react-hook-form + useFieldArray
     │                                    │        (name, description, 5 arrays)
     ▼                                    │              │
   split into System / Custom groups      │        on Save: slugify names → keys,
   render rows + actions                  │        resolve starter-issue refs,
     │  Edit / Duplicate / Deactivate     │        assemble TProjectTemplatePayload
     │  (⋮ menu = CustomMenu)             │              │
     ▼                                    ▼              ▼
   ┌──────────────────────────────────────────────────────────┐
   │  ProjectService (extends APIService, @/services/project)  │
   │  getProjectTemplates / createProjectTemplate /            │
   │  updateProjectTemplate / deactivateProjectTemplate /      │
   │  reactivateProjectTemplate / duplicateProjectTemplate     │
   └──────────────────────────┬───────────────────────────────┘
                              ▼
   Django API  /api/workspaces/<slug>/project-templates/[...]
   (already implemented — list/create/patch/delete/duplicate,
    admin-only writes, soft-deactivate, atomic payload validation)
```

### Recommended Project Structure

```
apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/
├── page.tsx                 # List page (admin-gated), mirrors webhooks/page.tsx
├── header.tsx               # Breadcrumb header, mirrors webhooks/header.tsx
├── new/
│   ├── page.tsx             # Editor in create mode
│   └── header.tsx
└── [templateId]/
    └── edit/
        ├── page.tsx         # Editor in edit mode (+ read-only for built-in "View")
        └── header.tsx

apps/web/core/components/project-templates/      # NEW component dir (mirror project-states/)
├── index.ts
├── list/
│   ├── root.tsx             # groups System vs Custom, Show-deactivated toggle
│   ├── template-row.tsx     # name + counts + actions
│   └── loader.tsx           # Loader.Item height="42px" rows
├── editor/
│   ├── root.tsx             # RHF provider, atomic save
│   ├── states-section.tsx
│   ├── labels-section.tsx
│   ├── modules-section.tsx
│   ├── cycles-section.tsx
│   └── starter-issues-section.tsx
├── deactivate-modal.tsx     # AlertModalCore wrapper
└── utils.ts                 # slugify/unique-key generation, payload assembly

apps/web/core/services/project/project.service.ts   # ADD 5 methods
packages/types/src/settings.ts                        # EXTEND TWorkspaceSettingsTabs
packages/types/src/project/project_templates.ts       # ADD write-payload type if needed
packages/constants/src/settings/workspace.ts          # ADD WORKSPACE_SETTINGS entry + group
packages/constants/src/fetch-keys.ts                  # ADD detail key if editing by id
apps/web/core/components/settings/workspace/sidebar/item-icon.tsx  # ADD icon
apps/web/app/routes/core.ts                           # ADD 3 routes
packages/i18n/src/locales/*/workspace-settings.json   # ADD project_templates namespace (19 locales)
```

### Pattern 1: Four-touchpoint settings-page registration

**What:** Adding a workspace settings page requires coordinated edits across a type, a constants map, an icon map, and the route table.
**When to use:** For the "Project Templates" nav entry (D-03).
**Exact diff-shaped edits (all verified against current source):**

1. `packages/types/src/settings.ts:13` — extend the union:

```typescript
// Source: packages/types/src/settings.ts:13 [VERIFIED]
export type TWorkspaceSettingsTabs =
  | "general"
  | "members"
  | "billing-and-plans"
  | "export"
  | "webhooks"
  | "project-templates"; // ADD
```

2. `packages/constants/src/settings/workspace.ts` — add to `WORKSPACE_SETTINGS` (after `webhooks`, line ~64) and to the `ADMINISTRATION` bucket of `GROUPED_WORKSPACE_SETTINGS` (line ~72):

```typescript
// Source: packages/constants/src/settings/workspace.ts:58-65,71-77 [VERIFIED]
"project-templates": {
  key: "project-templates",
  i18n_label: "workspace_settings.settings.project_templates.title",
  href: `/settings/templates`,
  access: [EUserWorkspaceRoles.ADMIN],   // admin-only per D-01/D-04
  highlight: (pathname, baseUrl) => pathname.startsWith(`${baseUrl}/settings/templates`),
},
// ...and inside GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION] array:
WORKSPACE_SETTINGS["project-templates"],
```

Note: use `pathname.startsWith(...)` (not strict `===`) so the entry stays highlighted on `/settings/templates/new` and `/edit`. Existing entries use strict `===` because they have no sub-routes.

3. `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx:8,13-19` — import icon + add map entry:

```typescript
// Source: item-icon.tsx [VERIFIED] — WORKSPACE_SETTINGS_ICONS: Record<TWorkspaceSettingsTabs, ...>
import { ArrowUpToLine, Building, CreditCard, LayoutTemplate, Users, Webhook } from "lucide-react";
// ...
"project-templates": LayoutTemplate,   // ADD (satisfies the Record — TS will error until added)
```

4. `apps/web/app/routes/core.ts` — add 3 routes inside the `(workspace)` layout array (after line 284, before the closing `]`):

```typescript
// Source: apps/web/app/routes/core.ts:263-285 [VERIFIED]
route(":workspaceSlug/settings/templates",
  "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/page.tsx"),
route(":workspaceSlug/settings/templates/new",
  "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/new/page.tsx"),
route(":workspaceSlug/settings/templates/:templateId/edit",
  "./(all)/[workspaceSlug]/(settings)/settings/(workspace)/templates/[templateId]/edit/page.tsx"),
```

**Compile-safety note:** `WORKSPACE_SETTINGS` (workspace.ts:29) and `WORKSPACE_SETTINGS_ICONS` (item-icon.tsx:13) are both typed `Record<TWorkspaceSettingsTabs, ...>`. Adding the union member in step 1 will produce TS errors in steps 2 and 3 until they are updated — this is the type system guiding completeness.

### Pattern 2: Admin-gated settings page

**What:** Two-layer gate — sidebar `access` array + in-page guard.
**Example (verified from webhooks/page.tsx):**

```typescript
// Source: apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx:38-60 [VERIFIED]
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { useUserPermissions } from "@/hooks/store/user";

const { workspaceUserInfo, allowPermissions } = useUserPermissions();
const canPerformWorkspaceAdminActions = allowPermissions(
  [EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE
);
// ...
if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
  return <NotAuthorizedView section="settings" className="h-auto" />;
}
```

`useUserPermissions` is exported from `apps/web/core/hooks/store/user/user-permissions.ts:13`, imported as `@/hooks/store/user`. `NotAuthorizedView` from `apps/web/core/components/auth-screens/not-authorized-view.tsx:24`. `EUserWorkspaceRoles.ADMIN` (for the sidebar `access` array) comes from `@plane/types`.

### Pattern 3: SWR list fetch through the service class

**Example (verified from template-select.tsx):**

```typescript
// Source: apps/web/ce/components/projects/create/template-select.tsx:19-67 [VERIFIED]
import { WORKSPACE_PROJECT_TEMPLATES } from "@plane/constants";
import { ProjectService } from "@/services/project";
const projectService = new ProjectService();

const {
  data: templates,
  error,
  isLoading,
  mutate,
} = useSWR(
  workspaceSlug ? WORKSPACE_PROJECT_TEMPLATES(workspaceSlug) : null,
  () => projectService.getProjectTemplates(workspaceSlug),
  { revalidateIfStale: false, revalidateOnFocus: false }
);
```

The management list can reuse the same `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)` key so mutations invalidate both the create-modal selector and the settings list consistently. After create/update/duplicate/deactivate, call `mutate(WORKSPACE_PROJECT_TEMPLATES(workspaceSlug))`.

### Pattern 4: react-hook-form nested arrays for the editor

**What:** One `useForm` per template; five `useFieldArray` for the sections.

```typescript
// Idiom composed from create-update-label-inline.tsx (RHF Controller + TwitterPicker)
// and existing useFieldArray usages (e.g. onboarding/invite-members.tsx) [CITED]
const {
  control,
  handleSubmit,
  watch,
  formState: { errors, isSubmitting },
} = useForm<TFormShape>({ defaultValues });
const states = useFieldArray({ control, name: "states" }); // .fields/.append/.remove/.move
const labels = useFieldArray({ control, name: "labels" });
const modules = useFieldArray({ control, name: "modules" });
const cycles = useFieldArray({ control, name: "cycles" });
const issues = useFieldArray({ control, name: "starter_issues" });
```

`useFieldArray` `.move(from, to)` handles drag reorder; the drag layer (`Sortable` or raw atlaskit) calls it in its `onChange`/`onDrop`. On submit, transform form values into `TProjectTemplatePayload` (slugify names → keys, resolve starter-issue name-selections → keys, set `schema_version: 1`).

### Anti-Patterns to Avoid

- **Inline axios/fetch in components.** All calls go through `ProjectService` (CONVENTIONS.md, verified: `template-select.tsx` uses the service).
- **Exposing raw `*_key` fields in the UI.** D-12 — keys are generated behind the scenes.
- **Section-by-section persistence.** D-10 — one atomic POST/PATCH.
- **Trusting client validation alone.** Backend `validate_project_template_payload` is authoritative; always surface its 400s inline.
- **Strict `===` highlight for a page with sub-routes.** Use `startsWith` so the nav stays active on `/new` and `/edit`.

## Don't Hand-Roll

| Problem                                               | Don't Build          | Use Instead                                                                            | Why                                                                  |
| ----------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Confirmation modal (deactivate)                       | Custom dialog        | `AlertModalCore` (`@plane/ui`)                                                         | Full props below; `variant="danger"` gives the danger button + icon. |
| Drag-to-reorder                                       | Manual pointer math  | `@plane/ui` `Sortable`/`Draggable`/`DragHandle` or raw `@atlaskit` (as project-states) | Edge detection, a11y, keyboard already handled.                      |
| Empty state                                           | Custom layout        | `EmptyStateCompact` (`@plane/propel/empty-state`)                                      | `assetKey`/`title`/`description`/`actions`/`align`/`rootClassName`.  |
| Loading skeleton                                      | Custom shimmer       | `Loader` + `Loader.Item height="42px"` (`@plane/ui`)                                   | Matches labels/webhooks rows.                                        |
| Toasts                                                | Custom notifications | `setToast` + `TOAST_TYPE` (`@plane/propel/toast`)                                      | Standard success/error.                                              |
| Enum dropdowns (state group, module status, priority) | Custom select        | `CustomSelect` + `CustomSelect.Option` (`@plane/ui`)                                   | Radix-backed, keyboard-operable.                                     |
| Row overflow (⋮) menu                                 | Custom popover       | `CustomMenu` + `CustomMenu.MenuItem` (`@plane/ui`)                                     | `onClick` per item.                                                  |
| Color picker                                          | Custom swatch grid   | `ColorPicker` (`@plane/ui`) or `TwitterPicker` in `Popover`                            | Both emit hex.                                                       |
| Form nested arrays + validation                       | Manual state trees   | `react-hook-form` `useFieldArray`                                                      | Already a dep; used 4× in repo.                                      |

**Key insight:** This feature is 90% composition of existing primitives. The only genuinely new logic is (a) the slugify/unique-key generator (none exists — see below) and (b) the payload assembly + client-side pre-validation.

## Common Pitfalls

### Pitfall 1: Backend cannot list or reactivate deactivated templates (BLOCKS D-06/D-07)

**What goes wrong:** D-06 ("Show deactivated") and D-07 ("Reactivate via PATCH `is_active=true`") are not achievable against the current backend.
**Why it happens (verified from source):**

- List queryset filters `is_active=True` on both branches: `apps/api/plane/app/views/workspace/project_template.py:37-40` — deactivated custom templates are never returned. `[VERIFIED: project_template.py:37-40]`
- `_get_writable_template` (used by `partial_update` and `destroy`) rejects any row where `not candidate.is_active` with a 404: `project_template.py:60-68`. So a PATCH to reactivate a deactivated template returns 404 before it can flip `is_active` back to true. `[VERIFIED: project_template.py:60-68]`
- The `ProjectTemplateWriteSerializer` _does_ include `is_active` as a writable field (`serializers/project_template.py:629`), so the serializer would accept `is_active=true` — but the view-layer lookup blocks the request from reaching it. `[VERIFIED: serializers/project_template.py:613-634]`
  **How to avoid:** Escalate to planning. Options: (a) a small backend change — add an `?include_inactive=true` list param and relax `_get_writable_template` to allow reactivation of inactive custom rows; or (b) descope D-06/D-07 for this phase (deactivate becomes terminal in-UI, reactivation deferred). This contradicts the "frontend-only" framing and is the single most important open item. **Do not silently ship a reactivate button that 404s.**
  **Warning signs:** A "Show deactivated" toggle that always shows an empty list; a Reactivate action that toasts an error.

### Pitfall 2: Reference-key drift between name edits and starter-issue references

**What goes wrong:** Admin defines a state "Todo" (key `todo`), references it in a starter issue, then renames the state to "To Do". If keys are regenerated from the new name (`to-do`) on every keystroke, the starter-issue reference (`todo`) dangles and the backend rejects the payload (`references unknown state_key`).
**Why it happens:** D-12 auto-generates keys from names; D-13 references resolve to keys.
**How to avoid:** Generate a _stable_ key once when the item is first added (store it in the form field alongside the name), keep it stable across name edits, and only enforce uniqueness at add-time / collision-time. Resolve starter-issue reference dropdowns against the _current in-editor items by their stable field id_, mapping to keys at submit. Do not recompute keys from names at submit time.
**Warning signs:** Backend 400 `starter_issues ... references unknown state_key` after a rename.

### Pitfall 3: "Exactly one default state" not enforced client-side

**What goes wrong:** Backend rejects with `states: "Exactly one state must have default=True"` (`serializers/project_template.py:447-450`) `[VERIFIED]`.
**How to avoid:** Model the default as a single radio-style selection across the states array (selecting one clears the others). Block save if zero states or zero defaults. Also enforce: unique state names, unique labels names, unique sequences/orders (backend also rejects duplicate `sequence`/`order` — lines 434-437, 475-476).

### Pitfall 4: `start_offset_days > target_offset_days` on cycles

**What goes wrong:** Backend rejects (`serializers/project_template.py:363-376`) `[VERIFIED]`. Applies to both modules and cycles date metadata.
**How to avoid:** Validate `start_offset_days <= target_offset_days` in the cycles section before enabling save; surface inline.

### Pitfall 5: Non-hex color slips through

**What goes wrong:** Backend requires strict `#RRGGBB` (6 hex digits) — `serializers/project_template.py:48,315,379-381` `[VERIFIED]`. Note `TwitterPicker` in labels uses `LABEL_COLOR_OPTIONS` and defaults `color: "var(--text-color-secondary)"` (create-update-label-inline.tsx:42) — a CSS var, NOT a hex. If you copy that default, submit fails.
**How to avoid:** Default new items to a real hex (e.g. `getRandomLabelColor()` returns a hex, or seed from `LABEL_COLOR_OPTIONS`). Validate `^#[0-9a-fA-F]{6}$` before save. `@plane/ui` `ColorPicker` (native `<input type=color>`) always emits `#rrggbb`, avoiding this trap.

### Pitfall 6: `schema_version` omitted from payload

**What goes wrong:** Backend requires `schema_version === 1` (`serializers/project_template.py:398-402`) `[VERIFIED]`. The type `TProjectTemplatePayload.schema_version` is required.
**How to avoid:** Always set `schema_version: 1` when assembling the payload. Consider a `PROJECT_TEMPLATE_SCHEMA_VERSION` constant on the frontend.

### Pitfall 7: 400 error shape differs from label/webhook forms

**What goes wrong:** The label form maps errors from `error.name` etc. But `validate_project_template_payload` raises a `ValidationError(errors)` where `errors` is a **list of single-key dicts** (e.g. `[{"states": "..."}, {"cycles": "..."}]`) — see `serializers/project_template.py:574-576` `[VERIFIED]`. The service rethrows `error?.response?.data` (project.service.ts:40). So the frontend receives an array, not a keyed object.
**How to avoid:** Write a dedicated error-mapper that iterates the array and routes each `{section: message}` to the right section/row. Fall back to a generic toast for unrecognized shapes.

## Code Examples

### `AlertModalCore` (deactivate confirm)

```typescript
// Source: packages/ui/src/modals/alert-modal.tsx:19-73 [VERIFIED]
// Props: content, handleClose, handleSubmit, isSubmitting, isOpen, title,
//        variant?: "danger"|"primary" (default "danger"),
//        primaryButtonText?: {loading; default}, secondaryButtonText?, width?
import { AlertModalCore } from "@plane/ui";
<AlertModalCore
  isOpen={isOpen}
  handleClose={() => setOpen(false)}
  handleSubmit={handleDeactivate}
  isSubmitting={isDeactivating}
  title={t("workspace_settings.settings.project_templates.deactivate.title")}
  content={t("workspace_settings.settings.project_templates.deactivate.body")}
  variant="danger"
  primaryButtonText={{ loading: t("common.deactivating"), default: t("common.deactivate") }}
/>
```

### `EmptyStateCompact`

```typescript
// Source: packages/propel/src/empty-state/compact-empty-state.tsx:14-25 [VERIFIED]
// Props: asset|assetKey, title, description, actions[{label,onClick,variant?}], align, rootClassName, assetClassName, customButton
import { EmptyStateCompact } from "@plane/propel/empty-state";
<EmptyStateCompact
  assetKey="template"        // confirm a matching compact asset key exists; else use asset/customButton
  title={t("...no_custom_templates_title")}
  description={t("...no_custom_templates_body")}
  actions={[{ label: t("...new_template"), onClick: goToNew }]}
  align="start"
  rootClassName="py-20"
/>
```

### `Sortable` (flat ordered list — labels-style)

```typescript
// Source: packages/ui/src/sortable/sortable.tsx:14-21,65 [VERIFIED]
// Props: data, render(item,index), onChange(newData, movedItem?), keyExtractor(item,index), containerClassName?, id?
import { Sortable } from "@plane/ui";
<Sortable
  data={labels.fields}
  keyExtractor={(l) => l.id}          // RHF field id
  onChange={(newData) => reorderLabels(newData)}   // map to useFieldArray order
  render={(label, index) => <LabelRow ... />}
/>
```

For grouped/edge-precise reorder (states grouped by state group), copy the raw `@atlaskit` pattern from `apps/web/core/components/project-states/state-item.tsx:69-118` (`draggable` + `dropTargetForElements` + `attachClosestEdge`/`extractClosestEdge`). `DragHandle` (`@plane/ui`, `packages/ui/src/drag-handle.tsx`) props: `{ className?, disabled? }`.

### `CustomSelect` (enum dropdowns + starter-issue reference dropdowns)

```typescript
// Source: packages/ui/src/dropdowns/custom-select.tsx + helper.tsx:64-101 [VERIFIED]
// ICustomSelectProps: value, onChange, label, input?, maxHeight?, disabled?, buttonClassName?, placement?
// ICustomSelectItemProps: value, children
import { CustomSelect } from "@plane/ui";
<CustomSelect value={group} label={GROUP_LABELS[group]} onChange={(v) => setGroup(v)} input>
  {STATE_GROUPS.map((g) => (
    <CustomSelect.Option key={g} value={g}>{GROUP_LABELS[g]}</CustomSelect.Option>
  ))}
</CustomSelect>
```

Enum value sources (verified from `packages/types/src/project/project_templates.ts:9-13`): state groups `backlog|unstarted|started|completed|cancelled|triage`; module statuses `backlog|planned|in-progress|paused|completed|cancelled`; priorities `urgent|high|medium|low|none`.

### `CustomMenu` (row overflow ⋮)

```typescript
// Source: packages/ui/src/dropdowns/custom-menu.tsx:540 (CustomMenu.MenuItem), helper.tsx:92-95 [VERIFIED]
import { CustomMenu } from "@plane/ui";
<CustomMenu ellipsis>
  <CustomMenu.MenuItem onClick={handleDeactivate}>{t("...deactivate")}</CustomMenu.MenuItem>
</CustomMenu>
```

### Five new `ProjectService` methods (matching existing style)

```typescript
// Source pattern: apps/web/core/services/project/project.service.ts:28-42 [VERIFIED]
// Class extends APIService (super(API_BASE_URL)); methods use this.post/patch/delete/get
// and rethrow error?.response?.data (getProjectTemplates convention) — keep consistent.

async createProjectTemplate(workspaceSlug: string, data: TProjectTemplateWritePayload): Promise<TProjectTemplate> {
  return this.post(`/api/workspaces/${workspaceSlug}/project-templates/`, data)
    .then((r) => r?.data).catch((e) => { throw e?.response?.data; });
}
async updateProjectTemplate(workspaceSlug: string, templateId: string, data: Partial<TProjectTemplateWritePayload>): Promise<TProjectTemplate> {
  return this.patch(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`, data)
    .then((r) => r?.data).catch((e) => { throw e?.response?.data; });
}
async deactivateProjectTemplate(workspaceSlug: string, templateId: string): Promise<void> {   // DELETE = soft deactivate, 204
  return this.delete(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`)
    .then((r) => r?.data).catch((e) => { throw e?.response?.data; });
}
async reactivateProjectTemplate(workspaceSlug: string, templateId: string): Promise<TProjectTemplate> {  // PATCH is_active=true — SEE PITFALL 1 (backend 404s today)
  return this.patch(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/`, { is_active: true })
    .then((r) => r?.data).catch((e) => { throw e?.response?.data; });
}
async duplicateProjectTemplate(workspaceSlug: string, templateId: string, name?: string): Promise<TProjectTemplate> {
  return this.post(`/api/workspaces/${workspaceSlug}/project-templates/${templateId}/duplicate/`, name ? { name } : {})
    .then((r) => r?.data).catch((e) => { throw e?.response?.data; });
}
```

### Slugify/unique-key generator (NONE EXISTS — must be added)

```typescript
// No slugify/kebab helper found in packages/utils (only validateSlug at validation.ts:199).
// Add a small util in components/project-templates/utils.ts:
export function slugifyKey(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || "item"
  );
}
export function uniqueKey(base: string, taken: Set<string>): string {
  let key = base,
    i = 2;
  while (taken.has(key)) key = `${base}_${i++}`;
  return key;
}
```

## State of the Art

| Old Approach                                         | Current Approach                                                                 | When Changed | Impact                                                                                  |
| ---------------------------------------------------- | -------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------- | --------- | -------- | ----- | ---- | ---------- | ------------------------- | ---- | --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Manual `useState` forms (project-states `StateForm`) | react-hook-form + `Controller` (labels `CreateUpdateLabelInline`, webhooks form) | recent       | Prefer RHF for the new editor (Claude's Discretion in D + CONTEXT notes RHF preferred). |
| `@plane/ui` deprecated button                        | `@plane/propel/button` `Button`                                                  | current      | Import `Button` from `@plane/propel/button`. Variants: `primary                         | secondary | tertiary | ghost | link | error-fill | error-outline`; sizes `sm | base | lg  | xl`. `[VERIFIED: packages/propel/src/button/helper.tsx:14-34]`(Note: no literal`"neutral"`/`"danger"`variant — UI-SPEC's "neutral"/"danger" map to`secondary`/`error-fill`.) |

**Deprecated/outdated:**

- The UI-SPEC references `Button variant="neutral"` / `"danger"`. The actual `TButtonVariant` has no `neutral`/`danger`; use `secondary` (neutral) and `error-fill` (danger). `[VERIFIED: helper.tsx:14-34]`

## Assumptions Log

| #   | Claim                                                                                                                                           | Section             | Risk if Wrong                                                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1  | `LayoutTemplate` is an available `lucide-react` icon and the appropriate choice for the settings entry.                                         | Pattern 1           | Low — Claude's Discretion; swap icon if unavailable. TS/import error is immediate and local.                                                               |
| A2  | A compact empty-state `assetKey` exists for templates (e.g. `"template"`).                                                                      | Code Examples       | Low — if absent, use `asset`/`customButton` prop instead; verify against `packages/propel/src/empty-state/assets/asset-registry`.                          |
| A3  | Reusing the existing `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)` SWR key for the management list is acceptable (vs a distinct key).            | Pattern 3           | Low — reuse keeps caches in sync; a distinct detail key may still be added for the editor.                                                                 |
| A4  | The `is_active` filtering behavior is intended/stable (not an oversight the team already patched elsewhere).                                    | Pitfall 1           | Medium — this is the phase's biggest risk; confirmed by reading current source, but backend may be revised. Planner must decide backend-change vs descope. |
| A5  | Adding a `project_templates` i18n namespace (per UI-SPEC) is correct even though a legacy `templates` node exists in `workspace-settings.json`. | Environment/Sources | Low — the existing `templates` node is an unrelated EE feature; using a new `project_templates` key avoids collision.                                      |

## Open Questions (RESOLVED)

1. **Reactivate/Show-deactivated vs backend `is_active=True` filter (Pitfall 1).**
   - What we know: List and writable-lookup both require `is_active=True` (verified). Serializer allows writing `is_active`.
   - What's unclear: Whether the phase is permitted to touch the backend (framing says frontend-only).
   - Recommendation: Escalate before planning locks D-06/D-07. Cleanest fix is a tiny backend change (`?include_inactive` list param + relax `_get_writable_template` for reactivation). Otherwise descope D-06/D-07 to "deactivate is terminal in-UI" for this phase.
   - **RESOLVED:** Backend change approved and scoped — D-14 (opt-in `?include_inactive` list param) and D-15 (dedicated admin-only `reactivate` action) lock this in, implemented in Plan 04-01 (`get_queryset` include_inactive branch + `reactivate` viewset action + contract tests). `_get_writable_template` stays active-only; reactivate deliberately accepts inactive rows.

2. **Do we need a distinct write-payload type?**
   - What we know: `TProjectTemplate` is the read shape; the write serializer accepts `name, description, template_type, is_active, payload, offset fields`.
   - Recommendation: Add `TProjectTemplateWritePayload` (subset of `TProjectTemplate`: `name, description, template_type: "custom", payload, start/target/duration offsets, is_active?`) to `packages/types/src/project/project_templates.ts`. Keep it minimal.
   - **RESOLVED:** Yes — `TProjectTemplateWritePayload` is added in Plan 04-03 Task 1 (the minimal write subset described here), consumed by `assemblePayload` and the editor service calls.

3. **Read-only "View" for built-ins.**
   - Recommendation: Reuse the editor route in a `readOnly` mode (disable all inputs, hide Save) — least code, matches D-08. A lighter preview panel is also acceptable (Claude's Discretion).
   - **RESOLVED:** Reuse the editor route in read-only mode — the edit page renders read-only/disabled when the loaded template `is_system` (Plan 04-03 Task 2), and the built-in row's "View" action navigates to that read-only editor route (Plan 04-05 Task 1).

## Environment Availability

Skipped — this is a code/config-only frontend phase with no new external tools, services, or runtimes. All build/type-check tooling (pnpm, turbo, tsc, oxlint, oxfmt) is already the project standard.

## Validation Architecture

Skipped — `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json:24` `[VERIFIED]`. Type-safety verification per VER-05 style is covered by the commands in Sources/Verification below.

## Verification Commands

Run from repo root. Turbo scopes to changed packages; targeted `--filter` runs are faster for iteration. `[VERIFIED: turbo.json:48-59, package.json check scripts]`

```bash
# Full gate (format + lint + types) across affected packages
pnpm check

# Targeted type-checks (fastest signal for this phase's touched packages)
pnpm --filter=@plane/types check:types        # TWorkspaceSettingsTabs change
pnpm --filter=@plane/constants check:types     # WORKSPACE_SETTINGS change
pnpm --filter=web check:types                  # runs `react-router typegen && tsc --noEmit`

# Lint / format for touched packages
pnpm --filter=web check:lint
pnpm --filter=web check:format
pnpm fix                                        # auto-fix format+lint before commit
```

Notes: `apps/web` type-check is `react-router typegen && tsc --noEmit` (`apps/web/package.json:14`) — the typegen step regenerates route types, required after adding routes to `core.ts`. `apps/web` lint runs with `--max-warnings=11957` (a high baseline); do not add new warnings. There is no frontend unit-test runner configured for this feature (nyquist off); type-check + lint are the verification gate.

## Security Domain

`security_enforcement: true`, `security_asvs_level: 1` `[VERIFIED: config.json:46-47]`.

### Applicable ASVS Categories

| ASVS Category                  | Applies | Standard Control                                                                                                                                                                                                                                                                          |
| ------------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1 Architecture                | yes     | Frontend defense-in-depth only; backend is the authoritative access-control boundary.                                                                                                                                                                                                     |
| V4 Access Control              | yes     | Admin-only gate via `useUserPermissions` + `allowPermissions([ADMIN], WORKSPACE)` + `NotAuthorizedView` (client). Backend independently enforces admin-only writes (`@allow_permission(allowed_roles=[ROLE.ADMIN])`, verified). The UI gate is UX, not security — never the sole control. |
| V5 Input Validation            | yes     | Client pre-validates (one default state, hex color, enum selects, offset ordering, unique names) but backend `validate_project_template_payload` is authoritative. Surface backend 400s; never bypass.                                                                                    |
| V6 Cryptography                | no      | No secrets/crypto in this feature.                                                                                                                                                                                                                                                        |
| V2 Authentication / V3 Session | no      | Handled by existing app auth; no changes.                                                                                                                                                                                                                                                 |

### Known Threat Patterns for React + REST client

| Pattern                                     | STRIDE                 | Standard Mitigation                                                                                                                                                   |
| ------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Non-admin reaching the page via direct URL  | Elevation of Privilege | In-page `allowPermissions` guard (client) + backend admin-only writes (authoritative). Verified both layers exist.                                                    |
| Malformed/oversized template payload        | Tampering / DoS        | Backend strict validation (verified); client pre-checks reduce round-trips. Cap array sizes / string lengths in the editor to match backend `max_length=255` on name. |
| Rendering template names/descriptions       | XSS                    | React auto-escapes; do not use `dangerouslySetInnerHTML` for template-supplied strings.                                                                               |
| Reference-key injection via crafted payload | Tampering              | Keys are generated client-side and re-validated server-side (`references unknown *_key`); resolvability enforced by backend.                                          |

## Sources

### Primary (HIGH confidence — read in this session)

- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx` + `header.tsx` — admin-gated settings page + breadcrumb header analog.
- `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/exports/page.tsx` — member-gated full-page settings (no-modal) analog.
- `apps/web/app/routes/core.ts:263-285` — workspace settings route registration.
- `packages/constants/src/settings/workspace.ts` — `WORKSPACE_SETTINGS`, `GROUPED_WORKSPACE_SETTINGS`, categories.
- `packages/types/src/settings.ts:13-20` — `TWorkspaceSettingsTabs`, `TWorkspaceSettingsItem`.
- `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx` — `WORKSPACE_SETTINGS_ICONS`.
- `packages/types/src/project/project_templates.ts` — full template type shapes.
- `apps/web/core/services/project/project.service.ts` — `APIService` base, `getProjectTemplates` signature, error convention; `index.ts` re-exports `ProjectService`.
- `packages/constants/src/fetch-keys.ts:61-62` — `WORKSPACE_PROJECT_TEMPLATES`.
- `apps/web/ce/components/projects/create/template-select.tsx` — SWR + service fetch idiom.
- `apps/api/plane/app/urls/workspace.py:263-281` — endpoint verbs/paths.
- `apps/api/plane/app/views/workspace/project_template.py` — verb→role matrix, soft-deactivate, `is_active` filter (Pitfall 1).
- `apps/api/plane/app/serializers/project_template.py` — read/write/duplicate serializers + `validate_project_template_payload` rules.
- `apps/web/core/components/project-states/` (`group-list.tsx`, `state-item.tsx`, `create-update/form.tsx`, `options/delete.tsx`) — reorderable list + form + overflow patterns.
- `apps/web/core/components/labels/` (`create-update-label-inline.tsx`, `project-setting-label-list.tsx`) — RHF inline CRUD + color picker + list scaffold.
- `packages/ui/src/sortable/sortable.tsx`, `drag-handle.tsx`, `modals/alert-modal.tsx`, `color-picker/color-picker.tsx`, `dropdowns/custom-select.tsx`, `dropdowns/custom-menu.tsx`, `dropdowns/helper.tsx` — primitive prop signatures.
- `packages/propel/src/empty-state/compact-empty-state.tsx`, `packages/propel/src/button/helper.tsx` — EmptyStateCompact + Button variants.
- `apps/web/core/components/settings/heading.tsx` — `SettingsHeading` (`variant: h3|h4|h6`).
- `packages/i18n/src/locales/en/workspace-settings.json` — i18n namespace structure (19 locale dirs).
- `.planning/config.json` — nyquist off, security_enforcement on (ASVS L1).
- `turbo.json`, `apps/web/package.json`, `packages/types/package.json`, `packages/constants/package.json` — verification commands.

### Secondary / Tertiary

- None. All findings are from direct source reads; no web search required for a brownfield internal-code phase.

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — every dependency confirmed present in `apps/web/package.json`; all imports resolve to existing packages.
- Architecture / registration diffs: HIGH — all four touchpoints read at exact line numbers; edits are type-checkable.
- Backend contract: HIGH — URLs, verbs, serializer fields, and validation rules read directly. Pitfall 1 (`is_active` filter) verified in view source.
- Pitfalls: HIGH — each backend rule cited to serializer line numbers.
- Editor form approach: MEDIUM-HIGH — RHF + `useFieldArray` is confirmed available and used elsewhere; the exact per-section drag wiring is a design choice left to planning.

**Research date:** 2026-07-01
**Valid until:** 2026-07-31 (stable internal codebase; re-verify Pitfall 1 if the backend is touched before planning).
