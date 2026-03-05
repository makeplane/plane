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
  - **Summary badges**: `🔀 N permitted state changes • 👥 N listed reviewers` (ICU plural format)
  - **"Allow new work items"** toggle (right side of card header)
  - Expand/collapse **chevron on the right** side
  - List of **permitted state transitions** in format: `Change state to → [● State]`
  - Each transition row shows: reviewer count badge + **"Add reviewers"** button + delete + expand chevron
  - **"Add permitted state change"** button → outlined button with `border border-color-subtle bg-layer-2`
  - Expandable **"When reviewed by"** section per transition with reviewer chips + remove (`×`) button
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
- If NO reviewers assigned for a transition → show `"All Members can move it to [target]"` <!-- Updated: Validation Session 6 - consistent with drag blocker card -->
- If current user is NOT in the reviewer list → they are blocked from performing this drag

**Design tokens for the popup:**

- Background: `bg-surface-1`
- Border: `border border-color-subtle`
- Shadow: subtle drop-shadow
- Text: `text-color-primary` for labels, `text-color-secondary` for descriptions
- State badge in popup: reuse existing read-only state badge component
- Reviewer names: show first 2 names, then `+N others` if more

**This icon should ONLY appear when `workflow.is_live === true`.** Otherwise, render nothing.

## Code Files & Implementation Status

### Settings (✅ COMPLETED — 2026-03-05)

| File                                                                                             | Status      | Notes                                                                                            |
| ------------------------------------------------------------------------------------------------ | ----------- | ------------------------------------------------------------------------------------------------ |
| `apps/web/app/(all)/[workspaceSlug]/(settings)/settings/projects/[projectId]/workflows/page.tsx` | ✅ Modified | Live toggle + 3-dot menu in `SettingsHeading` `control` prop (top-right)                         |
| `apps/web/ce/components/projects/settings/workflows/root.tsx`                                    | ✅ Modified | Simplified — removed standalone header, renders state cards only                                 |
| `apps/web/ce/components/projects/settings/workflows/workflow-state-card.tsx`                     | ✅ Modified | Summary badges, right-side chevron, outlined "Add" button                                        |
| `apps/web/ce/components/projects/settings/workflows/transition-row.tsx`                          | ✅ Modified | "Change state to →" format, "Add reviewers" button, reviewer picker, expandable reviewer section |
| `apps/web/ce/components/projects/settings/workflows/activity-log.tsx`                            | ✅ Created  | "View change history" panel                                                                      |
| `packages/i18n/src/locales/{en,ko,vi}/translations.ts`                                           | ✅ Modified | Added ICU plural keys, updated subtitle                                                          |

### 🆕 Workflow Active Indicator (issue views):

| File                                                                    | Status  |
| ----------------------------------------------------------------------- | ------- |
| `apps/web/ce/components/issues/workflow/workflow-indicator-icon.tsx`    | ⬜ TODO |
| `apps/web/ce/components/issues/workflow/workflow-state-info-popup.tsx`  | ⬜ TODO |
| `apps/web/ce/components/issues/workflow/workflow-drag-blocker-card.tsx` | ⬜ TODO |
| `apps/web/ce/components/issues/workflow/workflow-blocker-modal.tsx`     | ⬜ TODO |

### Issue Rejection UX (error handling):

- Verify existing issue update code in `apps/web/ce/store/issue/` handles 403 and reads `error.WORKFLOW_TRANSITION_BLOCKED`.
<!-- Updated: Validation Session 6 - Non-Kanban layouts use WorkflowBlockerModal (not toast-only); Kanban uses inline drag blocker card -->

## Embedded Rules

1. **Layout**: Use `AppHeader` + `ContentWrapper` + `Outlet` in `layout.tsx`; NO inline header in page.tsx.
2. **UI Priority**: `@plane/propel` subpath imports only. E.g., `import { Button } from "@plane/propel/button"`, `import { Switch } from "@plane/propel/switch"`.
3. **CustomMenu**: Use `CustomMenu` from `@plane/ui` for three-dot menus inside `apps/web/`.
4. **Semantic Colors**: `bg-surface-1` for card backgrounds, `bg-layer-2` for input/dropdown areas, `text-color-primary`, `border-color-subtle`.
5. **i18n**: MUST use `useTranslation()` for ALL user-visible text. Use ICU MessageFormat for plurals: `{count, plural, one{...} other{...}}`.
6. **Toast Feedback**: Import and fire `setToast` after every API mutation. Use root-level keys: `t("success")`, `t("error")`.
7. **MobX observer**: Wrap any component reading store data with `observer()`.

