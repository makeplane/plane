# Phase 04: Frontend – Wire Up Reason Modal

## Overview

Gắn `FieldChangeReasonModal` vào 2 điểm: due date trong sidebar và completed-at property.

---

## 1. Due Date – CE Wrapper Component (DO NOT modify core/sidebar.tsx directly)

<!-- Updated: Validation Session 1 - Use CE wrapper instead of modifying core/sidebar.tsx -->

### Pattern

Create a CE wrapper component `DueDateProperty` in `apps/web/ce/components/issues/issue-details/sidebar/` that:

- Receives same props as the DateDropdown in core sidebar
- Intercepts onChange → lưu pending date → mở modal → on confirm gọi update với reason
- Exported and used via `@/plane-web/` import in core/sidebar.tsx (read-only import, no state change to core)

### New file: `apps/web/ce/components/issues/issue-details/sidebar/due-date-property.tsx`

```tsx
import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { renderFormattedPayloadDate } from "@plane/utils";
import type { TIssueOperations } from "@/components/issues/issue-detail/root";
import { FieldChangeReasonModal } from "./field-change-reason-modal";

type TDueDatePropertyProps = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  isEditable: boolean;
  value: string | null; // current target_date
};

export function DueDateProperty({
  workspaceSlug,
  projectId,
  issueId,
  issueOperations,
  isEditable,
  value,
}: TDueDatePropertyProps) {
  const { t } = useTranslation();
  const [pendingDueDate, setPendingDueDate] = useState<string | null | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleChange = (val: Date | null) => {
    const formatted = val ? renderFormattedPayloadDate(val) : null;
    if (!formatted) {
      // Clearing — no reason required
      void issueOperations.update(workspaceSlug, projectId, issueId, { target_date: null });
      return;
    }
    setPendingDueDate(formatted);
    setIsModalOpen(true);
  };

  const handleConfirm = async (reason: string) => {
    await issueOperations.update(workspaceSlug, projectId, issueId, {
      target_date: pendingDueDate ?? null,
      reason,
    } as Parameters<typeof issueOperations.update>[3]);
  };

  return (
    <>
      {/* Render DateDropdown here with onChange=handleChange */}
      {/* ... existing DateDropdown JSX from core/sidebar.tsx ... */}
      <FieldChangeReasonModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPendingDueDate(undefined);
        }}
        onConfirm={handleConfirm}
        fieldLabel={t("common.order_by.due_date")}
      />
    </>
  );
}
```

> **Implementation note:** Read core/sidebar.tsx to see the exact DateDropdown props and JSX, then replicate in this CE wrapper. Replace the DateDropdown block in sidebar.tsx with `<DueDateProperty ... />` import from CE.

> **Why CE wrapper?** Validation Session 1 confirmed: never modify core/ for new features. CE wrapper maintains the pattern and keeps core/ clean.

---

## 2. Completed At – `apps/web/ce/components/issues/issue-details/sidebar/completed-at-property.tsx`

### State to add

```tsx
const [pendingCompletedAt, setPendingCompletedAt] = useState<string | null>(null);
const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
```

### Change CompletedAtDateTimePicker onChange

<!-- Updated: Validation Session 1 - Only require reason when setting a value, not clearing -->

```tsx
// Before:
onChange={(isoString) =>
  void updateIssue(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "", issueId, {
    completed_at: isoString,
  })
}

// After:
onChange={(isoString) => {
  if (!isoString) {
    // Clearing — no reason required
    void updateIssue(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "", issueId, { completed_at: null });
    return;
  }
  setPendingCompletedAt(isoString);
  setIsReasonModalOpen(true);
}}
```

### Modal handler

```tsx
const handleConfirm = async (reason: string) => {
  await updateIssue(workspaceSlug?.toString() ?? "", projectId?.toString() ?? "", issueId, {
    completed_at: pendingCompletedAt,
    reason,
  });
};
```

### Add modal in JSX

```tsx
<FieldChangeReasonModal
  isOpen={isReasonModalOpen}
  onClose={() => {
    setIsReasonModalOpen(false);
    setPendingCompletedAt(null);
  }}
  onConfirm={handleConfirm}
  fieldLabel={t("common.completed_at")}
/>
```

### Import

```tsx
import { useState } from "react";
import { FieldChangeReasonModal } from "./field-change-reason-modal";
```

---

## TypeScript: TIssueUpdatePayload (Worklog Pattern)

<!-- Updated: Validation Session 1 - Follow worklog IWorkLogUpdate pattern, add explicit type -->

Mirrors `IWorkLogUpdate` which has `reason?: string`. Follow same approach:

### Step 1: Add type to `packages/types/src/issues/issue.ts` (or a new `issue-update.ts`)

```ts
// Payload for PATCH /issues/{id}/ — reason is transient (popped by backend before save)
export type TIssueUpdatePayload = Partial<TIssue> & { reason?: string };
```

Export from `packages/types/src/index.ts`:

```ts
export type { TIssueUpdatePayload } from "./issues/issue-update";
```

### Step 2: Update `apps/web/core/services/issue/issue.service.ts`

```ts
async patchIssue(workspaceSlug: string, projectId: string, issueId: string, data: TIssueUpdatePayload): Promise<any>
```

### Step 3: Update `TIssueOperations` in `apps/web/core/components/issues/issue-detail/root.tsx`

```ts
update: (workspaceSlug: string, projectId: string, issueId: string, data: TIssueUpdatePayload) => Promise<void>;
```

This makes `reason` a first-class typed field — no casts needed anywhere.

## Verification

- Click thay đổi due date → reason modal xuất hiện → nhập reason → confirm → issue update
- Click thay đổi due date → close modal → issue KHÔNG update (pending cleared)
- Tương tự cho completed_at
