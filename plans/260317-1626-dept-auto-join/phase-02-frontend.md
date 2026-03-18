# Phase 02 — Frontend: Service, Store, Modal, Button

**Plan**: [plan.md](./plan.md)
**Depends on**: [phase-01-backend.md](./phase-01-backend.md)
**Date**: 2026-03-17
**Status**: complete
**Priority**: P2

---

## Overview

Add Auto Join UI in God Mode departments page: service method → store action → modal component → button in tree item.

---

## Key Insights

- Follow `linkWorkspace` pattern exactly — same service/store/modal structure already established.
- `DepartmentTreeItem` actions group (lines 65–72) is the insertion point for the Auto Join button.
- Button must be **disabled** when `!dept.linked_workspace || !dept.manager` — surface as tooltip.
- Modal shows 2 radio options; on success transitions to result state showing counts.
- `AutoJoinModal` should be a new file under `.../departments/components/` (≤150 lines).
- Use `@plane/propel/button`, `@plane/propel/toast`, lucide icons — same as other components.

---

## Requirements

1. Service: `autoJoin(id, mode)` → `IAutoJoinResult`
2. Store: `autoJoin(id, mode)` action (no state refresh needed — doesn't affect dept structure)
3. `AutoJoinModal`: 2 radio options + confirm/cancel + result state
4. Button in `DepartmentTreeItem` actions group, disabled when preconditions unmet
5. Page wires `autoJoinDeptId` state → modal open/close

---

## New Types

```typescript
// In instance-department.service.ts
export type TAutoJoinMode = "all_projects" | "bank_wide_projects";

export interface IAutoJoinResult {
  newly_added: number;
  already_member: number;
  total: number;
}
```

---

## Architecture

```
DepartmentsPage
  └─ DepartmentTreeItem (per dept)
       └─ "Auto Join" button (disabled guard)
            │ onClick → setAutoJoinDeptId(dept.id)
            ▼
       AutoJoinModal (open when autoJoinDeptId set)
            │ onConfirm(mode) → store.autoJoin(id, mode)
            │ success → show result counts
            └─ onClose → setAutoJoinDeptId(null)

store.autoJoin(id, mode)
  └─ service.autoJoin(id, mode)
       └─ POST /api/instances/departments/<id>/auto-join/
            └─ returns IAutoJoinResult
```

---

## Related Files

| File | Change |
|------|--------|
| `packages/services/src/department/instance-department.service.ts` | Add `TAutoJoinMode`, `IAutoJoinResult`, `autoJoin()` method |
| `apps/admin/store/instance-department.store.ts` | Add `autoJoin()` to interface + class |
| `apps/admin/app/(all)/(dashboard)/departments/components/auto-join-modal.tsx` | **New** component |
| `apps/admin/app/(all)/(dashboard)/departments/components/department-tree-item.tsx` | Add button + prop |
| `apps/admin/app/(all)/(dashboard)/departments/page.tsx` | Wire `autoJoinDeptId` state + modal |

---

## Implementation Steps

### 1. Service — `instance-department.service.ts`

Add after `unlinkWorkspace` method:

```typescript
export type TAutoJoinMode = "all_projects" | "bank_wide_projects";

export interface IAutoJoinResult {
  newly_added: number;
  already_member: number;
  total: number;
}

// Inside InstanceDepartmentService class:
async autoJoin(id: string, mode: TAutoJoinMode): Promise<IAutoJoinResult> {
  return this.post(`/api/instances/departments/${id}/auto-join/`, { mode })
    .then((res) => res?.data as IAutoJoinResult)
    .catch((err: { response?: { data: unknown } }) => {
      throw err?.response?.data;
    });
}
```

### 2. Store — `instance-department.store.ts`

Add to interface:
```typescript
autoJoin: (id: string, mode: TAutoJoinMode) => Promise<IAutoJoinResult>;
```

Add to `makeObservable`:
```typescript
autoJoin: action,
```

Add method:
```typescript
autoJoin = async (id: string, mode: TAutoJoinMode): Promise<IAutoJoinResult> => {
  try {
    return await this.service.autoJoin(id, mode);
  } catch (error) {
    console.error("Error auto-joining department manager to projects", error);
    throw error;
  }
};
```

Update import from `@plane/services`:
```typescript
import type { ..., TAutoJoinMode, IAutoJoinResult } from "@plane/services";
```

### 3. New Component — `auto-join-modal.tsx`

```typescript
// apps/admin/app/(all)/(dashboard)/departments/components/auto-join-modal.tsx
"use client";
import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IAutoJoinResult, TAutoJoinMode } from "@plane/services";
import { useInstanceDepartment } from "@/hooks/store";

type TResultState = IAutoJoinResult | null;

type Props = {
  deptId: string | null;         // null = closed
  deptName: string;
  onClose: () => void;
};

export const AutoJoinModal = function AutoJoinModal({ deptId, deptName, onClose }: Props) {
  const { autoJoin } = useInstanceDepartment();
  const [mode, setMode] = useState<TAutoJoinMode>("all_projects");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TResultState>(null);

  if (!deptId) return null;

  const handleClose = () => {
    setResult(null);
    setMode("all_projects");
    onClose();
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await autoJoin(deptId, mode);
      setResult(res);
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Auto join failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-layer-1 rounded-xl border border-subtle shadow-xl w-[420px] p-6 space-y-5">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-accent-primary" />
          <h2 className="text-16 font-semibold">Auto Join — {deptName}</h2>
        </div>

        {result ? (
          // Result state
          <div className="space-y-3">
            <p className="text-14 text-secondary">Manager joined to projects:</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-layer-2 p-3">
                <div className="text-20 font-bold text-success">{result.newly_added}</div>
                <div className="text-11 text-tertiary mt-1">Newly added</div>
              </div>
              <div className="rounded-lg bg-layer-2 p-3">
                <div className="text-20 font-bold text-tertiary">{result.already_member}</div>
                <div className="text-11 text-tertiary mt-1">Already member</div>
              </div>
              <div className="rounded-lg bg-layer-2 p-3">
                <div className="text-20 font-bold">{result.total}</div>
                <div className="text-11 text-tertiary mt-1">Total</div>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="primary" size="sm" onClick={handleClose}>Done</Button>
            </div>
          </div>
        ) : (
          // Selection state
          <div className="space-y-4">
            <p className="text-13 text-secondary">
              Join the department manager as <strong>Admin</strong> to:
            </p>
            <div className="space-y-2">
              {[
                { value: "all_projects" as TAutoJoinMode, label: "All Projects", desc: "Every project in the linked workspace" },
                { value: "bank_wide_projects" as TAutoJoinMode, label: "Bank-wide Projects", desc: "Only projects marked as bank-wide" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    mode === opt.value ? "border-accent-primary bg-accent-subtle" : "border-subtle hover:border-secondary"
                  }`}
                >
                  <input
                    type="radio"
                    name="auto-join-mode"
                    value={opt.value}
                    checked={mode === opt.value}
                    onChange={() => setMode(opt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-13 font-medium">{opt.label}</div>
                    <div className="text-12 text-tertiary">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleConfirm} loading={loading}>
                <UserPlus className="w-3.5 h-3.5" />
                Auto Join
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 4. `department-tree-item.tsx` — Add button + prop

Add `onAutoJoin` prop and button in actions group:

```typescript
// Props type update:
type Props = {
  dept: IInstanceDepartment;
  depth?: number;
  onEdit: (dept: IInstanceDepartment) => void;
  onDelete: (id: string) => void;
  onAutoJoin: (dept: IInstanceDepartment) => void;  // new
};

// Destructure:
export const DepartmentTreeItem = observer(function DepartmentTreeItem({
  dept, depth = 0, onEdit, onDelete, onAutoJoin,
}) {

// Add import:
import { UserPlus } from "lucide-react";  // add to existing lucide import

// In actions group, before Edit button:
<Button
  variant="outline"
  size="sm"
  onClick={() => onAutoJoin(dept)}
  disabled={!dept.linked_workspace || !dept.manager}
  title={!dept.linked_workspace ? "No linked workspace" : !dept.manager ? "No manager assigned" : "Auto join manager to projects"}
>
  <UserPlus className="w-3.5 h-3.5" />
</Button>

// Recursive children: pass onAutoJoin through
<DepartmentTreeItem ... onAutoJoin={onAutoJoin} />
```

### 5. `page.tsx` — Wire state + modal

```typescript
// Add import:
import { AutoJoinModal } from "./components/auto-join-modal";

// Add state:
const [autoJoinDept, setAutoJoinDept] = useState<IInstanceDepartment | null>(null);

// Handle:
const handleAutoJoin = (dept: IInstanceDepartment) => setAutoJoinDept(dept);

// Pass to tree items:
<DepartmentTreeItem ... onAutoJoin={handleAutoJoin} />

// Add modal below DepartmentFormModal:
<AutoJoinModal
  deptId={autoJoinDept?.id ?? null}
  deptName={autoJoinDept?.name ?? ""}
  onClose={() => setAutoJoinDept(null)}
/>
```

---

## Todo

- [x] Add `TAutoJoinMode`, `IAutoJoinResult`, `autoJoin()` to service
- [x] Add `autoJoin` to store interface + `makeObservable` + method
- [x] Create `auto-join-modal.tsx` component
- [x] Update `department-tree-item.tsx` — prop + button + recursive pass
- [x] Update `page.tsx` — state, handler, modal
- [x] Run `pnpm check:lint` — 0 errors

---

## Success Criteria

- Auto Join button visible on each dept row (hover), disabled when no workspace/manager
- Click opens modal with 2 radio options
- Confirm calls API, result screen shows `newly_added / already_member / total`
- Cancel closes without action
- Lint passes, no TypeScript errors

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| `Button` `loading` prop may not exist in `@plane/propel` | Check propel Button API; fallback to disabled+spinner |
| `disabled` styling on button may not be obvious | Add `title` tooltip for hover explanation |
| Modal z-index conflicts | Use `z-50`, same as other modals in codebase |
| Component >150 lines | Modal is ~120 lines — within limit |