## Implementation Details (Completed)

### Part A: Workflow Settings UI ✅

#### Key Design Decisions (from 2026-03-05 UI refinement session)

1. **Live toggle placement**: Moved from standalone left-aligned row in `root.tsx` → into `SettingsHeading` `control` prop in `page.tsx`. This renders it top-right, inline with the page title, matching the reference design on app.plane.so.

2. **Summary badges**: Each state card header now shows `🔀 N permitted state changes • 👥 N listed reviewers` using ICU MessageFormat pluralization. The badge counts transitions and unique reviewers across all transitions for that state.

3. **Transition row format**: Changed from flat list (`● Done — All Members`) to the reference format:

   ```
   Change state to  →  ● Done    👥 1 listed reviewer    [Add reviewers]  🗑  ∨
   ```

4. **"Add reviewers" flow**: Each transition row has an "Add reviewers" button that toggles an inline member picker. Members are fetched from `useMember().project.getProjectMemberIds()`. On selection, calls `workflowStore.addApprovers()`.

5. **Expandable reviewer section**: Each transition has a chevron (∨) to toggle a "When reviewed by" section showing reviewer chips with `×` to remove.

6. **"Add permitted state change" button**: Changed from `variant="link-neutral"` text link to an outlined button: `border border-color-subtle bg-layer-2 hover:bg-layer-3 text-[11px] rounded-md`.

7. **i18n pluralization**: Project uses ICU MessageFormat (`{count, plural, one{...} other{...}}`), NOT i18next's `_plural` suffix. Translation keys consolidated:
   - `n_permitted_state_changes`: `"{count, plural, one{# permitted state change} other{# permitted state changes}}"`
   - `n_listed_reviewers`: `"{count, plural, one{# listed reviewer} other{# listed reviewers}}"`

8. **Subtitle text**: Updated from "Control which state transitions are permitted and who can perform them." to "Automate work item transitions and set rules to control how tasks move through your project pipeline." across en/ko/vi.

#### Translation Keys Added (under `project_settings.workflows`)

| Key                         | English Value                                                                     |
| --------------------------- | --------------------------------------------------------------------------------- |
| `change_state_to`           | "Change state to"                                                                 |
| `n_permitted_state_changes` | `{count, plural, one{# permitted state change} other{# permitted state changes}}` |
| `n_listed_reviewers`        | `{count, plural, one{# listed reviewer} other{# listed reviewers}}`               |
| `when_reviewed_by`          | "When reviewed by"                                                                |

<!-- Updated: Validation Session 4 - fetchWorkflow called on board mount -->
<!-- Updated: Validation Session 6 - WorkflowBlockerModal REINSTATED for non-Kanban layouts; mount as portal in project layout -->

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

<!-- Updated: Validation Session 5 - Kanban = client-side inline blocker (no API). -->
<!-- Updated: Validation Session 6 - Non-Kanban layouts use WorkflowBlockerModal (not toast-only). Session 5 toast-only decision REVERSED. -->

### Part B-post: Portal Setup

- Mount `<WorkflowBlockerModal>` once in the project layout as a React portal.
- `WorkflowStore` owns modal open state + payload via `blockerModal` observable (see Phase 04).

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
4. Only if a drop somehow reaches the API and returns 403 (race condition): fire `setToast` error only — do NOT open the modal for Kanban.

#### Non-Kanban Layouts (List, Gantt, Spreadsheet) — API-based

5. Find where issue PATCH is done (likely in `apps/web/ce/store/issue/issue.store.ts`).
6. In `updateIssue` action — on 403 `WORKFLOW_TRANSITION_BLOCKED`:
   - Restore `issue.state_id` to previous value in store (optimistic rollback).
   - Call `workflowStore.openBlockerModal({ allowedReviewers: error.detail.allowed_reviewers, fromState: error.detail.from_state, toState: error.detail.to_state })`.
   - The `WorkflowBlockerModal` (mounted in project layout) will open and show who is authorized.
   - Do NOT fire a separate toast — the modal IS the dedicated blocker UI.

## Post-Phase Checklist

### Part A: Settings UI ✅

