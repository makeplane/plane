# Phase 4: Workspace Template Management - Pattern Map

**Mapped:** 2026-07-01
**Files analyzed:** 20 new/modified files
**Analogs found:** 20 / 20 (18 exact/role-match, 2 net-new logic with cited idioms)

> This phase is a brownfield frontend build plus a small backend slice. The load-bearing value below is the exact existing files to copy from, with real excerpts. Where RESEARCH.md already pasted an excerpt (e.g. the 5 service methods, the 4-touchpoint diffs), this doc references/condenses rather than re-deriving, and adds the analogs RESEARCH did not fully paste (row actions, delete-modal, group-list, backend viewset/test).

---

## File Classification

### Registration touchpoints (config — modify)

| Modified File                                                       | Role   | Data Flow | Closest Analog                                   | Match Quality |
| ------------------------------------------------------------------- | ------ | --------- | ------------------------------------------------ | ------------- |
| `packages/types/src/settings.ts`                                    | type   | —         | `TWorkspaceSettingsTabs` (same file, line 13)    | exact (self)  |
| `packages/constants/src/settings/workspace.ts`                      | config | —         | `webhooks` entry (same file, 58-64 + 79)         | exact (self)  |
| `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx` | config | —         | `webhooks: Webhook` (same file, line 18)         | exact (self)  |
| `apps/web/app/routes/core.ts`                                       | route  | —         | webhooks routes (same file, 277-284)             | exact (self)  |
| `packages/constants/src/fetch-keys.ts`                              | config | —         | `WORKSPACE_PROJECT_TEMPLATES` (same file, 61-62) | exact (self)  |
| `packages/types/src/project/project_templates.ts`                   | type   | —         | existing types (same file)                       | exact (self)  |

### Frontend pages (create)

| New File                                                 | Role               | Data Flow                   | Closest Analog                        | Match Quality |
| -------------------------------------------------------- | ------------------ | --------------------------- | ------------------------------------- | ------------- |
| `.../(workspace)/templates/page.tsx`                     | component (page)   | request-response (SWR list) | `.../(workspace)/webhooks/page.tsx`   | exact         |
| `.../(workspace)/templates/header.tsx`                   | component          | —                           | `.../(workspace)/webhooks/header.tsx` | exact         |
| `.../(workspace)/templates/new/page.tsx`                 | component (editor) | request-response (POST)     | webhooks page + labels/states editors | role-match    |
| `.../(workspace)/templates/new/header.tsx`               | component          | —                           | webhooks/header.tsx                   | exact         |
| `.../(workspace)/templates/[templateId]/edit/page.tsx`   | component (editor) | request-response (PATCH)    | webhooks page + labels/states editors | role-match    |
| `.../(workspace)/templates/[templateId]/edit/header.tsx` | component          | —                           | webhooks/header.tsx                   | exact         |

### Frontend components (create — `apps/web/core/components/project-templates/`)

| New File                            | Role      | Data Flow                            | Closest Analog                                                             | Match Quality |
| ----------------------------------- | --------- | ------------------------------------ | -------------------------------------------------------------------------- | ------------- |
| `list/root.tsx`                     | component | request-response                     | `labels/project-setting-label-list.tsx`                                    | exact         |
| `list/template-row.tsx`             | component | event-driven (row actions)           | `web-hooks/webhooks-list-item.tsx` + `project-states/state-item-title.tsx` | role-match    |
| `list/loader.tsx`                   | component | —                                    | `labels` Loader block (label-list.tsx 163-168)                             | exact         |
| `deactivate-modal.tsx`              | component | request-response (DELETE)            | `project-states/state-delete-modal.tsx`                                    | exact         |
| `editor/root.tsx`                   | component | request-response (atomic POST/PATCH) | `labels/create-update-label-inline.tsx` (RHF)                              | role-match    |
| `editor/states-section.tsx`         | component | event-driven (reorder)               | `project-states/state-item.tsx` + `group-list.tsx`                         | role-match    |
| `editor/labels-section.tsx`         | component | event-driven (reorder)               | `labels/label-drag-n-drop-HOC.tsx` + inline form                           | role-match    |
| `editor/modules-section.tsx`        | component | CRUD (in-memory)                     | `project-states/create-update/form.tsx`                                    | role-match    |
| `editor/cycles-section.tsx`         | component | CRUD (in-memory)                     | `project-states/create-update/form.tsx`                                    | role-match    |
| `editor/starter-issues-section.tsx` | component | CRUD (in-memory)                     | `CustomSelect` idiom (RESEARCH Code Examples)                              | partial       |
| `utils.ts`                          | utility   | transform (slugify/assembly)         | none — new (idiom in RESEARCH 503-523)                                     | no-analog     |

