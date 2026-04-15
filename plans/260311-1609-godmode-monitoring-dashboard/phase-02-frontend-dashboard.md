# Phase 2: Frontend Dashboard

## Context Links

- [Plan Overview](./plan.md)
- [Phase 1: Backend API](./phase-01-backend-api.md)
- [God Mode Patterns Research](./research/researcher-01-godmode-patterns.md)
- Routes: `apps/admin/app/routes.ts`
- Sidebar menu: `apps/admin/hooks/use-sidebar-menu/core.ts`
- Root store: `apps/admin/store/root.store.ts`
- Store hooks: `apps/admin/hooks/store/`
- Page wrapper: `apps/admin/components/common/page-wrapper.tsx`

## Overview

- **Priority:** P2
- **Status:** complete
- **Effort:** 3.5h
- **Description:** Monitoring page with 3 tabs (Issue Email Logs, Scheduled Jobs, Worker Health) in God Mode admin app.

## Key Insights

- Admin app uses `observer()` + `makeObservable()` (explicit) — no `makeAutoObservable`
- Data fetching via MobX actions + `runInAction()` — no SWR/React Query for new stores
- `PageWrapper` component provides consistent header layout
- Tab navigation: no existing tab component found in admin app; use simple button-based tabs with Tailwind
- "Issue Email Logs" tab only shows issue notification emails (EmailNotificationLog from email_notification_task.py), not all system emails
<!-- Updated: Validation Session 1 - Renamed Email Logs to Issue Email Logs, clarified scope -->
- `@plane/propel/*` for UI primitives, `lucide-react` for icons
- Semantic color tokens only (`text-primary`, `bg-surface-1`, `border-subtle`)

## ASCII Wireframes

### Main Monitoring Page with Tab Navigation

```
+------------------------------------------------------------------+
| Sidebar  |  Header                                                |
|          |--------------------------------------------------------|
|          |  Monitoring                                            |
| General  |  Monitor email delivery, scheduled tasks, and workers  |
| Email    |                                                        |
| Wkspaces |  [Issue Email Logs]  [Scheduled Jobs]  [Worker Health]       |
| Users    |--------------------------------------------------------|
| Auth     |                                                        |
| AI       |  <--- Tab content rendered here --->                   |
| Image    |                                                        |
|>Monitor< |                                                        |
+------------------------------------------------------------------+
```

### Tab 1: Issue Email Logs (Table with Pagination)

```
+------------------------------------------------------------------+
| Filters:  [Date From ____] [Date To ____] [Entity ____] [Apply]  |
|------------------------------------------------------------------|
| Receiver       | Triggered By  | Entity   | Created    | Status   |
|----------------|---------------|----------|------------|----------|
| user@mail.com  | admin@co.com  | issue    | 2026-03-11 | Sent     |
| dev@mail.com   | bot@co.com    | page     | 2026-03-10 | Pending  |
| qa@mail.com    | admin@co.com  | issue    | 2026-03-10 | Sent     |
| ...            | ...           | ...      | ...        | ...      |
|------------------------------------------------------------------|
| < Prev                                   Page 1 of 5      Next > |
+------------------------------------------------------------------+

Status logic:
  - sent_at exists    -> "Sent"    (green badge)
  - processed_at only -> "Processed" (yellow badge)
  - neither           -> "Pending" (gray badge)
```

### Tab 2: Scheduled Jobs (Table with Status)

```
+------------------------------------------------------------------+
| Name                          | Task Path         | Schedule      |
|-------------------------------|-------------------|---------------|
| send-email-notifications      | plane.bgtasks...  | */5 * * * *   |
| instance-trace                | plane.license...  | 0 */6 * * *   |
| hard-delete                   | plane.bgtasks...  | 0 0 * * *     |
| delete-exporter-history       | plane.bgtasks...  | 30 1 * * *    |
|-------------------------------|-------------------|---------------|
| Enabled | Last Run            | Run Count                         |
|---------|---------------------|-----------------------------------|
|   Yes   | 2026-03-11 10:05    | 1,423                             |
|   Yes   | 2026-03-11 06:00    | 856                               |
|   Yes   | 2026-03-11 00:00    | 312                               |
|   Yes   | 2026-03-11 01:30    | 311                               |
+------------------------------------------------------------------+

Enabled column: green/red dot indicator (read-only display)
```

