# Phase 2: Frontend Edit Modal Reason Field

## Context Links

- Modal: `apps/web/ce/components/issues/worklog/worklog-modal.tsx`
- Store: `apps/web/core/store/worklog.store.ts`
- Service: `apps/web/core/services/worklog.service.ts`
- Types: `packages/types/src/worklog.ts`
- i18n: `packages/i18n/src/locales/en/translations.ts`

## Overview

- **Priority**: P1
- **Status**: complete
- **Description**: Add required "Reason for change" text input to the worklog edit modal. Pass reason to API via `updateWorklog()`.

## Key Insights

- `WorklogModal` currently has `existingWorklog` prop — when set, modal is in edit mode
- Reason field only required in edit mode (not create)
- `IWorkLogUpdate` type needs `reason?: string` added
- `WorklogService.updateWorklog()` sends PATCH with data object — reason goes alongside other fields
- Store's `updateWorklog()` passes data straight to service — no change needed in store

## Requirements

### Functional

- When editing (existingWorklog truthy), show "Reason for change" textarea — required
- Submit button disabled until reason is non-empty (in edit mode)
- Reason sent as `reason` field in PATCH body

### Non-functional

- i18n for label, placeholder text
- Reason field clears when modal reopens

## Related Code Files

### Modify

- `packages/types/src/worklog.ts` — add `reason` to `IWorkLogUpdate`
- `apps/web/ce/components/issues/worklog/worklog-modal.tsx` — add reason textarea (edit mode only)
- `packages/i18n/src/locales/en/translations.ts` — add i18n keys
- `packages/i18n/src/locales/vi/translations.ts` — add i18n keys
- `packages/i18n/src/locales/ko/translations.ts` — add i18n keys

### No changes needed

- `apps/web/core/services/worklog.service.ts` — already passes `data` object to PATCH
- `apps/web/core/store/worklog.store.ts` — already passes `data` to service

## Implementation Steps

### 1. Update `IWorkLogUpdate` type

In `packages/types/src/worklog.ts`:

```typescript
export interface IWorkLogUpdate {
  duration_minutes?: number;
  description?: string;
  logged_at?: string;
  reason?: string; // Required for edit, validated by backend
}
```

### 2. Add i18n keys

In `packages/i18n/src/locales/en/translations.ts` under `worklog`:

```typescript
reason_label: "Reason for change",
reason_placeholder: "Explain why this work log is being modified...",
reason_required: "A reason for this change is required.",
```

Add equivalent translations for vi and ko.

### 3. Update `WorklogModal`

In `apps/web/ce/components/issues/worklog/worklog-modal.tsx`:

a. Add state: `const [reason, setReason] = useState("");`

b. Reset reason in `useEffect` when modal opens (alongside other resets):

```typescript
setReason("");
```

c. Add reason textarea AFTER description field, only in edit mode:

```tsx
{
  existingWorklog && (
    <div className="flex flex-col gap-1">
      <label htmlFor="worklog-reason" className="text-11 font-medium text-tertiary">
        {t("worklog.reason_label")} <span className="text-red-500">*</span>
      </label>
      <textarea
        id="worklog-reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder={t("worklog.reason_placeholder")}
        className="rounded-md border-[0.5px] border-subtle-1 bg-layer-2 px-3 py-2 text-13 text-primary placeholder-tertiary focus:outline-none resize-none"
        required
      />
    </div>
  );
}
```

d. In `handleSubmit`, validate reason in edit mode:

```typescript
if (existingWorklog && !reason.trim()) {
  setToast({ type: TOAST_TYPE.ERROR, title: t("worklog.error"), message: t("worklog.reason_required") });
  return;
}
```

e. Include reason in update payload:

```typescript
await store.updateWorklog(workspaceSlug, projectId, issueId, existingWorklog.id, {
  duration_minutes,
  logged_at: loggedAt,
  description: description || undefined,
  reason: reason.trim(),
});
```

## Todo List

- [x] Add `reason` to `IWorkLogUpdate` type
- [x] Add i18n keys (en, vi, ko)
- [x] Add reason state and reset in `WorklogModal`
- [x] Add reason textarea (edit mode only)
- [x] Add client-side validation for reason
- [x] Include reason in update API call
- [x] Test: edit modal shows reason field
- [x] Test: submit without reason shows error
- [x] Test: submit with reason succeeds

## Success Criteria

- Edit modal shows required "Reason for change" field
- Cannot submit edit without reason
- Reason sent to API and accepted (no 400 error)
- Create mode unchanged (no reason field shown)

## Risk Assessment

- **Low risk**: Isolated to edit modal, doesn't affect create flow
- Modal file stays under 200 lines (currently 185, adding ~20 lines)

## Security Considerations

- Reason is plain text, no XSS risk (rendered as text in activity feed)
- Backend also validates — client validation is UX only

## Next Steps

- Phase 4: Display reason in activity feed
