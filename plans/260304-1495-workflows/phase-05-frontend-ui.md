# Phase 05: Frontend Settings UI & Issue Rejection UX

## Overview

Build the configuration interface inside Project Settings to visualize and edit Workflows. Also implement the rejection UI across all 5 issue layouts when a workflow blocks a state change. Both must be implemented entirely within CE overrides.

## Requirements

### Settings UI:

- Tab "Workflows" under project settings sidebar.
- Global **"Live" toggle** at top-right (activates/deactivates constraints).
- Three-dot menu with: Reset workflow, View change history.
- For each project state, render a collapsible card showing:
  - State name + icon
  - **"Allow new work items"** toggle
  - List of **permitted state transitions** (with target state + reviewer list)
  - **"Add permitted state change"** button → dropdown to pick a target state
  - **"Add reviewers"** button per transition → member picker
  - Delete button per transition
- Visual: matches PRO UI (see screenshot analysis in `workflow-ux-analysis.md`)

### Issue Rejection UX (across 5 layouts):

| Layout          | How state change is triggered                | Rejection Behavior                                      |
| --------------- | -------------------------------------------- | ------------------------------------------------------- |
| **Kanban**      | Drag-and-drop card between columns           | Card snap-back to original column + **blocker message** |
| **List**        | Click state badge → state dropdown select    | State badge unchanged + **blocker message**             |
| **Calendar**    | Drag issue to another date (state unchanged) | N/A — calendar doesn't change state                     |
| **Gantt**       | Click issue → sidebar state selector         | State unchanged + **blocker message**                   |
| **Spreadsheet** | Click "State" cell → dropdown select         | Cell value unchanged + **blocker message**              |

**⚠ Blocker Message** (from doc: "they'll see a blocker message"):

