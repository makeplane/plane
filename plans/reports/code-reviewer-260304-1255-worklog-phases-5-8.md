# Code Review: Worklog Phases 5–8

**Date:** 2026-03-04
**Scope:** Backend validation, views, bulk endpoint, frontend date utils/modal/activity, Celery reminder, notification model, types, i18n

---

## Overall Assessment

Implementation is largely correct and follows project patterns. Business rules are enforced at the backend. Several medium and high priority issues need addressing before merge.

---

## Critical Issues

None.

---

## High Priority

### 1. `partial_update` / `destroy` — unhandled `IssueWorkLog.DoesNotExist`

**File:** `apps/api/plane/app/views/issue/worklog.py` L121, L166

Both `partial_update` and `destroy` call `IssueWorkLog.objects.get(...)` without try/except. A non-existent or cross-project `pk` raises a 500 instead of 404. Any user with ADMIN role in a project can trigger this with a crafted `pk`.

```python
# Current — crashes with 500
worklog = IssueWorkLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)

# Fix
try:
    worklog = IssueWorkLog.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
except IssueWorkLog.DoesNotExist:
    return Response({"error": "Worklog not found."}, status=status.HTTP_404_NOT_FOUND)
```

---

### 2. Bulk endpoint — daily limit check double-counts existing worklogs being updated

**File:** `apps/api/plane/app/views/workspace/time_tracking.py` L281–296

`date_totals` accumulates ALL entries from the payload. But for upsert (update case), the check adds the NEW duration on top of all existing worklogs — it doesn't subtract the old duration of the worklog being replaced. A user with 700min logged and sending a bulk update of 700min (replacing the same row) would be falsely rejected.

```python
# Bug: existing worklog duration not excluded when checking new total
existing_total = IssueWorkLog.objects.filter(
    logged_by=request.user, logged_at=log_date
).aggregate(total=Sum("duration_minutes"))["total"] or 0
# existing_total already includes the row about to be replaced
```

Fix: Before summing `date_totals`, separate entries by whether an existing worklog exists for that (user+issue+date), and exclude their old duration from `existing_total` per-date.

---

### 3. Frontend `todayDate()` uses UTC, backend uses server's `date.today()`

**File:** `apps/web/ce/components/issues/worklog/worklog-modal.tsx` L28

`new Date().toISOString()` returns UTC date. A user in UTC+7 after midnight (but before UTC midnight) would see yesterday's date as "today" in the picker `max`. This can cause the picker `max` to be one day behind actual local today.

```ts
// Current — UTC date
const todayDate = () => new Date().toISOString().split("T")[0];

// Fix — local date
const todayDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
```

Same issue applies to `getMinAllowedDate()` in `worklog-date-utils.ts` L12 — `new Date()` seeds from local time but `toISOString()` at L19 converts back to UTC, causing a potential 1-day offset.

---

## Medium Priority

### 4. `partial_update` / `destroy` — time tracking enabled NOT checked

**File:** `apps/api/plane/app/views/issue/worklog.py`

`create` checks `_check_time_tracking_enabled`, but `partial_update` and `destroy` skip this check. After an admin disables time tracking, existing worklogs remain editable/deletable. This is arguably acceptable (cleanup), but inconsistent behavior should be a deliberate decision, not an accident.

---

### 5. Reminder task — `member_workspace` dict truncates multi-workspace members

**File:** `apps/api/plane/bgtasks/worklog_reminder_task.py` L57–64

`dict(queryset.values_list("member_id", "workspace_id").distinct())` — if a user belongs to multiple workspaces, only ONE workspace_id is stored (whichever `.distinct()` returns last). The in-app notification is then created under a random workspace. Not a data-loss bug, but the reminder may appear under the wrong workspace in the notification feed.

---

### 6. Reminder task — no index on `Notification.data` for idempotency query

**File:** `apps/api/plane/db/models/notification.py` L40–65 / `apps/api/plane/bgtasks/worklog_reminder_task.py` L87–90

```python
Notification.objects.filter(entity_name="worklog_reminder", data__date=str(today))
```

`data` is a `JSONField`. There is no GIN index on `data` in `Notification.Meta.indexes`. At scale (many notifications), this does a full-table JSON scan. The existing index `notif_entity_name_idx` on `entity_name` helps narrow it, but `data__date` remains unindexed. Low risk for now but should be tracked.

---

### 7. Bulk endpoint — no 7-working-day edit window check on update/delete

**File:** `apps/api/plane/app/views/workspace/time_tracking.py` L313–362

The individual `partial_update`/`destroy` views check `_check_edit_window`, but `TimesheetBulkUpdateEndpoint` updates/deletes existing worklogs without checking the 7-working-day window. An admin could bypass the lock via the bulk endpoint.

```python
# Missing before existing.save() or existing.delete()
if existing.logged_at < get_min_allowed_date():
    return Response({"error": "Worklog is locked."}, status=status.HTTP_403_FORBIDDEN)
```

---