### Tab 3: Worker Health (Cards)

```
+------------------------------------------------------------------+
|  Summary:  Workers: 2  |  Active Tasks: 3  |  Last Check: 10:32  |
|------------------------------------------------------------------|
|                                                                   |
|  +---------------------------+  +---------------------------+     |
|  | celery@worker-1           |  | celery@worker-2           |     |
|  |                           |  |                           |     |
|  | Active Tasks: 2           |  | Active Tasks: 1           |     |
|  | Pool: prefork (4 procs)   |  | Pool: prefork (4 procs)   |     |
|  | Uptime: 3d 14h            |  | Uptime: 1d 2h             |     |
|  +---------------------------+  +---------------------------+     |
|                                                                   |
|  Auto-refresh: every 30s                      [Refresh Now]       |
+------------------------------------------------------------------+

Error state (no workers):
+------------------------------------------------------------------+
|  +------------------------------------------------------------+  |
|  |  (!) Could not reach Celery workers                        |  |
|  |  Workers may be offline or not responding.                 |  |
|  |                                        [Retry]             |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
```

## Component Tree

```
monitoring/
  page.tsx                         <- Main page, tab state, observer()
  components/
    monitoring-tabs.tsx            <- Tab navigation bar
    email-logs-tab.tsx             <- Email logs table + filters + pagination
    scheduled-jobs-tab.tsx         <- Scheduled jobs table
    worker-health-tab.tsx          <- Worker health cards + auto-refresh
```

## Store / Service Architecture

### Service: `packages/services/src/instance/monitoring.service.ts`

```typescript
class MonitoringService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchEmailLogs(params): Promise<TEmailLogPaginatedResponse>;
  async fetchScheduledJobs(): Promise<TScheduledJob[]>;
  async fetchWorkerHealth(): Promise<TWorkerHealthResponse>;
}
```

### Store: `apps/admin/store/monitoring.store.ts`

```typescript
interface IMonitoringStore {
  // observables
  activeTab: TMonitoringTab; // observable.ref
  emailLogs: TEmailLog[]; // observable
  emailLogsPagination: TPaginationInfo | null; // observable
  emailLogsFilters: TEmailLogFilters; // observable
  scheduledJobs: TScheduledJob[]; // observable
  workerHealth: TWorkerHealthResponse | null; // observable
  isLoading: Record<string, boolean>; // observable
  error: Record<string, string | null>; // observable

  // actions
  setActiveTab: action;
  fetchEmailLogs: action;
  fetchScheduledJobs: action;
  fetchWorkerHealth: action;
  setEmailLogsFilters: action;
}
```

### Types: `apps/admin/store/monitoring.types.ts`

```typescript
type TMonitoringTab = "issue-email-logs" | "scheduled-jobs" | "worker-health";

type TEmailLog = {
  id: string;
  receiver_email: string;
  triggered_by_email: string;
  entity_name: string;
  entity: string;
  created_at: string;
  processed_at: string | null;
  sent_at: string | null;
};

type TScheduledJob = {
  id: number;
  name: string;
  task: string;
  schedule_display: string;
  enabled: boolean;
  last_run_at: string | null;
  total_run_count: number;
};

type TWorkerHealthResponse = {
  workers: TWorkerInfo[];
  summary: { total_workers: number; total_active_tasks: number };
  error?: string;
};

type TWorkerInfo = {
  name: string;
  active_tasks: number;
  uptime: string | null;
  pool_info: string | null;
};

type TEmailLogFilters = {
  date_from?: string;
  date_to?: string;
  entity_name?: string;
};
```