### Frontend service (modify)

| Modified File                                       | Role    | Data Flow | Closest Analog                           | Match Quality |
| --------------------------------------------------- | ------- | --------- | ---------------------------------------- | ------------- |
| `apps/web/core/services/project/project.service.ts` | service | CRUD      | `getProjectTemplates` (same file, 36-42) | exact (self)  |

### Backend slice (modify + create — D-14/D-15)

| File                                                              | Role                 | Data Flow | Closest Analog                                                 | Match Quality |
| ----------------------------------------------------------------- | -------------------- | --------- | -------------------------------------------------------------- | ------------- |
| `apps/api/plane/app/views/workspace/project_template.py`          | controller (viewset) | CRUD      | existing `list`/`destroy`/`_get_writable_template` (same file) | exact (self)  |
| `apps/api/plane/app/urls/workspace.py`                            | route                | —         | duplicate route (same file, 278-282)                           | exact (self)  |
| `apps/api/plane/tests/contract/app/test_project_templates_app.py` | test                 | —         | existing contract tests (same file)                            | exact (self)  |

---

## Pattern Assignments

### `templates/page.tsx` (list page, request-response)

**Analog:** `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/page.tsx`

This is the closest end-to-end admin-gated workspace settings list page. Copy: `observer` wrap, `Route.ComponentProps` params, the admin gate, `SettingsContentWrapper header={...}`, `PageHead`, `SettingsHeading` with a primary button in `control`, and the empty/loading branches. Swap the webhook store hook for a `useSWR(WORKSPACE_PROJECT_TEMPLATES(...))` call (see Shared Pattern: SWR list fetch).

**Imports + admin gate + shell** (webhooks/page.tsx:7-65):

```typescript
import { observer } from "mobx-react";
import useSWR from "swr";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { EmptyStateCompact } from "@plane/propel/empty-state";
import { NotAuthorizedView } from "@/components/auth-screens/not-authorized-view";
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
import { SettingsContentWrapper } from "@/components/settings/content-wrapper";
import { useUserPermissions } from "@/hooks/store/user";
import type { Route } from "./+types/page";

function TemplatesListPage({ params }: Route.ComponentProps) {
  const { workspaceSlug } = params;
  const { workspaceUserInfo, allowPermissions } = useUserPermissions();
  const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  // ...SWR fetch...
  if (workspaceUserInfo && !canPerformWorkspaceAdminActions) {
    return <NotAuthorizedView section="settings" className="h-auto" />;
  }
  // ...
  return (
    <SettingsContentWrapper header={<ProjectTemplatesSettingsHeader />}>
      <PageHead title={pageTitle} />
      <SettingsHeading
        title={t("workspace_settings.settings.project_templates.title")}
        description={t("workspace_settings.settings.project_templates.description")}
        control={
          <Button variant="primary" size="lg" onClick={goToNew}>
            {t("workspace_settings.settings.project_templates.new_template")}
          </Button>
        }
      />
      {/* two-section list root */}
    </SettingsContentWrapper>
  );
}
export default observer(TemplatesListPage);
```

