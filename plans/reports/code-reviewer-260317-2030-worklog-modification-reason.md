# Code Review: Worklog Modification Reason + Validation UX + Activity Scalability

**Reviewer**: code-reviewer
**Date**: 2026-03-17
**Branch**: develop
**Score**: 7/10 (1 critical issue blocks auto-approve)

---

## Scope

- **Files reviewed**: 22 changed files across 6 phases
- **LOC changed**: ~800 (estimated from diffs)
- **Focus**: Breaking changes, security, edge cases, pattern consistency, file sizes

---

## Overall Assessment

Solid feature implementation covering backend validation, frontend UX, audit trail, and scalability. Architecture decisions are sound -- CE override pattern followed, MobX patterns correct, i18n keys present for EN/VI/KO. One critical bug in error extraction makes all API errors display generic fallback messages instead of specific server messages.

---

## Critical Issues

### C1. `extractApiError()` never extracts errors -- always returns `undefined`

**File**: `apps/web/ce/components/issues/worklog/utils/extract-api-error.ts`

The worklog service `.catch` handlers already unwrap the Axios error:

```typescript
// worklog.service.ts line 32, 49, 68, 85, etc.
.catch((error: { response?: { data: unknown } }) => {
  throw error?.response?.data;  // throws the RAW data object, e.g. {"error": "message"}
});
```

But `extractApiError` tries to access `err.response.data` again:

```typescript
const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data;
```

Since the thrown error IS already the data (e.g. `{"error": "A reason for this change is required."}`), `err.response` is `undefined`, so the function always returns `undefined`. Users will see generic toast messages like "Failed to save" instead of specific validation errors.

**Fix**:

```typescript
export function extractApiError(err: unknown): string | undefined {
  // Service layer already unwraps error.response.data, so err IS the data object
  const data = err as Record<string, unknown> | undefined;
  if (!data || typeof data !== "object") return undefined;

  if (typeof data.error === "string") return data.error;

  for (const value of Object.values(data)) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
      return value[0];
    }
  }
  return undefined;
}
```

**Impact**: All worklog validation errors (reason required, edit window, daily limit) show as generic fallback text to users.

---

## High Priority

### H1. Stale comments reference "7 working days" instead of 60

**Files**:

- `apps/web/ce/components/issues/worklog/utils/worklog-date-utils.ts:23` -- JSDoc says "7 working days"
- `apps/web/ce/components/issues/worklog/activity/root.tsx:45` -- Comment says "7-working-day window"

These are misleading for future developers.

### H2. `dict(request.data)` may lose data with QueryDict

**File**: `apps/api/plane/app/views/issue/worklog.py:168`

```python
activity_data = dict(request.data)
```

When `request.data` is a Django `QueryDict` (form-encoded request), `dict()` wraps values in lists: `{"reason": ["some text"]}` instead of `{"reason": "some text"}`. For JSON requests (typical for this API), this works fine since `request.data` is already a plain dict. Low risk but fragile -- if content-type ever changes, the activity reason would be stored as a list.

**Safer**:

```python
activity_data = {**request.data}  # or request.data.dict() for QueryDict
activity_data["reason"] = reason
```

### H3. Bulk endpoint deletes bypass reason requirement

**File**: `apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py:129-146`

The `_delete_entry` method in `TimesheetBulkUpdateEndpoint` does not require a reason, while the individual delete endpoint does. This creates an inconsistency -- admin-imposed audit requirements can be bypassed via the bulk API.

The `_update_entry` similarly bypasses reason requirement.

---

## Medium Priority

### M1. `worklog.activity.created` type dispatched but no handler registered

**File**: `apps/api/plane/bgtasks/issue_activities_task.py` ACTIVITY_MAPPER has handlers for `worklog.activity.updated` and `worklog.activity.deleted` but NOT `worklog.activity.created` (dispatched from `worklog.py:115`). Created worklogs produce no `IssueActivity` record. Pre-existing but now more visible since updates/deletes DO create records.

### M2. Migration uses raw SQL instead of ORM

**File**: `apps/api/plane/db/migrations/0151_enable_time_tracking_all_projects.py:8`

Uses `UPDATE projects SET ...` -- hardcodes table name. If the model's `db_table` is customized, this breaks. Using `apps.get_model("db", "Project")` would be safer. Also note the `reverse_migration` is a no-op, making this truly irreversible.

### M3. Optimistic delete re-throws after rollback in store

**File**: `apps/web/core/store/worklog.store.ts:166-170`

The `deleteWorklog` store method does optimistic removal then on error, rolls back the list and re-throws. The caller in `activity/root.tsx:68` also re-throws. This double-throw is fine but the error path means the UI briefly shows the worklog removed, then restored, then the delete modal stays open. Consider whether the UX should also show a toast in this case (currently the caller handles it).