- NOT just a generic toast — this is a **dedicated blocker UI** (modal or prominent overlay)
- Shows WHO is authorized to make this transition (from the backend's `detail.allowed_reviewers`)
- Example text: `"Only [alex, bob] can move this work item to [Code Review]"`
- Position/style: Could be a small modal card or inline blocker overlay — refer to PRO screenshots
- Backend returns: `403` with `{ error: "WORKFLOW_TRANSITION_BLOCKED", detail: { allowed_reviewers: [...] } }`

### ✅ Allow New Work Items — UI Enforcement

When `is_live = true` and a state has `allow_new_work_items = false`:

- In **Kanban**: The `+ New work item` button at the bottom of that column must be **hidden** or **disabled**.
- In **List**: The `+ New work item` button inside that state group must be **hidden** or **disabled**.
- If user tries to create an issue and manually sets state to a restricted one → backend returns 400, show error toast.

This constraint is visual (hide button) AND enforced by backend (API 400).

### 🆕 Workflow Active Indicator (Kanban column header)

When workflow is live (`is_live = true`), a **special icon** appears next to each state column header in Kanban board:

```
⊕ In Development  3    [🔀]  ↗↙     ⊙ Code Review  1
                         ↑
                  Workflow active icon
                  (click to see rules)
```

**On hover/click of the icon**, a **popup tooltip** appears:

```
┌─────────────────────────────────────────────┐
│  ⊙  State change                            │
│                                             │
│  For work items in  [⊙ In Development]      │
│                                             │
│  alex and You can move it to                │
│  [⊙ Code Review]                            │
└─────────────────────────────────────────────┘
```

**📌 IMPORTANT — Popup appears on TARGET column, not source:**

- The icon lives on the **target state's column header** (e.g., "Code Review")
- The popup explains: "For work items in [source_state] → [reviewers] can move it to THIS column"
- If multiple source states can transition into this target: show **multiple entries** in the popup
- If NO reviewers assigned for a transition → show `"Anyone can move it to [target]"`
- If current user is NOT in the reviewer list → they are blocked from performing this drag

**Design tokens for the popup:**

- Background: `bg-surface-1`
- Border: `border border-color-subtle`
- Shadow: subtle drop-shadow
- Text: `text-color-primary` for labels, `text-color-secondary` for descriptions
- State badge in popup: reuse existing read-only state badge component
- Reviewer names: show first 2 names, then `+N others` if more

**This icon should ONLY appear when `workflow.is_live === true`.** Otherwise, render nothing.

## Related Code Files

**Settings:**

- Files to create: `apps/web/ce/components/projects/settings/workflows/root.tsx`
- Files to create: `apps/web/ce/components/projects/settings/workflows/workflow-state-card.tsx`
- Files to create: `apps/web/ce/components/projects/settings/workflows/transition-row.tsx`
- Files to create: `apps/web/ce/components/projects/settings/workflows/activity-log.tsx` (for "View change history")
- Files to create: `apps/web/app/(all)/[workspaceSlug]/projects/[projectId]/settings/workflows/page.tsx`
- Files to modify: Project settings sidebar navigation to add "Workflows" link
- Files to modify: `packages/i18n/src/locales/{en,vi,ko}/translations.ts`

**🆕 Workflow Active Indicator (issue views):**

- Files to create: `apps/web/ce/components/issues/workflow/workflow-indicator-icon.tsx` — icon on Kanban column headers
- Files to create: `apps/web/ce/components/issues/workflow/workflow-state-info-popup.tsx` — popup showing transition rules
- Files to create: `apps/web/ce/components/issues/workflow/workflow-drag-blocker-card.tsx` — inline card shown at bottom of Kanban column during blocked drag
- ~~Files to create: `apps/web/ce/components/issues/workflow/workflow-blocker-modal.tsx`~~ — REMOVED (Session 5: modal replaced by inline drag blocker + toast)
- Files to modify: Kanban column header component — inject indicator icon + hide `+ New work item` in restricted states
- Files to modify: List state group header — same hiding of `+ New work item`

**Issue Rejection UX (error handling):**

- Verify existing issue update code in `apps/web/ce/store/issue/` handles 403 and reads `error.WORKFLOW_TRANSITION_BLOCKED`.
- <!-- Updated: Validation Session 5 - NO modal; Kanban uses inline drag blocker; other layouts use error toast only -->

## Embedded Rules

1. **Layout**: Use `AppHeader` + `ContentWrapper` + `Outlet` in `layout.tsx`; NO inline header in page.tsx.
2. **UI Priority**: `@plane/propel` subpath imports only. E.g., `import { Button } from "@plane/propel/button"`, `import { Switch } from "@plane/propel/switch"`.
3. **CustomMenu**: Use `CustomMenu` from `@plane/ui` for three-dot menus inside `apps/web/`.
4. **Semantic Colors**: `bg-surface-1` for card backgrounds, `bg-layer-2` for input/dropdown areas, `text-color-primary`, `border-color-subtle`.
5. **i18n**: MUST use `useTranslation()` for ALL user-visible text.
6. **Toast Feedback**: Import and fire `setToast` after every API mutation.
7. **MobX observer**: Wrap any component reading store data with `observer()`.

## Implementation Steps

### Part A: Workflow Settings UI

1. Add translations in all 3 locale files: `workflow.settings.*` keys + `workflow.indicator.*` keys for popup.
2. Create `workflow-state-card.tsx`: collapsible per-state config with allow/deny toggle.
3. Create `transition-row.tsx`: shows target state + reviewer pills + delete button.
4. Create `root.tsx`: fetches workflow on mount, renders Live toggle + all state cards.
5. Create `page.tsx` for route, includes `PageHead` with translated title.
6. Wire up the page to project settings sidebar nav.

<!-- Updated: Validation Session 4 - fetchWorkflow called on board mount -->
<!-- Updated: Validation Session 5 - WorkflowBlockerModal removed; no portal needed -->

### Part B-pre: Board Layout Setup

0. In the issue board layout (the component wrapping Kanban/List/Gantt/Spreadsheet):
   - Add `useEffect(() => { workflowStore.fetchWorkflow(workspaceSlug, projectId); }, [projectId])` — ensures store is populated for indicator icons and button hiding.

### Part B: Workflow Active Indicator in Kanban (🆕)

1. Create `workflow-indicator-icon.tsx`: a small teal icon button (e.g. using `GitMerge` or custom SVG from propel).
2. Create `workflow-state-info-popup.tsx`:
   - Receives: `stateId` (the target/current state), `transitions` (list of permitted source→target+reviewers)
   - Fetches reviewer names from MobX member store
   - Renders popup: `"State change / For work items in [source] / [names] can move it to [target]"`
   - When no reviewers: show `"All Members can move it to [state]"` — NOT "Anyone" <!-- Updated: Validation Session 5 - exact PRO copy -->
   - Use `Popover` from `@plane/propel/popover` or `@headlessui/react` Popover
3. Inject `<WorkflowIndicatorIcon>` into Kanban column header (find `board-column-header` or equivalent component): render only when `workflowStore.isLive(projectId) === true`.
4. For groups in **List layout**, similarly inject at state group header level.

<!-- Updated: Validation Session 5 - COMPLETE REWRITE. Kanban = client-side inline blocker (no API). Other layouts = toast only. No modal. -->

### Part C: Workflow Enforcement in Issue Views

#### Kanban Drag-and-Drop (client-side, NO API call when blocked)

1. In the Kanban board's `dragOver` / `onDragOver` handler for a column:
   - Get `fromStateId` (dragged card's current state) and `toStateId` (column's state).
   - Call `workflowStore.isTransitionAllowed(projectId, fromStateId, toStateId)`.
   - If **blocked**: set `isDragBlocked = true` on column drag state; render `<WorkflowDragBlockerCard>` at bottom of column; prevent drop (do NOT call API).
   - If **allowed**: normal drag-drop; proceed to PATCH.
2. Create `workflow-drag-blocker-card.tsx`: inline card shown at bottom of target column when `isDragBlocked = true`:
   - Message: `t("workflow.drag_blocked.title")` = `"You can't move this work item here."`
   - Sub-text: `"For work items in [source_state]"` + `"[reviewers] can move it to [target_state]"`
   - Use reviewer names from `workflowStore.getTransitionReviewers(projectId, fromStateId, toStateId)`; if empty → `"All Members"`.
   - Style: `bg-surface-1`, `border-custom-border-200`, rounded, padded — matches PRO screenshot.
3. On `dragLeave` / `dragEnd`: clear `isDragBlocked` state, hide blocker card.
4. Only if a drop somehow reaches the API and returns 403 (race condition): fire `setToast` error only.

#### Non-Kanban Layouts (List, Gantt, Spreadsheet) — API-based

5. Find where issue PATCH is done (likely in `apps/web/ce/store/issue/issue.store.ts`).
6. In `updateIssue` action — on 403 `WORKFLOW_TRANSITION_BLOCKED`:
   - Fire `setToast(TOAST_TYPE.ERROR, t("workflow.transition_blocked"))`.
   - Restore `issue.state_id` to previous value in store (optimistic rollback).
   - **No modal** — toast only.

## Post-Phase Checklist

- [ ] Settings page renders correctly under project settings.
- [ ] Live toggle calls API + shows success toast.
- [ ] Adding/removing transitions calls API correctly.
- [ ] `@plane/propel` is solely used for foundational components (no custom dropdowns).
- [ ] `bg-layer-2` applied to all input/select areas in workflow config.
- [ ] All text uses `t()` translation function.
- [ ] 403 error from issue PATCH shows error toast in non-Kanban layouts (List, Gantt, Spreadsheet).
- [ ] Kanban drag over blocked column shows `WorkflowDragBlockerCard` inline; drop is prevented (no API call).
- [ ] `WorkflowDragBlockerCard` shows "All Members" when transition has no reviewers.
- [ ] `WorkflowDragBlockerCard` cleared on dragLeave/dragEnd.
- [ ] `PageHead` component included on page.
- [ ] 🆕 Workflow active icon (⇄) appears on Kanban column headers when `is_live = true`.
- [ ] 🆕 Popup shows `"State change / For work items in [source] / [reviewers] can move it to [target]"`.
- [ ] 🆕 Popup shows "All Members can move it to [target]" when no reviewers.
- [ ] 🆕 Icon hidden when `is_live = false` (workflow off).

## Success Criteria

- Workflow settings page visually matches PRO app.
- Kanban column headers show the workflow indicator icon when live.
- Clicking the workflow icon shows correct reviewer + permitted transition info.
- Attempting a disallowed state transition in any layout shows an error toast + WorkflowBlockerModal and the state doesn't change.