**Editor pages** (`new/page.tsx`, `[templateId]/edit/page.tsx`): reuse the same `observer` + `Route.ComponentProps` + admin-gate + `SettingsContentWrapper` shell. Use `SettingsContentWrapper` in **hugging** mode per UI-SPEC (editor needs full width). Navigate on success/cancel back to `/${workspaceSlug}/settings/templates`.

---

### `templates/header.tsx` (breadcrumb header)

**Analog:** `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/webhooks/header.tsx` — copy nearly verbatim, swapping the `.webhooks` key for `["project-templates"]`.

**Full pattern** (webhooks/header.tsx:7-42):

```typescript
import { observer } from "mobx-react";
import { WORKSPACE_SETTINGS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Breadcrumbs } from "@plane/ui";
import { BreadcrumbLink } from "@/components/common/breadcrumb-link";
import { SettingsPageHeader } from "@/components/settings/page-header";
import { WORKSPACE_SETTINGS_ICONS } from "@/components/settings/workspace/sidebar/item-icon";

export const ProjectTemplatesSettingsHeader = observer(function ProjectTemplatesSettingsHeader() {
  const { t } = useTranslation();
  const settingsDetails = WORKSPACE_SETTINGS["project-templates"]; // NOTE: bracket access (hyphenated key)
  const Icon = WORKSPACE_SETTINGS_ICONS["project-templates"];
  return (
    <SettingsPageHeader
      leftItem={
        <div className="flex items-center gap-2">
          <Breadcrumbs>
            <Breadcrumbs.Item
              component={<BreadcrumbLink label={t(settingsDetails.i18n_label)} icon={<Icon className="size-4 text-tertiary" />} />}
            />
          </Breadcrumbs>
        </div>
      }
    />
  );
});
```

Editor headers add a second `Breadcrumbs.Item` (Project Templates → New / Edit) — same primitives.

---

### `list/root.tsx` (two-section grouped list, request-response)

**Analog:** `apps/web/core/components/labels/project-setting-label-list.tsx`

Copy the list-scaffold shape: `EmptyStateCompact` when the custom group is empty, `Loader` skeleton while loading, and a modal held in local state (`selectDeleteLabel` → `selectDeactivateTemplate`). Split the SWR result into two arrays by `template_type === "built_in"` (or `is_system`) vs `custom`. Render "System templates" then "Custom templates" sections. The "Show deactivated" toggle lives in the custom section header (D-06).

**Loader + empty + modal-in-state scaffold** (project-setting-label-list.tsx:76-171):

```typescript
<DeleteLabelModal isOpen={!!selectDeleteLabel} data={selectDeleteLabel ?? null} onClose={() => setSelectDeleteLabel(null)} />
{projectLabels ? (
  projectLabels.length === 0 ? (
    <EmptyStateCompact assetKey="label" title={t(...)} description={t(...)}
      actions={[{ label: t(...), onClick: newLabel }]} align="start" rootClassName="py-20" />
  ) : ( /* rows */ )
) : (
  <Loader className="space-y-5">
    <Loader.Item height="42px" /> <Loader.Item height="42px" />
  </Loader>
)}
```

**Grouped-section container** (from `project-states/group-list.tsx:61-84` — the "iterate groups, render a section per group" idiom for the System/Custom split):

```typescript
<div className={cn("space-y-5", groupListClassName)}>
  {Object.entries(groupedStates).map(([key, value]) => ( <GroupItem key={key} .../> ))}
</div>
```

---

### `list/template-row.tsx` (row + action affordances, event-driven)

**Analogs:** `web-hooks/webhooks-list-item.tsx` (row container + navigation) and `project-states/state-item-title.tsx` (per-row hover action cluster).

**Row container** (webhooks-list-item.tsx:31-43) — bordered `bg-layer-*` row, truncated primary name (`text-body-sm-medium`), right-aligned control:

