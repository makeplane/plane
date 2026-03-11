---
title: "Editable Completed Date for Work Items"
description: "Allow users to manually edit completed_at when issue state is done"
status: completed
priority: P2
effort: 2h
branch: ngoc-feat/workspaces
tags: [frontend, backend, work-items, sidebar]
created: 2026-03-11
completed: 2026-03-11
---

# Editable Completed Date for Work Items

## Summary

Make `completed_at` editable via DateDropdown in issue sidebar and peek-overview when `state.group === 'completed'`. Currently read-only text. Requires backend fix: `Issue.save()` always overrides `completed_at` based on state group.

## Key Findings

- **Backend blocker**: `Issue.save()` (line ~197 in `issue.py`) unconditionally sets `completed_at = timezone.now()` when state is completed, `None` otherwise. Manual edits via PATCH will be overwritten on next save.
- **Serializer OK**: `IssueCreateSerializer` does NOT list `completed_at` in `read_only_fields` -- field is already writable via PATCH.
- **Frontend component**: `CompletedAtProperty` in `ce/components/issues/issue-details/sidebar/completed-at-property.tsx` -- single CE file used by both sidebar (line 193) and peek-overview (line 192).
- **UX reference**: Due date uses `DateDropdown` from `@/components/dropdowns/date` with `issueOperations.update()`.
- **Type OK**: `TIssue.completed_at: string | null` already supports the value.

## Phases

| #   | Phase                                      | Effort | File                                         |
| --- | ------------------------------------------ | ------ | -------------------------------------------- |
| 1   | Backend: conditional completed_at override | 30m    | [phase-01](./phase-01-backend.md)            |
| 2   | Frontend: editable sidebar DateDropdown    | 45m    | [phase-02](./phase-02-sidebar-edit.md)       |
| 3   | Frontend: peek-overview (shared component) | 15m    | [phase-03](./phase-03-peek-overview-edit.md) |

## Architecture Decision

The `CompletedAtProperty` CE component is already shared between sidebar and peek-overview. Converting it from read-only text to DateDropdown in-place means both locations get the edit capability automatically. No new files needed -- just modify the existing CE component and the backend model.

## Unresolved Questions

~~1. Should `completed_at` edits be logged as issue activity?~~ → **Yes, log activity** (Validation Session 1)
~~2. Should there be a time picker?~~ → **Date + Time picker** (Validation Session 1)

## Validation Log

### Session 1 — 2026-03-11

**Trigger:** Initial plan validation before implementation
**Questions asked:** 2

#### Questions & Answers

1. **[Scope]** Should edits to completed_at be logged as issue activity entries? Currently, state-change-triggered completed_at updates are NOT tracked separately.
   - Options: Yes, log activity | No, skip logging
   - **Answer:** Yes, log activity (Recommended)
   - **Rationale:** Activity logging is standard for auditable field changes; requires adding `completed_at` handler in `issue_activities_task` on backend.

2. **[Architecture]** DateDropdown only picks dates. But completed_at is a datetime field. How should time be handled?
   - Options: Date + Time picker | Date only, time = current time | Date only, time = end of day
   - **Answer:** Date + Time picker (Recommended)
   - **Rationale:** completed_at displays date+time to users; a date-only picker would silently lose time precision. No existing date+time picker component found — needs a custom dropdown combining DateDropdown + time input.

#### Confirmed Decisions

- Activity logging: YES — add `completed_at` to tracked fields in backend activity task
- Time picker: Date + Time combined — build custom component (no existing one in codebase)

#### Action Items

- [ ] Phase 01: Add `completed_at` activity logging in `issue_activities_task`
- [ ] Phase 02: Replace `DateDropdown` with custom date+time picker component
- [ ] Phase 03: Update peek-overview references to match Phase 02 component

#### Impact on Phases

- Phase 01: Add activity logging for `completed_at` field changes
- Phase 02: Switch from `DateDropdown` to a custom date+time picker (date + time input combined)
- Phase 03: Update notes to reflect date+time picker instead of DateDropdown

### Session 2 — 2026-03-11

