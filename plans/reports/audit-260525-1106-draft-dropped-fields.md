# Audit — Draft Work Item: Form Fields vs Persisted Fields

**Date:** 2026-05-25 11:06
**Branch:** ngoc-feat/categories
**Scope:** Q2 audit — find every field collected by the draft form that is silently dropped on save.

---

## Method

Compared 3 layers:

1. **Form values** — `packages/constants/src/issue/modal.ts` (`DEFAULT_WORK_ITEM_FORM_VALUES`) + `apps/web/core/components/issues/issue-modal/form.tsx`
2. **DraftIssue model** — `apps/api/plane/db/models/draft.py`
3. **DraftIssueSerializer / DraftIssueCreateSerializer** — `apps/api/plane/app/serializers/draft.py`

`DraftIssueCreateSerializer.Meta.fields = "__all__"` so it accepts every model column. Unknown keys in POST body → silently dropped (DRF default).

---

## Field-by-Field Matrix

| Form field                  | DraftIssue model           | Read serializer | Write serializer | Status     |
| --------------------------- | -------------------------- | --------------- | ---------------- | ---------- |
| `project_id`                | inherited (workspace base) | ✅              | ✅               | OK         |
| `type_id`                   | `type` FK                  | ✅              | ✅               | OK         |
| `name`                      | ✅                         | ✅              | ✅               | OK         |
| `description_html`          | ✅                         | ✅              | ✅               | OK         |
| `estimate_point`            | ✅                         | ✅              | ✅               | OK         |
| `state_id`                  | `state` FK                 | ✅              | ✅               | OK         |
| `parent_id`                 | `parent` FK                | ✅              | ✅               | OK         |
| `priority`                  | ✅                         | ✅              | ✅               | OK         |
| `assignee_ids`              | via `DraftIssueAssignee`   | ✅              | ✅               | OK         |
| `label_ids`                 | via `DraftIssueLabel`      | ✅              | ✅               | OK         |
| `cycle_id`                  | via `DraftIssueCycle`      | ✅              | ✅               | OK         |
| `module_ids`                | via `DraftIssueModule`     | ✅              | ✅               | OK         |
| `start_date`                | ✅                         | ✅              | ✅               | OK         |
| `target_date`               | ✅                         | ✅              | ✅               | OK         |
| **`main_task_category_id`** | **❌ missing**             | **❌**          | **❌ (dropped)** | **BROKEN** |
| **`sub_task_category_id`**  | **❌ missing**             | **❌**          | **❌ (dropped)** | **BROKEN** |

---

## Findings

### Confirmed dropped fields: 2

- `main_task_category_id`
- `sub_task_category_id`

These come from `<TaskCategoryFields>` (`apps/web/core/components/issues/issue-modal/components/task-category-fields.tsx`) and are part of `DEFAULT_WORK_ITEM_FORM_VALUES` (`packages/constants/src/issue/modal.ts:25-26`). Both written into RHF state on selection. POST `/api/workspaces/<slug>/draft-issues/` includes them, DRF drops them because `DraftIssue` model has no matching columns.

### Adjacent type-system gap

`TWorkspaceDraftIssue` (`packages/types/src/workspace-draft-issues/base.ts:9-37`) also lacks both category fields. So even if backend started returning them, the TS type wouldn't expose them — needs adding for proper read flow.

### Not dropped (verified safe)

- M2M relations (assignees, labels, modules, cycle) flow through separate join tables — already wired.
- Issue-type additional properties travel a separate path via `handleCreateUpdatePropertyValues({isDraft: true})` — already supports drafts.
- `description_*` variants — model has json/html/stripped/binary; serializer exposes html.

---

## Implications for the Fix

Combined with Q1 (`default state=backlog` for drafts) and Q3 (no backfill needed):

1. **Backend (must)** — add 2 columns to `DraftIssue`, expose on `DraftIssueSerializer.Meta.fields`. Write path inherits via `__all__`.
2. **Backend (must)** — set default state group = `backlog` on draft create when caller doesn't supply one.
3. **Backend (must)** — in `create_draft_to_issue` (`apps/api/plane/app/views/workspace/draft.py:206`), forward draft's stored `main_task_category` / `sub_task_category` into the create payload when missing from request body. This makes existing drafts (without categories) still movable, since the resulting issue inherits the draft's backlog state and validator skips category enforcement.
4. **Frontend (must)** — extend `TWorkspaceDraftIssue` with `main_task_category_id` and `sub_task_category_id`.
5. **Frontend (should)** — surface DRF field-level errors in modal instead of generic toast (`form.tsx:308-313`).

---

## Unresolved Questions

- The user said "must be `Scheduled` first" for non-draft work items. Is `Scheduled` an existing state group, or a state name? Plane state groups are: `backlog`, `unstarted`, `started`, `completed`, `cancelled` (`apps/api/plane/db/models/state.py`). `Scheduled` is not a default group — likely the user means a project-specific state named "Scheduled" that belongs to `unstarted` group. Need confirmation: should default-on-non-draft pick by group `unstarted`, or by name match `"Scheduled"`?
- Does "draft → backlog default" apply only when caller omits `state_id`, or should backend force-override any non-backlog choice from frontend during draft create?