```typescript
<div className="rounded-lg border border-subtle bg-layer-2 px-4 py-3">
  <div className="flex items-center justify-between gap-4">
    <h5 className="truncate text-body-sm-medium">{template.name}</h5>
    <div className="shrink-0">{/* actions */}</div>
  </div>
</div>
```

**Hover action cluster** (state-item-title.tsx:64-90) — the pattern for Edit / (⋮) actions revealed on `group-hover`; note the wrapping row must carry the `group` class:

```typescript
{!disabled && (
  <div className="hidden items-center gap-2 group-hover:flex">
    <button className="flex h-5 w-5 ... hover:bg-layer-1 hover:text-primary" onClick={() => setUpdateStateModal(true)}>
      <EditIcon className="h-3 w-3" />
    </button>
    <StateDelete ... />
  </div>
)}
```

**Overflow (⋮) menu** — use `CustomMenu` per RESEARCH Code Examples (custom-menu.tsx:540):

```typescript
import { CustomMenu } from "@plane/ui";
<CustomMenu ellipsis>
  <CustomMenu.MenuItem onClick={handleDeactivate}>{t("...deactivate")}</CustomMenu.MenuItem>
</CustomMenu>
```

Row-action matrix per D-07/D-08 (UI-SPEC Copywriting): custom-active = Edit · Duplicate · (⋮ Deactivate); custom-deactivated = Reactivate · (⋮ Edit/Duplicate); built-in = Duplicate · View. Built-in rows carry muted `text-tertiary` metadata and **no** edit controls (UI-SPEC Color: provenance by heading, not tint).

---

### `deactivate-modal.tsx` (confirm, request-response DELETE)

**Analog:** `apps/web/core/components/project-states/state-delete-modal.tsx` — copy the `AlertModalCore` wrapper, local `isSubmitting` state, `.then(handleClose).catch(toast).finally(...)` flow. Swap `deleteState` for `projectService.deactivateProjectTemplate` + `mutate(WORKSPACE_PROJECT_TEMPLATES(slug))`.

**Full pattern** (state-delete-modal.tsx:24-80):

```typescript
export const StateDeleteModal = observer(function StateDeleteModal(props) {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const handleDeletion = async () => {
    setIsDeleteLoading(true);
    await deleteState(...).then(handleClose)
      .catch((err) => setToast({ type: TOAST_TYPE.ERROR, title: "Error!", message: "..." }))
      .finally(() => setIsDeleteLoading(false));
  };
  return (
    <AlertModalCore
      handleClose={handleClose} handleSubmit={handleDeletion}
      isSubmitting={isDeleteLoading} isOpen={isOpen}
      title="Delete State" content={<>...</>} />
  );
});
```

For deactivate, pass `variant="danger"` and `primaryButtonText={{ loading, default }}` (RESEARCH Code Examples, alert-modal.tsx:19-73). Copy strings from UI-SPEC: "Deactivate template?" / body / "Deactivate" / "Cancel". Reactivate reuses the same modal shell with primary/neutral variant.

---

### `editor/root.tsx` (atomic single save, request-response)

**Analog:** `apps/web/core/components/labels/create-update-label-inline.tsx` — the repo's RHF reference (`Controller` + `useForm` + submit → service → toast + `reset`). Per RESEARCH Pattern 4, scale this to one `useForm<TFormShape>` plus five `useFieldArray` for the sections; on submit assemble `TProjectTemplatePayload` via `utils.ts`.

**RHF form wiring** (create-update-label-inline.tsx:52-62, 89-107):

```typescript
const {
  handleSubmit,
  control,
  reset,
  formState: { errors, isSubmitting },
  watch,
  setValue,
} = useForm<TFormShape>({ defaultValues });

const onSubmit: SubmitHandler<TFormShape> = async (formData) => {
  if (isSubmitting) return;
  await service
    .createProjectTemplate(slug, assemblePayload(formData))
    .then(() => {
      setToast({ type: TOAST_TYPE.SUCCESS, message: t("...template_created") });
      navigate(listPath);
    })
    .catch((error) => {
      /* mapProjectTemplateErrors(error) → inline + toast; see Pitfall 7 */
    });
};
```

