# Code Review: God Mode Monitoring Dashboard

## Scope

- **Files reviewed:** 19 (7 new, 12 modified)
- **LOC (new):** ~650
- **Focus:** Security, N+1 queries, MobX patterns, component limits, semantic tokens
- **Plan:** `plans/260311-1609-godmode-monitoring-dashboard/plan.md`

## Overall Assessment

Solid implementation. Clean separation of concerns, correct admin-only auth via `InstanceAdminPermission`, proper `select_related()` usage on email logs, well-structured MobX store. Several issues need attention before merge, mostly around data leak on sign-out, hardcoded colors, and a filter race condition.

---

## Critical Issues

### C1. MonitoringStore not reset on sign-out -- stale data persists across admin sessions

**File:** `/Volumes/Data/SHBVN/plane.so/apps/admin/store/root.store.ts` (line 49-56)

`resetOnSignOut()` resets all stores EXCEPT `monitoring`. If Admin A views monitoring data, signs out, and Admin B signs in on same browser, Admin B sees Admin A's cached email logs (which include user emails -- PII).

**Fix:**

```typescript
resetOnSignOut() {
  localStorage.setItem("theme", "system");
  this.instance = new InstanceStore(this);
  this.user = new UserStore(this);
  this.instanceUser = new InstanceUserStore(this);
  this.theme = new ThemeStore(this);
  this.workspace = new WorkspaceStore(this);
  this.monitoring = new MonitoringStore(this);  // ADD THIS
}
```

---

## High Priority

### H1. Hardcoded Tailwind colors violate semantic token requirement

**Files:**

- `email-logs-tab.tsx` lines 16-19: `text-green-600`, `bg-green-500/10`, `text-yellow-600`, `bg-yellow-500/10`
- `scheduled-jobs-tab.tsx` line 53: `bg-green-500`, `bg-red-500`
- `worker-health-tab.tsx` line 39: `text-yellow-500`

Codebase convention uses semantic tokens: `text-success-primary`, `bg-success-subtle`, `text-danger-primary`, `bg-danger-subtle`, `text-warning-primary`, `bg-warning-subtle`.

**Fix for StatusBadge (email-logs-tab.tsx):**

```tsx
if (sentAt)
  return <span className="text-success-primary bg-success-subtle px-2 py-0.5 rounded text-body-xs-medium">Sent</span>;
if (processedAt)
  return (
    <span className="text-warning-primary bg-warning-subtle px-2 py-0.5 rounded text-body-xs-medium">Processed</span>
  );
```

**Fix for enabled dot (scheduled-jobs-tab.tsx):**

```tsx
className={`inline-block h-2 w-2 rounded-full ${job.enabled ? "bg-success-strong" : "bg-danger-strong"}`}
```

### H2. Filter race condition -- `setEmailLogsFilters` and `fetchEmailLogs` called sequentially but `fetchEmailLogs` reads from `this.emailLogsFilters`

**File:** `email-logs-tab.tsx` lines 31-34 + `monitoring.store.ts` lines 65-74

In `handleApplyFilters`:

```typescript
setEmailLogsFilters(localFilters); // MobX action, synchronous
fetchEmailLogs(); // Reads this.emailLogsFilters
```

This works because `setEmailLogsFilters` is synchronous and MobX updates are immediate. However, the `fetchEmailLogs` action reads `this.emailLogsFilters` AFTER the store is updated, so it picks up the new values. **This is actually fine** -- MobX actions are synchronous. No race condition exists.

However, there's a subtler issue: `fetchEmailLogs` does NOT reset the cursor when filters change. If user is on page 3, changes filters, and clicks Apply, the old cursor may be used (only if pagination cursor was somehow passed). Current code does NOT pass cursor from Apply button so this is fine for now, but `fetchEmailLogs` should explicitly clear pagination state when called without a cursor.

### H3. MobX `observable` vs `observable.ref` inconsistency

**File:** `monitoring.store.ts` lines 48-56

Other admin stores (`instance.store.ts`, `user.store.ts`) use `observable.ref` for `isLoading` and `error` records. The monitoring store uses plain `observable`, creating deep proxies unnecessarily.

**Fix:**

```typescript
makeObservable(this, {
  emailLogs: observable, // OK -- array items need observation
  emailLogsPagination: observable, // OK
  emailLogsFilters: observable, // OK
  scheduledJobs: observable, // OK
  workerHealth: observable, // OK
  isLoading: observable.ref, // CHANGE: replaced entirely, not mutated
  error: observable.ref, // CHANGE: replaced entirely, not mutated
  // actions unchanged
});
```

### H4. Error states not shown in UI

**Files:** All 3 tab components

The store tracks `error.emailLogs`, `error.scheduledJobs`, `error.workerHealth` but NO component renders these errors. If the API returns an error, the user sees a loading spinner forever (no loading state) or empty data (no explanation).

**Fix:** Add error rendering in each tab. Example for `scheduled-jobs-tab.tsx`:

```tsx
const { scheduledJobs, isLoading, error, fetchScheduledJobs } = useMonitoring();
// ...
if (error.scheduledJobs) {
  return (
    <div className="text-danger-primary text-body-sm-regular py-8 text-center">
      {error.scheduledJobs}
      <button onClick={fetchScheduledJobs}>Retry</button>
    </div>
  );
}
```