## Requirements

### Functional

- Tab navigation between Issue Email Logs, Scheduled Jobs, Worker Health
- Issue Email Logs: table with pagination, date range + entity_name filters
- Scheduled Jobs: table showing all periodic tasks with status
- Worker Health: summary cards + per-worker cards, auto-refresh 30s
- Loading states for each tab independently

### Non-Functional

- Components <150 lines each
- `observer()` wrapper on all components reading MobX state
- Semantic color tokens only
- No new package dependencies

## Related Code Files

### Files to Create

| File                                                                            | Purpose          | Est. Lines |
| ------------------------------------------------------------------------------- | ---------------- | ---------- |
| `apps/admin/store/monitoring.store.ts`                                          | MobX store       | ~120       |
| `apps/admin/store/monitoring.types.ts`                                          | TypeScript types | ~50        |
| `apps/admin/hooks/store/use-monitoring.tsx`                                     | Store hook       | ~10        |
| `packages/services/src/instance/monitoring.service.ts`                          | API service      | ~50        |
| `apps/admin/app/(all)/(dashboard)/monitoring/page.tsx`                          | Page + tabs      | ~60        |
| `apps/admin/app/(all)/(dashboard)/monitoring/components/monitoring-tabs.tsx`    | Tab bar          | ~40        |
| `apps/admin/app/(all)/(dashboard)/monitoring/components/email-logs-tab.tsx`     | Email logs table | ~140       |
| `apps/admin/app/(all)/(dashboard)/monitoring/components/scheduled-jobs-tab.tsx` | Jobs table       | ~100       |
| `apps/admin/app/(all)/(dashboard)/monitoring/components/worker-health-tab.tsx`  | Health cards     | ~120       |

### Files to Modify

| File                                        | Change                         |
| ------------------------------------------- | ------------------------------ |
| `apps/admin/app/routes.ts`                  | Add `route("monitoring", ...)` |
| `apps/admin/hooks/use-sidebar-menu/core.ts` | Add "monitoring" to menu       |
| `apps/admin/store/root.store.ts`            | Register `MonitoringStore`     |
| `apps/admin/hooks/store/index.ts`           | Export `useMonitoring`         |
| `packages/services/src/instance/index.ts`   | Export `MonitoringService`     |

## Implementation Steps

### Step 1: Create types (`monitoring.types.ts`)

Define all TypeScript types for email logs, scheduled jobs, worker health, pagination, and filters. Keep as simple interfaces — no classes.

### Step 2: Create service (`monitoring.service.ts`)

```typescript
import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

export class MonitoringService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async fetchEmailLogs(params?: Record<string, string>) {
    return this.get("/api/instances/monitoring/email-logs/", { params })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchScheduledJobs() {
    return this.get("/api/instances/monitoring/scheduled-jobs/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async fetchWorkerHealth() {
    return this.get("/api/instances/monitoring/worker-health/")
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}
```

Update `packages/services/src/instance/index.ts` to export it.

### Step 3: Create store (`monitoring.store.ts`)

- Use `makeObservable()` with explicit field bindings
- `runInAction()` for all async state updates
- Instantiate `MonitoringService` in constructor
- `fetchEmailLogs` builds query params from `emailLogsFilters` + cursor

### Step 4: Register store in root

Add to `root.store.ts`:

```typescript
import { MonitoringStore } from "./monitoring.store";
monitoring: IMonitoringStore;
this.monitoring = new MonitoringStore(this);
```

### Step 5: Create store hook (`use-monitoring.tsx`)

```typescript
export const useMonitoring = (): IMonitoringStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("...");
  return context.monitoring;
};
```

Export from `hooks/store/index.ts`.

### Step 6: Add route

In `routes.ts`, add inside dashboard layout array:

```typescript
route("monitoring", "./(all)/(dashboard)/monitoring/page.tsx"),
```