**Controller + TwitterPicker-in-Popover color field** (create-update-label-inline.tsx:166-236) — copy for state/label color fields, BUT change the default color from `"var(--text-color-secondary)"` (line 42/43 — a CSS var, backend rejects) to a real hex via `getRandomLabelColor()` (RESEARCH Pitfall 5):

```typescript
<Controller name="color" control={control}
  render={({ field: { value, onChange } }) => (
    <TwitterPicker colors={LABEL_COLOR_OPTIONS} color={value} onChange={(v) => onChange(v.hex)} />
  )} />
// name field:
<Controller control={control} name="name"
  rules={{ required: t(...), maxLength: { value: 255, message: t(...) } }}
  render={({ field }) => <Input {...field} hasError={Boolean(errors.name)} className="w-full" />} />
```

**Cancel/submit buttons** (create-update-label-inline.tsx:237-249) — `Button variant="secondary"` (Cancel) + `variant="primary"` with `loading={isSubmitting}` (Save).

---

### `editor/states-section.tsx` + `labels-section.tsx` (reorderable, event-driven)

Two drag idioms exist; choose per section (RESEARCH Alternatives Considered).

**Flat ordered list (labels-style) — preferred for a simple ordered list.** Use `@plane/ui` `Sortable` (RESEARCH Code Examples, sortable.tsx:14-21):

```typescript
import { Sortable } from "@plane/ui";
<Sortable data={labels.fields} keyExtractor={(l) => l.id}
  onChange={(newData) => /* map to useFieldArray .move / reset order */}
  render={(label, index) => <LabelRow ... />} />
```

**Edge-precise raw @atlaskit (states grouped by state-group) — copy `project-states/state-item.tsx:69-118`:**

```typescript
combine(
  draggable({ element, getInitialData: () => initialData, onDragStart, onDrop, canDrag }),
  dropTargetForElements({
    element,
    getData: ({ input, element }) =>
      attachClosestEdge(initialData, { input, element, allowedEdges: ["top", "bottom"] }),
    onDragEnter: (args) => setClosestEdge(extractClosestEdge(args.self.data)),
    onDrop: (data) => {
      /* compute new sequence, call useFieldArray.move */
    },
  })
);
// render <DropIndicator isVisible={...} /> above/below the row (state-item.tsx:133-159)
```

`DragHandle` (`@plane/ui`) and `GripVertical` (lucide, state-item-title.tsx:9,50-53) supply the handle glyph. For nested/HOC-style drag see `labels/label-drag-n-drop-HOC.tsx` (full combine + custom preview + DropIndicator), but Phase 4 sections are flat (no parent/child), so prefer `Sortable` or the flat state-item pattern over the label HOC's tree logic.

Enforce "exactly one default state" as a radio across the states array client-side (RESEARCH Pitfall 3); `StateMarksAsDefault` (state-item-title.tsx:66-73) is the default-toggle affordance to mirror.

---

### `editor/modules-section.tsx` + `cycles-section.tsx` + `starter-issues-section.tsx` (in-memory CRUD)

**Analog for add/edit row form:** `project-states/create-update/form.tsx` (manual field row with name Input + color + submit/cancel) — but drive fields through the parent RHF `useFieldArray` rather than local `useState`. No drag handles (order irrelevant for modules/cycles/starter issues per D-11).

**Enum dropdowns** (module status, priority, state group) — `CustomSelect` (RESEARCH Code Examples, custom-select.tsx). Enum sources (project_templates.ts:9-13): state groups `backlog|unstarted|started|completed|cancelled|triage`; module statuses `backlog|planned|in-progress|paused|completed|cancelled`; priorities `urgent|high|medium|low|none`.

