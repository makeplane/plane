# Phase 3: Frontend Delete Confirmation Dialog

## Context Links

- Activity root: `apps/web/ce/components/issues/worklog/activity/root.tsx`
- Store: `apps/web/core/store/worklog.store.ts`
- Service: `apps/web/core/services/worklog.service.ts`
- Types: `packages/types/src/worklog.ts`

## Overview

- **Priority**: P1
- **Status**: complete
- **Description**: Replace immediate delete with a confirmation dialog that includes a required "Reason for deletion" textarea. Pass reason to DELETE API.

## Key Insights

- Current delete in `IssueActivityWorklog` calls `store.deleteWorklog()` directly — no confirmation
- `WorklogService.deleteWorklog()` calls `this.delete(url)` without body — needs to pass `{ reason }`
- `APIService.delete()` already supports `data` param (second arg)
- Store's `deleteWorklog()` needs a `reason` parameter
- Can reuse `ModalCore` from `@plane/ui` for the confirmation dialog

## Requirements

### Functional

- Click "Delete" opens confirmation dialog (not immediate delete)
- Dialog shows "Reason for deletion" textarea — required
- Confirm button triggers delete with reason; cancel closes dialog
- Toast on success/failure

### Non-functional

- i18n keys for dialog text
- Clean separation: new component file for delete confirmation dialog

## Related Code Files

### Create

- `apps/web/ce/components/issues/worklog/worklog-delete-modal.tsx` — new delete confirmation dialog

### Modify

- `apps/web/ce/components/issues/worklog/activity/root.tsx` — open delete dialog instead of direct delete
- `apps/web/core/store/worklog.store.ts` — add `reason` param to `deleteWorklog()`
- `apps/web/core/services/worklog.service.ts` — pass reason body in DELETE request
- `packages/types/src/worklog.ts` — no change needed (reason is a method param, not type field)
- `packages/i18n/src/locales/en/translations.ts` — add i18n keys
- `packages/i18n/src/locales/vi/translations.ts` — add i18n keys
- `packages/i18n/src/locales/ko/translations.ts` — add i18n keys

## Implementation Steps

### 1. Add i18n keys

Under `worklog` in en translations:

```typescript
delete_reason_label: "Reason for deletion",
delete_reason_placeholder: "Explain why this work log is being deleted...",
delete_reason_required: "A reason for deletion is required.",
confirm_delete: "Confirm Delete",
```

### 2. Update `WorklogService.deleteWorklog()`

In `apps/web/core/services/worklog.service.ts`:

```typescript
async deleteWorklog(
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  worklogId: string,
  reason?: string
): Promise<void> {
  return this.delete(
    `/api/workspaces/${workspaceSlug}/projects/${projectId}/issues/${issueId}/worklogs/${worklogId}/`,
    reason ? { reason } : undefined
  ).then(() => {
    return;
  }).catch((error: { response?: { data: unknown } }) => {
    throw error?.response?.data;
  });
}
```

### 3. Update `WorklogStore.deleteWorklog()`

In `apps/web/core/store/worklog.store.ts`, add reason param:

```typescript
deleteWorklog = async (
  workspaceSlug: string,
  projectId: string,
  issueId: string,
  worklogId: string,
  reason?: string
): Promise<void> => {
  // ... existing logic ...
  await this.worklogService.deleteWorklog(workspaceSlug, projectId, issueId, worklogId, reason);
  // ...
};
```

Also update the `IWorklogStore` interface `deleteWorklog` signature to include `reason?: string`.

### 4. Create `WorklogDeleteModal`

New file: `apps/web/ce/components/issues/worklog/worklog-delete-modal.tsx`

```tsx
// ~80 lines
// Props: isOpen, onClose, onConfirm (reason: string) => Promise<void>
// State: reason text, isSubmitting
// UI: ModalCore with warning icon, reason textarea (required), Cancel + Confirm Delete buttons
```

Key behavior:

- `onConfirm` receives the reason string
- Button disabled while submitting or reason empty
- Clear reason state on open

### 5. Update `IssueActivityWorklog` (activity/root.tsx)

Replace direct `handleDelete` with modal flow:

a. Add state: `const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);`

b. Update `handleDelete` to accept reason:

```typescript
const handleDelete = async (reason: string) => {
  if (!worklog) return;
  try {
    await store.deleteWorklog(workspaceSlug, projectId, issueId, worklog.id, reason);
    setToast({ ... });
  } catch (err: unknown) { ... }
};
```

c. Change menu item onClick to open modal:

```tsx
<CustomMenu.MenuItem onClick={() => setIsDeleteModalOpen(true)}>
```

d. Add delete modal at bottom of component:

```tsx
{
  isEditable && (
    <WorklogDeleteModal
      isOpen={isDeleteModalOpen}
      onClose={() => setIsDeleteModalOpen(false)}
      onConfirm={handleDelete}
    />
  );
}
```

## Todo List

- [x] Add i18n keys (en, vi, ko)
- [x] Update `WorklogService.deleteWorklog()` to pass reason body
- [x] Update `WorklogStore.deleteWorklog()` signature with reason param
- [x] Update `IWorklogStore` interface
- [x] Create `WorklogDeleteModal` component
- [x] Update `IssueActivityWorklog` to use delete modal
- [x] Test: click Delete opens confirmation dialog
- [x] Test: submit without reason shows validation error
- [x] Test: confirm with reason triggers API delete
- [x] Test: cancel closes dialog without deleting

## Success Criteria

- Delete no longer happens immediately — confirmation dialog shown
- Reason is mandatory and sent to API
- API accepts DELETE with reason body
- Toast feedback on success/failure
- Cancel safely closes dialog

## Risk Assessment

- **New component file**: `worklog-delete-modal.tsx` (~80 lines, well under limit)
- **Store interface change**: `reason` param is optional — backward compatible
- **Service change**: `reason` is optional param — backward compatible

## Security Considerations

- Reason is user input — plain text rendering only
- Admin permission already enforced

## Next Steps

- Phase 4: Display reason in activity feed
