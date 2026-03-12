---
phase: 4
title: "Frontend: Types & Store"
status: pending
effort: 1h
---

# Phase 4 — Frontend: Types & Store

## Context

- Parent: [plan.md](./plan.md)
- Depends on: Phase 2 (is_system in API response)

## Overview

Add `is_system` to IState type and update MobX store to expose whether the current user can mutate a given state. No store logic changes needed — just surface the field and derive permission.

## Requirements

1. Add `is_system: boolean` to `IState` type
2. Expose helper in state store: `canModifyState(stateId): boolean`
3. Hook into instance admin check from existing user store

## Related Code Files

- `packages/types/src/state.ts`
- `packages/types/src/index.ts` (verify IState exported)
- `apps/web/core/store/state.store.ts`
- `apps/web/core/hooks/store/use-state.ts` (if exists, else use store directly)
- `apps/web/core/store/user.store.ts` — check if `is_instance_admin` is stored

## Implementation Steps

### 1. Update `packages/types/src/state.ts`

```typescript
export type IState = {
  id: string;
  color: string;
  default: boolean;
  description: string;
  group: TStateGroups;
  name: string;
  project_id: string;
  sequence: number;
  workspace_id: string;
  order: number;
  is_system: boolean; // ← add
};
```

### 2. Check user store for instance admin flag

Look in `apps/web/core/store/user.store.ts` for `is_instance_admin` or similar.

- If exists: use it in state store
- If **not exists**: STOP — do not add backend field or new endpoint. Reassess with user.
<!-- Updated: Validation Session 3 - Verify-first approach; no preemptive backend changes for is_instance_admin -->

### 3. Add `canModifyState` to state store

```typescript
// In state.store.ts
canModifyState = computedFn((stateId: string): boolean => {
  const state = this.stateMap[stateId];
  if (!state) return false;
  if (!state.is_system) return true; // custom states always editable by project admin
  return this.rootStore.currentUser?.is_instance_admin ?? false;
});
```

### 4. Expose via hook

If `use-state.ts` hook exists, add `canModifyState` to its return value. Otherwise, consumers call store directly.

## Todo

- [ ] Add `is_system` to `IState` in `packages/types/src/state.ts`
- [ ] Verify `is_instance_admin` exists on user store/type — **STOP if not found, do not add**
- [ ] Add `canModifyState(stateId)` to state store
- [ ] Export helper via hook if applicable
- [ ] Run `pnpm check:lint` on changed packages

## Success Criteria

- TypeScript compiles with no errors after type change
- `canModifyState` returns `false` for system states when user is not instance admin
- `canModifyState` returns `true` for custom states regardless of admin status

## Risk Assessment

- **Low**: purely additive type change
- If `is_instance_admin` missing from user store → STOP, do not add any backend field or endpoint
<!-- Updated: Validation Session 6 - Removed stale "need small backend check" text; STOP decision (Session 3) stands -->

## Next Steps

→ Phase 5: UI permission guards