**Starter-issue reference dropdowns** (D-13) — also `CustomSelect`, but options are fed from the in-editor items defined in the sections above (states/labels/modules/cycles), selected by name, resolved to stable keys on submit. Do NOT recompute keys from names at submit (RESEARCH Pitfall 2 — key drift); store a stable field key when the item is first added.

**Cycles validation:** enforce `start_offset_days <= target_offset_days` client-side before enabling Save (RESEARCH Pitfall 4).

---

### `utils.ts` (transform — NO analog, new logic)

No slugify/kebab helper exists in `packages/utils` (only `validateSlug`). Add locally per RESEARCH 503-523:

```typescript
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

Also owns `assemblePayload(form): TProjectTemplatePayload` (set `schema_version: 1` — RESEARCH Pitfall 6) and `mapProjectTemplateErrors(error)` (backend raises a **list of single-key dicts**, not a keyed object — RESEARCH Pitfall 7).

---

### `project.service.ts` (add 5 methods, CRUD)

**Analog:** existing `getProjectTemplates` in the same file (36-42) — match `this.post/patch/delete/get` + `.then((r) => r?.data).catch((e) => { throw e?.response?.data; })` exactly.

**Existing method to mirror** (project.service.ts:36-42):

```typescript
async getProjectTemplates(workspaceSlug: string): Promise<TProjectTemplate[]> {
  return this.get(`/api/workspaces/${workspaceSlug}/project-templates/`)
    .then((response) => response?.data)
    .catch((error) => { throw error?.response?.data; });
}
```

The five new methods (`createProjectTemplate` POST, `updateProjectTemplate` PATCH, `deactivateProjectTemplate` DELETE, `reactivateProjectTemplate` PATCH `{is_active:true}`, `duplicateProjectTemplate` POST `.../duplicate/`) are fully specified in RESEARCH lines 481-500 — copy those signatures verbatim. `reactivateProjectTemplate` depends on the D-15 backend change (see below).

For the list fetch, add `getProjectTemplates` an optional `include_inactive` param that appends `?include_inactive=true` (D-14) so the management list can request deactivated rows while the Phase 3 create-modal call stays default (active-only).

---

## Backend slice (D-14 / D-15)

### `project_template.py` viewset — modify

**Analog:** the same file's existing `get_queryset` (33-40), `list` (78-82), and `_get_writable_template` (42-69).

**D-14 — honor `?include_inactive`:** `get_queryset` currently hard-filters `is_active=True` on both branches (37-40). Add opt-in inclusion of inactive **custom workspace** rows only; built-ins stay active-only:

```python
def get_queryset(self):
    include_inactive = self.request.query_params.get("include_inactive") in ("true", "1", "True")
    custom_q = Q(workspace__slug=self.kwargs.get("slug"), is_system=False)
    if not include_inactive:
        custom_q &= Q(is_active=True)
    return ProjectTemplate.objects.filter(
        custom_q | Q(is_system=True, is_active=True, workspace__isnull=True)
    ).distinct()
```

Default stays false so the Phase 3 selector (same endpoint) is unchanged.

**D-15 — reactivate action:** the existing `_get_writable_template` rejects `not candidate.is_active` with 404 (60-68), so a plain PATCH can't flip it back. Add a dedicated admin-only `reactivate` action modeled on `destroy` (111-120) but validating an _inactive_ custom row (accept `is_active=False`, still reject `is_system` with 400 and foreign/unknown with 404), then set `is_active=True`:

```python
@allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
def reactivate(self, request, slug, pk):
    candidate = ProjectTemplate.objects.filter(pk=pk).first()
    if not candidate:
        return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
    if candidate.is_system:
        return Response({"error": "Built-in templates cannot be modified through custom routes"}, status=status.HTTP_400_BAD_REQUEST)
    if candidate.workspace_id is None or candidate.workspace.slug != slug:
        return Response({"error": "Template not found"}, status=status.HTTP_404_NOT_FOUND)
    candidate.is_active = True
    candidate.save(update_fields=["is_active", "updated_at"])
    return Response(ProjectTemplateSerializer(candidate).data, status=status.HTTP_200_OK)