- [x] Settings page renders correctly under project settings.
- [x] Live toggle positioned top-right with 3-dot menu, calls API + shows success toast.
- [x] Page subtitle matches reference: "Automate work item transitions..."
- [x] State cards show summary badges: `N permitted state changes • N listed reviewers`.
- [x] Transition rows show `Change state to → [State]` format.
- [x] "Add reviewers" button opens inline member picker, adds via `addApprovers()`.
- [x] Expandable "When reviewed by" section shows reviewer chips with remove.
- [x] "Add permitted state change" is outlined button (not text link).
- [x] Adding/removing transitions calls API correctly.
- [x] `@plane/propel` is solely used for foundational components (no custom dropdowns).
- [x] `bg-layer-2` applied to all input/select areas in workflow config.
- [x] All text uses `t()` translation function with ICU MessageFormat plurals.
- [x] Toast uses root-level keys: `t("success")`, `t("error")` (not `common.saved`).
- [x] `PageHead` component included on page.

### Part B & C: Issue Views (⬜ TODO)

- [ ] 403 error from issue PATCH in non-Kanban layouts opens `WorkflowBlockerModal` showing allowed reviewers (no toast). <!-- Updated: Validation Session 6 -->
- [ ] Kanban drag over blocked column shows `WorkflowDragBlockerCard` inline; drop is prevented (no API call).
- [ ] `WorkflowDragBlockerCard` shows "All Members" when transition has no reviewers.
- [ ] `WorkflowDragBlockerCard` cleared on dragLeave/dragEnd.
- [ ] 🆕 Workflow active icon (⇄) appears on Kanban column headers when `is_live = true`.
- [ ] 🆕 Popup shows `"State change / For work items in [source] / [reviewers] can move it to [target]"`.
- [ ] 🆕 Popup shows "All Members can move it to [target]" when no reviewers.
- [ ] 🆕 Icon hidden when `is_live = false` (workflow off).

## Success Criteria

- Workflow settings page visually matches PRO app.
- Kanban column headers show the workflow indicator icon when live.
- Clicking the workflow icon shows correct reviewer + permitted transition info.
- Attempting a disallowed state transition in any layout shows an error toast + WorkflowBlockerModal and the state doesn't change.

## Completion Status

**Part A — Settings UI**: ✅ COMPLETED (2026-03-05)
**Part B — Workflow Indicator**: ⬜ TODO
**Part C — Issue Enforcement**: ⬜ TODO

### Part A Completion Notes (2026-03-05)

Refined workflow settings UI to match reference design on app.plane.so. Key changes:

- Moved Live toggle + 3-dot menu from standalone header in `root.tsx` to `SettingsHeading` control in `page.tsx`
- Added summary badges with ICU MessageFormat pluralization to state card headers
- Rewrote transition rows with "Change state to →" format, "Add reviewers" button + member picker, and expandable reviewer section
- Fixed translation keys from `_plural` suffix pattern to ICU MessageFormat
- Fixed toast keys from `common.saved`/`common.error` to root-level `success`/`error`
- Updated subtitle text across en/ko/vi locales

**UI Polish & Refinements (2026-03-05 later):**

- Migrated inline "Add reviewers" and "Add permitted state change" popovers to use `@plane/ui`'s structured `CustomSearchSelect` component with search and multi-select capabilities.
- Fixed transition row styling to precisely match reference images (white bg, dashed separator, custom button styling).
- Updated typography classes (`text-sm` → `text-13`, `text-xs` → `text-12`) to strictly adhere to Plane's custom numeric text sizing tokens instead of generic Tailwind defaults.

**Bug Fixes (2026-03-05 afternoon):**

| Bug                                             | Root Cause                                                                                                                        | Fix                                                                                                                       |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Reviewer dropdown shows already-added reviewers | `memberOptions` included all project members                                                                                      | Filter `memberIds` to exclude `approvers` in `transition-row.tsx`                                                         |
| Cannot remove reviewers (DELETE 404)            | Backend `destroy` looked up by `pk` (record UUID) but frontend sends `approver_id` (user UUID) — serializer returns user IDs only | Changed `pk=pk` to `approver_id=pk` in `WorkflowTransitionApproverViewSet.destroy()`                                      |
| Native `window.confirm` for delete transition   | Used `confirm()` instead of Plane's standard dialog                                                                               | Replaced with `AlertModalCore` from `@plane/ui` + existing i18n keys `delete_transition_title` / `delete_transition_body` |

Files changed:

- `apps/api/plane/app/views/workflow.py` — `WorkflowTransitionApproverViewSet.destroy()`: `pk=pk` → `approver_id=pk`
- `apps/web/ce/components/projects/settings/workflows/transition-row.tsx` — Filter already-added reviewers, simplified to single-select add, hide button when all added
- `apps/web/ce/components/projects/settings/workflows/workflow-state-card.tsx` — `confirm()` → `AlertModalCore`, added `deleteTransitionId` state