### Step 7: Add sidebar menu item

In `core.ts`:

- Add `"monitoring"` to `TCoreSidebarMenuKey` union
- Add entry with `Activity` icon from lucide-react:

```typescript
monitoring: {
  Icon: Activity,
  name: "Monitoring",
  description: "System health and email metrics.",
  href: "/monitoring/",
},
```

### Step 8: Create page component (`page.tsx`)

- `useMonitoring()` to get store
- `useState` for active tab (or use store's `activeTab`)
- Render `PageWrapper` with title "Monitoring"
- Render `MonitoringTabs` + conditional tab content
- `export const meta` for page title

### Step 9: Create tab components

**monitoring-tabs.tsx**: Button row with 3 tabs, active state styling via `cn()`.

**email-logs-tab.tsx**:

- `useEffect` to fetch on mount and when filters/cursor change
- Filter row: date inputs + entity select + apply button
- Table with columns: Receiver, Triggered By, Entity, Created, Status
- Status badge: green (Sent), yellow (Processed), gray (Pending)
- Pagination: Prev/Next buttons using cursor from API response

**scheduled-jobs-tab.tsx**:

- `useEffect` to fetch on mount
- Table: Name, Task, Schedule, Enabled (dot indicator), Last Run, Run Count

**worker-health-tab.tsx**:

- `useEffect` to fetch on mount + `setInterval(fetchWorkerHealth, 30000)`
- Cleanup interval on unmount
- Summary bar: total workers, total active tasks
- Card grid for each worker
- Error state when no workers reachable
- Manual "Refresh Now" button

## Todo List

- [ ] Create `monitoring.types.ts`
- [ ] Create `monitoring.service.ts` + update index export
- [ ] Create `monitoring.store.ts`
- [ ] Register store in `root.store.ts`
- [ ] Create `use-monitoring.tsx` hook + update index export
- [ ] Add route to `routes.ts`
- [ ] Add sidebar menu item to `core.ts`
- [ ] Create `monitoring/page.tsx`
- [ ] Create `monitoring/components/monitoring-tabs.tsx`
- [ ] Create `monitoring/components/email-logs-tab.tsx`
- [ ] Create `monitoring/components/scheduled-jobs-tab.tsx`
- [ ] Create `monitoring/components/worker-health-tab.tsx`
- [ ] Verify all components use `observer()` wrapper
- [ ] Test tab navigation renders correct content
- [ ] Test email logs pagination + filter apply
- [ ] Test worker health auto-refresh (30s interval)

## Success Criteria

- Monitoring appears in sidebar, navigates to `/monitoring/`
- 3 tabs switch correctly, each fetching data independently
- Email logs table shows paginated results with working filters
- Scheduled jobs table lists all PeriodicTask records
- Worker health cards auto-refresh every 30s
- Graceful error display when workers unreachable
- All components wrapped in `observer()`
- No hardcoded colors — semantic tokens only

## Risk Assessment

| Risk                                        | Likelihood | Mitigation                                    |
| ------------------------------------------- | ---------- | --------------------------------------------- |
| Tab component doesn't match admin app style | Medium     | Follow existing button/link patterns in admin |
| Auto-refresh causes stale closure bugs      | Medium     | Use `useCallback` or store action ref         |
| Large email logs table performance          | Low        | Pagination limits to 50 rows                  |
| Store not cleaned up on nav away            | Low        | Interval cleared in useEffect cleanup         |

## Security Considerations

- All data fetched via admin-only API endpoints (InstanceAdminPermission)
- Email addresses visible to instance admins — expected behavior
- No mutations from frontend in Phase 1 (read-only)
- No sensitive tokens or credentials exposed in responses

## Next Steps

- Phase 2+ (future): Enable/disable scheduled jobs toggle (PATCH endpoint)
- Phase 2+ (future): Email log detail view with full data payload
- Phase 2+ (future): Task execution history / failure tracking