**Trigger:** Re-validation to surface architectural risks before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 02-03 modify core/ call sites (sidebar.tsx, peek-overview/properties.tsx) to pass new props. Memory rule says "never modify core/ except app router layouts and hook files". How should we handle this?
   - Options: Allow minimal core/ edits | Refactor: move call site to CE | Self-contained: remove extra props
   - **Answer:** Refactor: move call site to CE
   - **Rationale:** Core rule is strict — avoid any core/ modification. CE must provide a self-contained component that doesn't require new props from core/ callers. Likely means `CompletedAtProperty` should resolve `issueOperations`, `workspaceSlug`, `projectId`, `isEditable` internally via store hooks.

2. **[Architecture]** Phase 02 plans to create a new file completed-at-date-time-picker.tsx. Is this right vs. inline?
   - Options: New file | Inline in existing component
   - **Answer:** New file (completed-at-date-time-picker.tsx)
   - **Rationale:** Separates concerns cleanly; keeps `completed-at-property.tsx` under 150 lines; allows independent reuse.

3. **[Scope]** If a PATCH sends both state_id (transitioning to completed) AND a custom completed_at simultaneously, which wins?
   - Options: State transition wins | Explicit value wins
   - **Answer:** State transition wins
   - **Rationale:** Simpler backend logic; auto-set on state change is authoritative. No special handling needed for the combined PATCH case.

#### Confirmed Decisions

- core/ call sites: NOT modified — `CompletedAtProperty` becomes self-contained, resolving its dependencies via store hooks
- date+time picker: extracted to separate file `completed-at-date-time-picker.tsx`
- PATCH conflict: state transition auto-set takes precedence

#### Action Items

- [ ] Phase 02: Redesign `CompletedAtProperty` to be self-contained (use hooks for `issueOperations`, `workspaceSlug`, `projectId`, `isEditable`) — NO changes to core/ call sites
- [ ] Phase 02: Create `completed-at-date-time-picker.tsx` as standalone CE component
- [ ] Phase 03: No changes needed (CE component handles itself; core/ call site unchanged)

#### Impact on Phases

- Phase 02: Major architecture change — component must self-resolve its deps via hooks instead of receiving them as props. core/ sidebar.tsx and peek-overview/properties.tsx stay untouched.
- Phase 03: Simplifies to near-zero work (no call site changes needed since Phase 02 is self-contained)

### Session 3 — 2026-03-11

**Trigger:** Finalizing hook patterns before implementation
**Questions asked:** 3

#### Questions & Answers

1. **[Architecture]** Phase 02 needs to resolve `issueOperations` internally. Which hook approach should `CompletedAtProperty` use?
   - Options: useIssueDetail hook | Direct store call | Look at existing CE property
   - **Answer:** useIssueDetail hook (Recommended)
   - **Rationale:** `useIssueDetail()` exposes `updateIssue` and is the established CE hook abstraction — consistent with other CE sidebar properties, avoids tight coupling to store internals.

2. **[Architecture]** How should `isEditable` be determined inside `CompletedAtProperty` without props from core/?
   - Options: useUserPermissions hook | Always editable | Look at existing CE sidebar property
   - **Answer:** useUserPermissions hook (Recommended)
   - **Rationale:** `useUserPermissions(projectId)` is the canonical permission check pattern used across CE components. Ensures read-only users don't see the picker UI.

3. **[Scope]** Phase 02 Todo list has stale items referencing core/ call-site changes (contradicts Session 2). Clean them up?
   - Options: Yes, clean them up | Leave as-is
   - **Answer:** Yes, clean them up
   - **Rationale:** Stale todos cause implementer confusion. Removed items: "Pass additional props in sidebar.tsx call site" and "Pass additional props in peek-overview/properties.tsx call site".

#### Confirmed Decisions

- `issueOperations`: use `useIssueDetail()` hook → exposes `updateIssue`
- `isEditable`: use `useUserPermissions(projectId)` → check member role
- Stale todos: removed from Phase 02

#### Action Items

- [ ] Phase 02: Use `useIssueDetail()` to get `updateIssue` internally
- [ ] Phase 02: Use `useUserPermissions(projectId)` to derive `isEditable`
- [ ] Phase 02: Stale todos already cleaned (done in this session)

#### Impact on Phases

- Phase 02: Hook pattern confirmed — use `useIssueDetail()` + `useUserPermissions(projectId)`
