---
phase: 5
title: "Frontend: UI Permission Guards"
status: pending
effort: 1h
---

# Phase 5 — Frontend: UI Permission Guards

## Context

- Parent: [plan.md](./plan.md)
- Depends on: Phase 4 (canModifyState helper)

## Overview

Hide/disable edit & delete controls for system states when the user is not an instance admin. Add a visual "system" badge to communicate locked status.

## Requirements

1. Edit button **disabled** (not hidden) for system states for non-instance-admins, with tooltip on hover
2. Delete button **disabled** (not hidden) for system states for non-instance-admins, with tooltip on hover
3. Visual indicator (lock icon or badge) on system states
4. Mark-default action: **instance admin only** for system states — project admins cannot mark a system state as default
<!-- Updated: Validation Session 4 - Corrected from Session 3: mark-default on system states requires instance admin -->

## Related Code Files

- `apps/web/core/components/project-states/state-item.tsx`
- `apps/web/core/components/project-states/state-list.tsx`
- `apps/web/core/components/project-states/state-delete-modal.tsx`
- `apps/web/core/store/state.store.ts` (canModifyState)

## Implementation Steps

### 1. Read `state-item.tsx`

Identify where edit/delete buttons are rendered. **Disable** (not hide) for non-admins on system states, with tooltip on hover:

```tsx
const canModify = useStateStore().canModifyState(state.id);

// Edit button — disabled with tooltip for non-admins on system states
<Tooltip tooltipContent={!canModify ? "System states can only be modified by instance admins" : undefined}>
  <button onClick={onEdit} disabled={!canModify} className={!canModify ? "opacity-50 cursor-not-allowed" : ""}>
    Edit
  </button>
</Tooltip>

// Delete button — same pattern
<Tooltip tooltipContent={!canModify ? "System states can only be modified by instance admins" : undefined}>
  <button onClick={onDelete} disabled={!canModify} className={!canModify ? "opacity-50 cursor-not-allowed" : ""}>
    Delete
  </button>
</Tooltip>
```

<!-- Updated: Validation Session 7 - Disable buttons (not hide); tooltip on button hover for non-admins on system states -->

### 2. Add system state badge

```tsx
{
  state.is_system && (
    <span className="inline-flex items-center gap-1 text-xs text-custom-text-300">
      <Lock className="h-3 w-3" />
      System
    </span>
  );
}
```

Use existing Lucide icons (Lock or ShieldCheck) already in the project.

### 3. Tooltip for non-admins on hover

When user is not instance admin and tries to interact with a system state, show tooltip:

> "System states can only be modified by instance admins"

Use existing `Tooltip` component from `@plane/propel` or `@plane/ui`.

### 4. Mark-default requires instance admin for system states

The "mark as default" action is **guarded** for system states — only instance admins can mark a system state as the project default. Project admins can still mark non-system states as default.

<!-- Updated: Validation Session 3 - mark_default on system states requires instance admin (not accessible to project admins) -->

### 5. State create form

No change needed — users can always create custom (non-system) states. The `is_system` field is not exposed in the create form.

## Todo

- [ ] Read `state-item.tsx` to understand current button structure
- [ ] Disable (not hide) edit button for non-admins on system states
- [ ] Disable (not hide) delete button for non-admins on system states
- [ ] Add tooltip on disabled edit/delete buttons explaining restriction
- [ ] Add system badge (Lock icon + "System" text) for `is_system` states
- [ ] Verify `state-delete-modal.tsx` also checks permission before submitting
- [ ] Run `pnpm check:lint` and visual smoke test

## Success Criteria

- Non-instance-admin sees lock badge on system states
- Edit/delete buttons disabled (grayed out) with tooltip for non-admins on system states
- Instance admin sees full edit/delete controls on system states
- Custom states behave exactly as before for all users

## Security Considerations

- UI guards are UX only — real enforcement is in Phase 2 backend guards
- Never rely solely on frontend for permission enforcement

## Resolved Decisions

<!-- Updated: Validation Session 1 - Both unresolved questions resolved -->

- **Reorder:** Project admins CAN drag-reorder system states (sequence only). No backend guard needed for sequence PATCH on system states.
- **System badge scope:** Settings only — do NOT show lock badge in issue sidebar state pickers.
<!-- Updated: Validation Session 3 - mark_default corrected -->
- **Mark-default:** Instance admin only for system states — the `canModifyState` guard applies to mark_default as well.

## Next Steps

→ All phases complete. Run tests, lint, create PR against `develop`.