```

(Preferred over loosening `_get_writable_template` so existing edit/deactivate guarantees stay intact — D-15.) `ProjectTemplateWriteSerializer` already lists `is_active` as writable (serializers/project_template.py:629), so a PATCH-based approach is also viable, but a dedicated action keeps the writable-lookup 404-on-inactive contract unbroken.

### `urls/workspace.py` — add reactivate route

**Analog:** the `duplicate` route (278-282):

```python
path(
    "workspaces/<str:slug>/project-templates/<uuid:pk>/reactivate/",
    WorkspaceProjectTemplateViewSet.as_view({"post": "reactivate"}),
    name="workspace-project-templates",
),
```

### `test_project_templates_app.py` — add tests

**Analog:** the same file's existing contract tests. Reuse `seeded_builtin_templates` fixture (28-51), `session_client`, `_minimal_valid_payload` (149-174), and the `role=15` (member) / `role=5` (guest) / cross-workspace idioms (322-507). Add cases for: `?include_inactive=true` returns deactivated custom rows (mirror `test_list_omits_inactive_custom_templates` 131-146 inverted); reactivate flips `is_active` and returns 200; reactivate rejects built-ins (400) and foreign-workspace rows (404, mirror 455-479); member/guest reactivate → 403 (mirror 322-386); and that `include_inactive` never surfaces inactive built-ins.

---

## Shared Patterns

### Four-touchpoint settings registration (D-03)

**Sources & apply-to:** all four config files. Exact diffs are in RESEARCH.md Pattern 1 (lines 197-254) — do not re-derive. Summary:

1. `packages/types/src/settings.ts:13` — add `| "project-templates"` to `TWorkspaceSettingsTabs`. This is the compile driver: both `WORKSPACE_SETTINGS` and `WORKSPACE_SETTINGS_ICONS` are `Record<TWorkspaceSettingsTabs, ...>` and will TS-error until updated.
2. `packages/constants/src/settings/workspace.ts` — add a `"project-templates"` entry (mirror `webhooks` 58-64, `access: [EUserWorkspaceRoles.ADMIN]`) and push it into `GROUPED_WORKSPACE_SETTINGS[ADMINISTRATION]` (73-77). NOTE per D-01 it goes in ADMINISTRATION (not DEVELOPER where webhooks sits, 79). Use `pathname.startsWith(...)` for `highlight` (has sub-routes) — existing entries use strict `===`.
3. `apps/web/core/components/settings/workspace/sidebar/item-icon.tsx:8,13-19` — import `LayoutTemplate` and add `"project-templates": LayoutTemplate`.
4. `apps/web/app/routes/core.ts:277-284` — add 3 routes inside the `(workspace)` layout (list, `/new`, `/:templateId/edit`), mirroring the two webhooks route blocks.

Post-edit run `pnpm --filter=web check:types` — `apps/web` type-check is `react-router typegen && tsc --noEmit`, and typegen must regenerate the `./+types/page` used by the new pages.

### SWR list fetch through the service class

**Source:** `apps/web/ce/components/projects/create/template-select.tsx:19-67` (RESEARCH Pattern 3).
**Apply to:** `list/root.tsx`, editor edit-mode fetch.

```typescript
import { WORKSPACE_PROJECT_TEMPLATES } from "@plane/constants";
const projectService = new ProjectService();
const {
  data: templates,
  isLoading,
  mutate,
} = useSWR(
  workspaceSlug ? WORKSPACE_PROJECT_TEMPLATES(workspaceSlug) : null,
  () => projectService.getProjectTemplates(workspaceSlug),
  { revalidateIfStale: false, revalidateOnFocus: false }
);
```

Reuse the same `WORKSPACE_PROJECT_TEMPLATES(workspaceSlug)` key so create/update/duplicate/deactivate mutations invalidate both the settings list and the Phase 3 selector. After any mutation call `mutate(WORKSPACE_PROJECT_TEMPLATES(workspaceSlug))`. The management list appends `?include_inactive=true` when "Show deactivated" is on.

### Admin gating (two layers)

**Sources:** sidebar `access` array (workspace.ts) + in-page guard (webhooks/page.tsx:38-60).
**Apply to:** every new page (list + both editor routes).

```typescript
const { workspaceUserInfo, allowPermissions } = useUserPermissions();
const canPerformWorkspaceAdminActions = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
if (workspaceUserInfo && !canPerformWorkspaceAdminActions) return <NotAuthorizedView section="settings" className="h-auto" />;
```

`useUserPermissions` from `@/hooks/store/user`; `NotAuthorizedView` from `@/components/auth-screens/not-authorized-view`. UI gate is UX only — backend `@allow_permission(allowed_roles=[ROLE.ADMIN])` is the authoritative control (security V4).

### Toast + service error convention

**Source:** create-update-label-inline.tsx:98-106 (`.catch` → `setToast`), project.service.ts:36-42 (`throw error?.response?.data`).
**Apply to:** all mutation handlers. Success/error strings from UI-SPEC Copywriting ("Template created/saved/duplicated/deactivated/reactivated"). Backend validation errors arrive as a list of single-key dicts — route through `mapProjectTemplateErrors` (Pitfall 7), fall back to generic toast.

### Types (extend)

**Source:** `packages/types/src/project/project_templates.ts` (current shapes verified: `TProjectTemplatePayload` 54-61, per-section types 15-52, `TProjectTemplate` 63-78).
**Apply to:** the editor + service. Add a minimal `TProjectTemplateWritePayload` (subset: `name`, `description`, `template_type: "custom"`, `payload`, `start_offset_days`, `target_offset_days`, `duration_days`, `is_active?`) per RESEARCH Open Question 2. Backend `ProjectTemplateWriteSerializer` writable fields confirmed (serializers/project_template.py:622-634): `name, description, template_type, system_key, is_active, payload, *_offset_days, duration_days` — `id/is_system/created_at/updated_at` are read-only.

---

## No Analog Found

| File                                                  | Role      | Data Flow | Reason                                                                                                                                                        |
| ----------------------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/core/components/project-templates/utils.ts` | utility   | transform | No slugify/kebab or payload-assembly helper exists in `packages/utils` (only `validateSlug`). New logic; idiom pasted above from RESEARCH 503-523.            |
| `editor/starter-issues-section.tsx`                   | component | CRUD      | No existing "reference dropdown fed from sibling in-form items" component. Composed from `CustomSelect` + in-editor field arrays (D-13). Partial analog only. |

---

## Metadata

**Analog search scope:**
`apps/web/app/(all)/[workspaceSlug]/(settings)/settings/(workspace)/`, `apps/web/core/components/{web-hooks,labels,project-states}/`, `apps/web/core/services/project/`, `packages/{types,constants}/src/`, `apps/api/plane/app/{views/workspace,urls,serializers}/`, `apps/api/plane/tests/contract/app/`.

**Files scanned:** 18 read in full (+ targeted reads of serializer/urls/routes). All analogs are real files in this repo, cited with line numbers.

**Pattern extraction date:** 2026-07-01

**Cross-references:** RESEARCH.md already contains the exact diff-shaped edits (Pattern 1, 197-254), the 5 service-method signatures (474-501), the slugify util (503-523), and all 7 pitfalls with serializer line cites — this map points to those rather than duplicating, and adds the row/list/modal/backend analogs RESEARCH referenced but did not fully paste.