### M4. `groupConsecutiveWorklogs` performance with many worklogs

**File**: `apps/web/ce/store/issue/issue-details/activity.store.ts:175-177`

For each collapsed worklog entry, `worklogs.find()` is called -- O(n\*m) where n = collapsed entries, m = total worklogs. For issues with hundreds of worklogs, consider building a lookup Map first.

### M5. Type assertion on WORKLOG_GROUP

**File**: `apps/web/ce/store/issue/issue-details/activity.store.ts:182`

```typescript
activity_type: EActivityFilterType.WORKLOG_GROUP as "WORKLOG_GROUP",
```

This `as` cast suggests a type mismatch between the enum value and the union type literal. The `TIssueActivityComment` union uses string literal `"WORKLOG_GROUP"` but the code uses the enum. If the enum value ever changes, this silently breaks.

---

## Low Priority

### L1. `todayDate()` called at module level AND in component

**File**: `apps/web/ce/components/issues/worklog/worklog-modal.tsx:29-31`

`todayDate()` is defined at module scope but only used inside the component. It's called fresh each time (functional), so no stale date issue. Fine as-is.

### L2. Delete modal lacks Enter key submission

**File**: `apps/web/ce/components/issues/worklog/worklog-delete-modal.tsx`

The delete modal uses a `<div>` not a `<form>`, so pressing Enter in the textarea doesn't submit. The edit modal uses `<form onSubmit>` which handles Enter. Minor UX inconsistency.

### L3. `eslint-disable-next-line` for floating promise

**File**: `apps/web/ce/components/issues/worklog/worklog-modal.tsx:77`

```typescript
// eslint-disable-next-line @typescript-eslint/no-floating-promises
(async () => {
```

Consider wrapping with `void` instead: `void (async () => { ... })();`

---

## Edge Cases Found by Scout

1. **Concurrent edit + delete**: If user A opens edit modal and user B deletes the worklog, user A's submit will fail with 404. The error toast will show generic "Failed to save" due to C1.

2. **Empty reason with whitespace**: Backend `.strip()` handles this correctly -- whitespace-only strings are rejected. Frontend `.trim()` also validates.

3. **Worklog grouping with exactly 3 entries**: Boundary condition at threshold=3 -- groups of exactly 3 stay ungrouped, 4+ get split as 3+group. Correct behavior.

4. **Activity store `computedFn` caching**: `getActivityAndCommentsByIssueId` uses `computedFn` which memoizes. If worklogs are added/deleted, does the cache invalidate? Since `worklogsByIssueId` is `observable` and `getWorklogsForIssue` reads it, MobX should track the dependency. Verified correct.

5. **`is_time_tracking_enabled !== false` guard**: Sidebar/peek-overview use `!== false` (not `=== true`), so `undefined`/`null` values pass. This is intentional -- projects without the field default to enabled.

---

## Positive Observations

1. **Clean separation of concerns**: Backend validation, frontend validation, and activity logging are properly layered
2. **Optimistic UI for delete**: Store removes immediately, rolls back on error -- good UX pattern
3. **De-duplicate in-flight deletes**: `deleteInFlight` Set prevents double-click issues
4. **i18n complete**: All 3 locales (EN/VI/KO) have the new keys
5. **CE pattern followed**: All new components in `ce/` directory, core files only modified for routing
6. **File sizes within limits**: All files under 200 lines, components under 150 lines
7. **Collapsible worklog groups**: Smart solution for activity feed scalability
8. **Proper permission checks**: ADMIN-only for edit/delete, edit-window enforcement on both frontend and backend

---

## Recommended Actions

1. **[CRITICAL] Fix `extractApiError()`** to handle pre-unwrapped error objects (C1)
2. **[HIGH] Update stale "7 working days" comments** to "60 working days" (H1)
3. **[HIGH] Evaluate whether bulk endpoint should also require reason** for audit consistency (H3)
4. **[MEDIUM] Add `worklog.activity.created` handler** to ACTIVITY_MAPPER for complete audit trail (M1)
5. **[LOW] Fix type assertion** in `groupConsecutiveWorklogs` (M5)

---

## Metrics

- **Type Coverage**: Good -- all new types properly defined in `@plane/types`
- **Test Coverage**: No new tests added for worklog reason validation (backend or frontend)
- **Linting Issues**: 0 new issues introduced (pre-existing issues in unrelated files)
- **File Size Compliance**: All files within limits

---

## Unresolved Questions

1. Should the bulk timesheet endpoint (`TimesheetBulkUpdateEndpoint`) require modification reasons for updates/deletes like the individual endpoints do?
2. Should a `worklog.activity.created` handler be added for create-audit parity with update/delete?
3. Is the migration `0151` safe to run on production (irreversible, enables time tracking for ALL projects)?