---

## Medium Priority

### M1. `email-logs-tab.tsx` exceeds 150-line component limit (160 lines)

**File:** `email-logs-tab.tsx`

Extract `StatusBadge` into a separate file or move the filters section into a `EmailLogsFilters` sub-component.

### M2. No database index on `email_notification_logs.created_at`

**File:** `monitoring.py` view (line 23-24)

The `EmailLogMonitoringEndpoint` orders by `-created_at` and filters by `created_at__gte` / `created_at__lte`. The `created_at` field (from `TimeAuditModel`) has no `db_index=True`. With large email log tables, this will cause full table scans.

**Note:** This is an existing model issue, not introduced by this PR. But it directly impacts monitoring dashboard performance. Consider adding an index in a separate migration if email logs are expected to grow significantly.

### M3. `ScheduledJobMonitoringEndpoint` loops and builds dicts manually instead of using a serializer

**File:** `monitoring.py` lines 59-81

The endpoint iterates all `PeriodicTask` objects in Python and builds response dicts manually. This is fine for the small number of periodic tasks typically present, but inconsistent with the serializer pattern used for email logs. Not a blocker.

### M4. Worker health "uptime" uses Celery clock ticks -- misleading metric

**File:** `monitoring.py` lines 122-124

`clock` from Celery stats is a logical clock counter, not actual uptime. Displaying it as `"{clock} ticks"` is technically accurate but potentially misleading to admins. Consider either removing it or documenting in the UI that it's a logical clock.

---

## Low Priority

### L1. `useEffect` eslint-disable comments for missing dependencies

**Files:** `email-logs-tab.tsx` line 29, `scheduled-jobs-tab.tsx` line 17

Both have `// eslint-disable-line react-hooks/exhaustive-deps`. This is intentional (fetch only on mount), but the pattern could use `useRef` to track initial load instead. Not critical.

### L2. Worker health inspector makes TWO round-trips to workers

**File:** `monitoring.py` lines 97-99

```python
active = inspector.active() or {}
stats = inspector.stats() or {}
```

Each call sends a broadcast to all workers and waits for responses. Two sequential calls = 2x latency. The 30s cache mitigates this. Acceptable for Phase 1.

### L3. Hook file extension `.tsx` but contains no JSX

**File:** `use-monitoring.tsx`

Should be `.ts` since it only exports a hook with no JSX. Matches pattern of other hooks... let me verify. Other hooks in the codebase also use `.tsx` extension, so this is consistent. Ignore.

---

## Edge Cases Found by Scout

1. **Sign-out data leak (C1)** -- Monitoring store persists PII across sessions
2. **Large email log tables** -- No `created_at` index, will degrade on 100K+ rows
3. **Celery worker offline** -- Properly handled with 3s timeout and error response
4. **Empty states** -- All tabs handle zero-result cases with appropriate messages
5. **Date filter with invalid input** -- Django ORM catches `ValidationError`, `BaseAPIView.handle_exception` returns 400
6. **Concurrent filter + pagination** -- No actual race due to synchronous MobX, but cursor not reset on filter change (currently OK since Apply doesn't pass cursor)

---

## Positive Observations

- Admin-only auth: All 3 endpoints inherit `InstanceAdminPermission` from `BaseAPIView` -- correct
- `select_related("receiver", "triggered_by")` prevents N+1 queries on email logs
- Pagination with `default_per_page=50, max_per_page=100` -- reasonable limits
- Worker health cached 30s server-side + 30s client-side auto-refresh -- good balance
- Clean store interface with explicit `IMonitoringStore` type
- All components wrapped in `observer()` -- correct MobX pattern
- `makeObservable` (explicit) used, not `makeAutoObservable` -- follows codebase rule
- File sizes within limits (except email-logs-tab at 160 vs 150 limit)
- `runInAction` used correctly for async state updates

---

## Recommended Actions

| #   | Priority | Action                                                                    | Effort |
| --- | -------- | ------------------------------------------------------------------------- | ------ |
| 1   | Critical | Add `this.monitoring = new MonitoringStore(this)` to `resetOnSignOut()`   | 1 min  |
| 2   | High     | Replace hardcoded colors with semantic tokens                             | 10 min |
| 3   | High     | Use `observable.ref` for `isLoading` and `error`                          | 2 min  |
| 4   | High     | Add error state rendering in all 3 tab components                         | 15 min |
| 5   | Medium   | Extract sub-component from email-logs-tab to meet 150-line limit          | 10 min |
| 6   | Medium   | Consider `created_at` index for EmailNotificationLog (separate migration) | 5 min  |

---

## Metrics

- **Type Coverage:** Full -- all types defined in `monitoring.types.ts`, interfaces in store
- **Test Coverage:** Not assessed (no tests in scope)
- **Linting Issues:** 0 (confirmed by user)
- **Component size violations:** 1 (`email-logs-tab.tsx` at 160 > 150 limit)

---

## Unresolved Questions

1. Should the monitoring page be accessible without a feature flag gate, or is admin-only access sufficient?
2. The plan mentions "Issue Email Logs" tab -- is the current scope intentionally limited to `EmailNotificationLog` only, or should other email types (invitations, magic link, etc.) be tracked in a future phase?
3. Should there be rate limiting on the monitoring endpoints beyond the existing admin session auth?