### 8. `TimesheetBulkEntrySerializer.duration_minutes` allows 0, but `IssueWorkLogSerializer` requires > 0

**File:** `apps/api/plane/app/serializers/worklog.py` L114

`min_value=0` intentionally allows 0 for deletion-by-zero semantics in the bulk endpoint. This is fine BUT it bypasses the `validate_duration_minutes` validator used in `IssueWorkLogSerializer`. The two serializers silently have different rules for the same field. This should be documented in a code comment to avoid future confusion.

---

### 9. Reminder email — connection not explicitly closed

**File:** `apps/api/plane/bgtasks/worklog_reminder_task.py` L139–163

`get_connection()` creates a raw connection that should be closed after use. The existing pattern in `project_invitation_task.py` has the same pattern, so this is consistent — but both share this issue. Django doesn't auto-close manually created connections. A connection leak on task failure is possible. Consider wrapping in a context manager or calling `connection.close()` in a `finally` block.

---

## Low Priority

### 10. Celery task comment — timezone assumption hardcoded in comment

**File:** `apps/api/plane/celery.py` L82

`# UTC 10:00 = 5PM Vietnam` — Vietnam is UTC+7, so UTC 10:00 = 17:00 Vietnam. Correct. But this is a fragile comment; if the team spans multiple timezones this will be confusing. Not a bug.

---

### 11. `worklog-date-utils.ts` — `isWithinEditWindow` string comparison fragile

**File:** `apps/web/ce/components/issues/worklog/utils/worklog-date-utils.ts` L27

```ts
return loggedAt >= minDate; // string comparison works for YYYY-MM-DD
```

String comparison is valid ONLY for ISO-format strings with consistent zero-padding. If `loggedAt` ever comes through non-zero-padded (e.g., from a legacy source), this silently breaks. A `Date` comparison would be safer, though current data from the API is always ISO-formatted.

---

### 12. i18n — `reminder_message` in `en/translations.ts` uses emoji

**File:** `packages/i18n/src/locales/en/translations.ts` L3061

The backend `REMINDER_BODY` constant does NOT have an emoji, but the i18n key `worklog.reminder_message` does (`👋`). These are two separate strings, which is intentional (one for email body, one for UI display). But they're out of sync in tone and content — could mislead future maintainers.

---

## Edge Cases Found During Review

- A user who logs time at 23:59 local time (e.g., UTC+7) may have `todayDate()` return yesterday in UTC — the picker `max` prevents them from selecting today. Backend would also reject "today" if server uses UTC and request comes in at the UTC date boundary. This timezone inconsistency could frustrate users logging near midnight.
- Weekend days: if today is Monday, `get_min_allowed_date(7)` counts back 7 working days (Mon-Fri), landing 9 calendar days ago. If today is Sunday (edge case — since reminder runs on working days via UTC 10:00 which may hit Saturday for some TZs), the "today" date used in reminder check is a weekend. Users never log on weekends but the system would still send a reminder.
- `_check_daily_limit` is called AFTER serializer validation in `create`. Race condition: two concurrent requests from the same user for the same date could both pass the limit check (read–then–write without a DB-level constraint or SELECT FOR UPDATE). At scale this is exploitable.

---

## Positive Observations

- Backend separation of validation concerns (serializer for field-level, view for aggregate/edit-window) is clean.
- `_check_daily_limit` with `exclude_pk` for update is correct.
- Idempotency via `already_reminded_ids` is a good pattern.
- `bulk_create(batch_size=200)` is appropriate.
- `MEMBER` cannot edit/delete — enforced at `@allow_permission` decorator level, correct.
- `TimesheetGridEndpoint` correctly uses `Issue.issue_objects` (excludes triage/archived/draft).
- `getMinAllowedDate` in TS mirrors the Python logic correctly (Mon=1, Fri=5 exclusion vs Mon=0, Fri=4 — both correct).

---

## Recommended Actions (Priority Order)

1. **Fix:** Add `try/except IssueWorkLog.DoesNotExist` in `partial_update` and `destroy` → return 404
2. **Fix:** Add 7-working-day edit window check in `TimesheetBulkUpdateEndpoint` for update/delete paths
3. **Fix:** Correct `todayDate()` and `getMinAllowedDate()` to use local date, not UTC
4. **Fix:** Fix bulk daily limit check to exclude old duration of existing worklogs being replaced
5. **Track:** Race condition in `_check_daily_limit` — add DB-level unique constraint or lock if this becomes an issue
6. **Improve:** Wrap email `get_connection()` in try/finally to ensure connection close
7. **Document:** Add comment to `TimesheetBulkEntrySerializer` explaining `min_value=0` intentional divergence from `IssueWorkLogSerializer`

---

## Unresolved Questions

1. Should `partial_update`/`destroy` block when time tracking is disabled, or allow cleanup? No spec found — needs product decision.
2. Should the daily reminder run on weekends (users in UTC-adjacent TZs may receive Saturday reminder at UTC 10:00)? No weekend guard in task.
3. Is the multi-workspace member notification-workspace ambiguity acceptable (always pick first workspace)?
