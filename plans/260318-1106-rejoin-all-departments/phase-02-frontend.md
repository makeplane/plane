# Phase 02 — Frontend: Service + Store + UI

**Parent plan:** [plan.md](./plan.md) | **Depends on:** [phase-01-backend.md](./phase-01-backend.md)

## Overview

| Field    | Value      |
| -------- | ---------- |
| Date     | 2026-03-18 |
| Priority | P2         |
| Status   | ⬜ pending |
| Est.     | 60m        |

Three-layer frontend change: service type + method → store action → page button.

## Key Insights

- `IRejoinAllResult` mirrors `IAutoJoinResult` shape + adds `departments_processed`
- `rejoinAll` store action mirrors `autoJoin` exactly (no state mutation — doesn't affect tree)
- Button placement: between "Import" and "Add Department" in the actions bar
- `loading` prop on `Button` from `@plane/propel` handles spinner — no custom loading UI needed
- `window.confirm()` for confirmation matches existing `handleDelete` pattern in same file

## Requirements

<!-- Updated: Validation Session 1 - modal + mode param required -->

- `IRejoinAllResult` interface exported from service file
- `rejoinAll(mode: TAutoJoinMode)` service method calls `POST /api/instances/departments/rejoin-all/` with `{ mode }`
- `rejoinAll` store action in interface + implementation + `makeObservable`
- New `rejoin-all-modal.tsx` component: mode selector (All Projects / Bank-wide) + Confirm/Cancel (mirrors `AutoJoinModal`)
- "Rejoin" button in page header opens modal; modal calls `rejoinAll(mode)` on confirm
- Toast on success shows `newly_added` + `departments_processed`

## Related Code Files

<!-- Updated: Validation Session 1 - new modal file added -->

- `packages/services/src/department/instance-department.service.ts` — add after line 88 (after `IAutoJoinResult`)
- `apps/admin/store/instance-department.store.ts` — extend interface line ~43, add action after `autoJoin` line ~207
- `apps/admin/app/(all)/(dashboard)/departments/page.tsx` — add modal state + button (no `isRejoining` needed — modal handles loading)
- `apps/admin/app/(all)/(dashboard)/departments/components/rejoin-all-modal.tsx` — NEW small modal component

## Implementation Steps

### 1. Service — `instance-department.service.ts`

After `IAutoJoinResult` interface (~line 88), add:

```typescript
export interface IRejoinAllResult {
  departments_processed: number;
  newly_added: number;
  already_member: number;
  total: number;
}
```

After `autoJoin()` method (~line 173), add:

```typescript
// Updated: Validation Session 1 - accepts mode param
async rejoinAll(mode: TAutoJoinMode): Promise<IRejoinAllResult> {
  return this.post("/api/instances/departments/rejoin-all/", { mode })
    .then((res) => res?.data as IRejoinAllResult)
    .catch((err: { response?: { data: unknown } }) => {
      throw err?.response?.data;
    });
}
```

### 1b. New Modal — `rejoin-all-modal.tsx`

<!-- Updated: Validation Session 1 - modal replaces window.confirm() -->

New file: `apps/admin/app/(all)/(dashboard)/departments/components/rejoin-all-modal.tsx`

Mirrors `auto-join-modal.tsx` structure but for global rejoin (no `deptId`/`deptName` props):

```tsx
"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IAutoJoinResult, TAutoJoinMode } from "@plane/services";
import { useInstanceDepartment } from "@/hooks/store";

type Props = { open: boolean; onClose: () => void };

export const RejoinAllModal = function RejoinAllModal({ open, onClose }: Props) {
  const { rejoinAll } = useInstanceDepartment();
  const [mode, setMode] = useState<TAutoJoinMode>("all_projects");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IAutoJoinResult & { departments_processed: number } | null>(null);

  if (!open) return null;

  const handleClose = () => { setResult(null); setMode("all_projects"); onClose(); };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await rejoinAll(mode);
      setResult(res);
    } catch (err) {
      const message = (err as Record<string, string>)?.error ?? "Rejoin failed";
      setToast({ type: TOAST_TYPE.ERROR, title: message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-layer-1 rounded-xl border border-subtle shadow-xl w-[420px] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-accent-primary" />
          <h2 className="text-16 font-semibold">Rejoin All Managers</h2>
        </div>
        {result ? (
          // Show result stats (same 3-column grid as AutoJoinModal)
          // + departments_processed stat
          // Done button → handleClose
        ) : (
          // Mode selector (same radio pattern as AutoJoinModal)
          // Cancel + Rejoin All buttons
        )}
      </div>
    </div>
  );
};
```

**Key differences from `AutoJoinModal`:**

- No `deptId`/`deptName` props — global operation
- `IRejoinAllResult` has `departments_processed` extra field → show 4th stat card
- Use `RefreshCw` icon instead of `UserPlus`
- Button label: "Rejoin All" instead of "Auto Join"

### 2. Store — `instance-department.store.ts`

**Import** — add `IRejoinAllResult` to `@plane/services` import block (alongside `IAutoJoinResult`):

```typescript
import type {
  ...
  IAutoJoinResult,
  IRejoinAllResult,  // add
  ...
} from "@plane/services";
```

**Interface** — add after `autoJoin` line (~43):

```typescript
rejoinAll: (mode: TAutoJoinMode) => Promise<IRejoinAllResult>;
```

**`makeObservable`** — add `rejoinAll: action` alongside `autoJoin: action`

**Method** — add after `autoJoin` method (~line 207):

```typescript
rejoinAll = async (mode: TAutoJoinMode): Promise<IRejoinAllResult> => {
  try {
    return await this.service.rejoinAll(mode);
  } catch (error) {
    console.error("Error rejoining all department managers to projects", error);
    throw error;
  }
};
```

### 3. Page — `departments/page.tsx`

<!-- Updated: Validation Session 1 - modal replaces window.confirm() + isRejoining -->

**Imports:**

```typescript
// lucide-react — add RefreshCw to existing import
import { Download, Plus, Upload, Loader as LoaderIcon, RefreshCw } from "lucide-react";
// Add RejoinAllModal import
import { RejoinAllModal } from "./components/rejoin-all-modal";
```

**State** — add after existing `useState` calls:

```typescript
const [rejoinModalOpen, setRejoinModalOpen] = useState(false);
```

**Button** — add between Import and Add Department buttons (~line 74):

```tsx
<Button variant="outline" size="sm" onClick={() => setRejoinModalOpen(true)}>
  <RefreshCw className="w-4 h-4" />
  Rejoin
</Button>
```

**Modal** — add alongside `DepartmentFormModal` and `AutoJoinModal` at bottom of JSX:

```tsx
<RejoinAllModal open={rejoinModalOpen} onClose={() => setRejoinModalOpen(false)} />
```

Final button order: `Export | Import | Rejoin | Add Department`

## Todo

- [ ] Add `IRejoinAllResult` interface to `instance-department.service.ts`
- [ ] Add `rejoinAll(mode)` method to `InstanceDepartmentService`
- [ ] Import `IRejoinAllResult` + update `rejoinAll` signature in store
- [ ] Add `rejoinAll(mode)` to `IInstanceDepartmentStore` interface
- [ ] Register `rejoinAll: action` in `makeObservable`
- [ ] Add `rejoinAll` method to `InstanceDepartmentStore`
- [ ] Create `rejoin-all-modal.tsx` component (mirrors `auto-join-modal.tsx`)
- [ ] Add `RefreshCw` + `RejoinAllModal` imports to `page.tsx`
- [ ] Add `rejoinModalOpen` state to `page.tsx`
- [ ] Add Rejoin button opening modal
- [ ] Add `<RejoinAllModal>` to JSX
- [ ] Run `pnpm check:lint` — 0 errors

## Success Criteria

- "Rejoin" button renders beside "Add Department"
- Button shows loading spinner while request is in-flight
- Success toast displays `newly_added` and `departments_processed`
- Error toast shown on failure
- TypeScript compiles with no errors
- `pnpm check:lint` passes

## Risk Assessment

- **Type export**: `IRejoinAllResult` must be exported from service file and re-exported if `@plane/services` uses an index barrel — verify barrel export file
- Low overall risk — all patterns mirror existing `autoJoin` code

## Security Considerations

- No user input processed in frontend
- API call authenticated via existing session cookie (same as all other department actions)

## Unresolved Questions

- Does `@plane/services` have a barrel `index.ts` that needs updating for `IRejoinAllResult`? Check if `IAutoJoinResult` is re-exported there — if so, add `IRejoinAllResult` to the same export.
