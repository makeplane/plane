# Time-Tracking Feature Exploration Report

**Date**: March 27, 2026  
**Codebase**: Plane Monorepo (CE Edition)  
**Scope**: Comprehensive analysis of time-tracking components, stores, services, and API endpoints

---

## 1. FRONTEND FILES FOUND

### Components (apps/web/ce/components/time-tracking/)

#### Timesheet Components (9 files, 638 lines total)

```
apps/web/ce/components/time-tracking/timesheet/
├── timesheet-grid.tsx                 (131 lines) - Main timesheet view
├── timesheet-table.tsx                (157 lines) - TanStack React Table grid
├── timesheet-cell.tsx                 (91 lines)  - Editable time input cell
├── timesheet-week-navigator.tsx       (101 lines) - Week navigation controls
├── timesheet-add-issue-modal.tsx      (162 lines) - Issue search & selection
└── index.ts                           (7 lines)
```

#### Capacity Components (4 files, 238 lines total)

```
apps/web/ce/components/time-tracking/capacity/
├── capacity-dashboard.tsx             (187 lines) - Main capacity dashboard
├── capacity-heatmap.tsx               (152 lines) - Member/day heatmap
├── capacity-summary-cards.tsx         (85 lines)  - KPI summary cards
└── index.ts                           (1 line)
```

### Store Layer (apps/web/ce/store/)

```
apps/web/core/store/worklog.store.ts   (260 lines) - Core worklog store (shared)
  - Implements: IWorklogStore interface
  - Methods: fetchWorklogs, createWorklog, updateWorklog, deleteWorklog,
            fetchTimesheetGrid, bulkUpdateTimesheet, addEmptyTimesheetRow,
            fetchCapacityReport, fetchProjectSummary
  - Observables: worklogsByIssueId, isLoading, timesheetData, capacityData, etc.

apps/web/ce/store/project/worklog.store.ts (137 lines) - Project worklog pagination store
  - Implements: ProjectWorklogStore
  - Methods: fetchWorklogs, fetchPage, triggerExport
  - Pagination: cursor-based with 25 items per page
  - Uses: CEProjectWorklogService
```

### Services (apps/web/ce/services/)

```
apps/web/core/services/worklog.service.ts (172 lines)
  - Methods:
    * listWorklogs(workspaceSlug, projectId, issueId)
    * createWorklog(workspaceSlug, projectId, issueId, data)
    * updateWorklog(workspaceSlug, projectId, issueId, worklogId, data)
    * deleteWorklog(workspaceSlug, projectId, issueId, worklogId, reason)
    * getProjectSummary(workspaceSlug, projectId, params)
    * getWorkspaceSummary(workspaceSlug, params)
    * getTimesheetGrid(workspaceSlug, projectId, params)
    * bulkUpdateTimesheet(workspaceSlug, projectId, data)
    * getCapacityReport(workspaceSlug, projectId, params)

apps/web/ce/services/project-worklog.service.ts (61 lines) - CE-specific project worklog
  - Methods:
    * getProjectWorklogs(workspaceSlug, projectId, cursor, params)
    * triggerExport(workspaceSlug, projectId, provider, filters)
    * getExportHistory(workspaceSlug, projectId, cursor)

apps/web/ce/services/user-worklog.service.ts (30 lines) - CE-specific user daily total
  - Methods:
    * getUserDailyTotal() - Cross-workspace daily total (passes timezone)
```

### Hooks (apps/web/ce/hooks/)

```
apps/web/ce/hooks/store/use-project-worklog.ts (13 lines)
  - Hook: useProjectWorklogs() → ProjectWorklogStore
```

---

## 2. BACKEND FILES FOUND

### Models (apps/api/plane/db/models/)

```
apps/api/plane/db/models/worklog.py (39 lines)
  - Model: IssueWorkLog
  - Fields:
    * issue (FK → Issue)
    * logged_by (FK → User)
    * duration_minutes (PositiveIntegerField)
    * description (TextField, optional)
    * logged_at (DateField)
  - Indexes: [issue, logged_by], [project, logged_at]
  - Meta: ordering by (-logged_at, -created_at)
```

### Views (apps/api/plane/app/views/)

#### Issue-Level Worklog

```
apps/api/plane/app/views/issue/worklog.py
  - ViewSet: IssueWorkLogViewSet
  - Methods: list, create, retrieve, update, destroy
  - URL: workspaces/<slug>/projects/<project_id>/issues/<issue_id>/worklogs/
```

#### Project-Level Summary

```
apps/api/plane/app/views/workspace/time_tracking/summary.py (124 lines)
  - Class: ProjectWorkLogSummaryEndpoint
    * GET: /api/workspaces/<slug>/projects/<project_id>/worklogs/summary/
    * Aggregates by member and issue
    * Query params: date_from, date_to
    * Returns: { total_duration_minutes, by_member[], by_issue[] }

  - Class: WorkspaceWorkLogSummaryEndpoint
    * GET: /api/workspaces/<slug>/time-tracking/summary/
    * Cross-project workspace summary ★ WORKSPACE-LEVEL
    * Query params: project_id (optional), member_id (optional), date_from, date_to
    * Returns: { total_duration_minutes, by_member[], by_issue[] }
```

#### Timesheet Grid

```
apps/api/plane/app/views/workspace/time_tracking/timesheet_grid.py (122 lines)
  - Class: TimesheetGridEndpoint
  - GET: /api/workspaces/<slug>/projects/<project_id>/time-tracking/timesheet/
  - Query params: week_start (YYYY-MM-DD, optional, defaults to current Monday)
  - Returns: {
      week_start, week_end,
      rows: [{ issue_id, issue_name, issue_identifier, days, total_minutes }],
      daily_totals: { "YYYY-MM-DD": minutes },
      grand_total_minutes
    }
  - Filters to current user's assigned issues
```

#### Timesheet Bulk Update

```
apps/api/plane/app/views/workspace/time_tracking/timesheet_bulk.py (195 lines)
  - Class: TimesheetBulkUpdateEndpoint
  - POST: /api/workspaces/<slug>/projects/<project_id>/time-tracking/timesheet/bulk/
  - Payload: { entries: [{ issue_id, logged_at, duration_minutes }] }
  - Features:
    * Upsert: create, update, or delete worklogs
    * Daily limit check: MAX_DAILY_MINUTES = 720 (12h)
    * Edit window: 60 working days (locked worklogs can't be edited)
    * Activity tracking: fires issue_activity.delay() for create/update/delete
  - Returns: { results: [{ issue_id, logged_at, action }] }
```

#### Capacity Report

```
apps/api/plane/app/views/capacity.py (127 lines)
  - Class: ProjectCapacityEndpoint
  - GET: /api/workspaces/<slug>/projects/<project_id>/time-tracking/capacity/
  - Permissions: ROLE.ADMIN (project level)
  - Query params: date_from, date_to (optional, defaults to current week),
                  member_id (comma-separated, optional)
  - Returns: {
      date_from, date_to,
      members: [{ member_id, display_name, avatar_url, total_logged_minutes, days }],
      project_total_logged,
      project_daily_totals: { "YYYY-MM-DD": { minutes, issue_count } }
    }
  - Includes: daily member/project aggregates for heatmap
```

#### Project Worklog List

```
apps/api/plane/app/views/project/worklog.py
  - ViewSet: ProjectWorkLogViewSet
  - Methods: list, retrieve
  - URL: workspaces/<slug>/projects/<project_id>/worklogs/
  - Supports: pagination, filtering, export
```

#### User Daily Total

```
apps/api/plane/app/views/user/daily_worklog.py
  - Endpoint: User daily logged time (cross-workspace)
  - URL: /api/users/me/daily-worklog-total/
  - Query params: tz (timezone, required for backend to compute "today")
  - Returns: { total_minutes, date }
```

---

## 3. API ENDPOINTS SUMMARY

### Issue-Level (per issue)

| Method | URL                                                             | Purpose             |
| ------ | --------------------------------------------------------------- | ------------------- |
| GET    | `workspaces/<slug>/projects/<pid>/issues/<iid>/worklogs/`       | List issue worklogs |
| POST   | `workspaces/<slug>/projects/<pid>/issues/<iid>/worklogs/`       | Create worklog      |
| PATCH  | `workspaces/<slug>/projects/<pid>/issues/<iid>/worklogs/<wid>/` | Update worklog      |
| DELETE | `workspaces/<slug>/projects/<pid>/issues/<iid>/worklogs/<wid>/` | Delete worklog      |

### Project-Level

| Method | URL                                                              | Purpose                           |
| ------ | ---------------------------------------------------------------- | --------------------------------- |
| GET    | `workspaces/<slug>/projects/<pid>/worklogs/`                     | List project worklogs (paginated) |
| GET    | `workspaces/<slug>/projects/<pid>/worklogs/summary/`             | Project summary (by member/issue) |
| POST   | `workspaces/<slug>/projects/<pid>/worklogs/export/`              | Trigger export (CSV/XLSX)         |
| GET    | `workspaces/<slug>/projects/<pid>/worklogs/export/`              | Export history                    |
| GET    | `workspaces/<slug>/projects/<pid>/time-tracking/timesheet/`      | Timesheet grid (current user)     |
| POST   | `workspaces/<slug>/projects/<pid>/time-tracking/timesheet/bulk/` | Bulk update timesheet             |
| GET    | `workspaces/<slug>/projects/<pid>/time-tracking/capacity/`       | Capacity report (admins only)     |

### Workspace-Level ★ CROSS-WORKSPACE

| Method | URL                                        | Purpose                          |
| ------ | ------------------------------------------ | -------------------------------- |
| GET    | `workspaces/<slug>/time-tracking/summary/` | Workspace summary (all projects) |

### User-Level

| Method | URL                             | Purpose                                       |
| ------ | ------------------------------- | --------------------------------------------- |
| GET    | `users/me/daily-worklog-total/` | Daily total (cross-workspace, timezone-aware) |

---

## 4. DATA STRUCTURES & INTERFACES

### Core Types (`packages/types/src/worklog.ts`)

```typescript
// Individual worklog entry
interface IWorkLog {
  id: string;
  issue: string;
  logged_by: string;
  duration_minutes: number;
  description: string;
  logged_at: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  logged_by_detail?: { id; display_name; avatar_url };
  issue_detail?: { id; name; sequence_id; identifier };
  project_detail?: { id; name; identifier };
}

// Create/update payloads
interface IWorkLogCreate {
  duration_minutes: number;
  description?: string;
  logged_at: string;
}

interface IWorkLogUpdate {
  duration_minutes?: number;
  description?: string;
  logged_at?: string;
  reason?: string;
}

// Summary aggregation (by member/issue)
interface IWorkLogSummary {
  total_duration_minutes: number;
  by_member: Array<{
    member_id: string;
    display_name: string;
    total_minutes: number;
  }>;
  by_issue: Array<{
    issue_id: string;
    issue_name: string;
    total_minutes: number;
  }>;
}

// Timesheet grid (weekly view)
interface ITimesheetRow {
  issue_id: string;
  issue_name: string;
  issue_identifier: string;
  project_id: string;
  days: Record<string, number>; // "YYYY-MM-DD" → minutes
  total_minutes: number;
}

interface ITimesheetGridResponse {
  week_start: string;
  week_end: string;
  rows: ITimesheetRow[];
  daily_totals: Record<string, number>;
  grand_total_minutes: number;
}

// Bulk update payload
interface ITimesheetBulkEntry {
  issue_id: string;
  logged_at: string;
  duration_minutes: number;
}

interface ITimesheetBulkPayload {
  entries: ITimesheetBulkEntry[];
}

// Capacity report (by member)
interface ICapacityMember {
  member_id: string;
  display_name: string;
  avatar_url: string;
  total_logged_minutes: number;
  days?: Record<string, number>;
}

interface ICapacityReportResponse {
  date_from: string;
  date_to: string;
  members: ICapacityMember[];
  project_total_logged: number;
  project_daily_totals?: Record<string, { minutes; issue_count }>;
}

// Daily total (cross-workspace)
interface IUserDailyWorklogTotal {
  total_minutes: number;
  date: string;
}
```

---

## 5. COMPONENT STRUCTURE

### Timesheet Grid Component

```
TimesheetGrid (main view, observer)
├── TimesheetWeekNavigator (navigation + "This Week" button)
├── Button "Add Issue" → TimesheetAddIssueModal
└── TimesheetTable (TanStack React Table)
    ├── Issue identifier column (mono text + name)
    ├── 7 day columns (Mon–Sun)
    │   └── TimesheetCell (editable input, formats "2h 30m")
    └── Total column (per issue)
    └── Footer row (daily totals + grand total)

TimesheetCell
├── Input format parsing: "2h 30m" → 150 minutes
├── Display formatting: 150 → "2h 30m"
├── Blur handler: saves on blur or Enter key
└── Escape key: reverts to previous value
```

### Capacity Dashboard Component

```
CapacityDashboard (main view, observer)
├── Header (title + description)
├── Summary cards (KPI: total logged)
├── Filters bar (sticky)
│   ├── Member dropdown (multi-select)
│   └── Date range picker
├── Export button (CSV)
└── CapacityHeatmap (visual member × day grid)
    └── Heatmap cells: color by logged minutes
```

---

## 6. STORE & SERVICE ARCHITECTURE

### Frontend Store Hierarchy

```
CoreRootStore (core/store/root.store.ts)
└── RootStore (ce/store/root.store.ts) — extends
    ├── worklog: IWorklogStore (core store)
    │   └── Uses WorklogService for API calls
    └── projectWorklog: ProjectWorklogStore (CE store)
        └── Uses CEProjectWorklogService for paginated project worklogs
```

### Service Layer

- **WorklogService** (core): All main CRUD + summary/timesheet/capacity
- **CEProjectWorklogService** (CE): Project worklog pagination + export
- **UserWorklogService** (CE): Cross-workspace daily total

### Key Features

- **Cursor-based pagination**: ProjectWorklogStore uses next/prev cursors
- **Timezone-aware daily total**: UserWorklogService passes `tz` query param
- **Optimistic updates**: TimesheetCell saves immediately, refetches on blur
- **Edit window**: Bulk API enforces 60-working-day lockout (can't edit old entries)
- **Daily limit**: 720 minutes (12 hours) per day checked during bulk update

---

## 7. CROSS-WORKSPACE QUERIES

### Found 1 Workspace-Level Endpoint:

**WorkspaceWorkLogSummaryEndpoint**

- **URL**: `GET /api/workspaces/<slug>/time-tracking/summary/`
- **Auth**: ROLE.ADMIN/MEMBER at workspace level
- **Query params**: `project_id` (optional), `member_id` (optional), `date_from`, `date_to`
- **Purpose**: Aggregate worklog data across all projects in a workspace
- **Response**: `{ total_duration_minutes, by_member[], by_issue[] }`
- **Implementation**: filters on `workspace__slug` only (no project_id required)

### Found 1 User Cross-Workspace Endpoint:

**UserDailyWorklogTotal**

- **URL**: `GET /api/users/me/daily-worklog-total/?tz=<timezone>`
- **Purpose**: Current user's total logged time for "today" across all workspaces
- **Timezone handling**: Frontend passes `Intl.DateTimeFormat().resolvedOptions().timeZone`
- **Response**: `{ total_minutes, date }`

---

## 8. KEY OBSERVATIONS

### Architecture Patterns

1. **Frontend**: Core store (`worklog.store.ts`) handles all worklog data + timesheet/capacity, CE store handles project-level pagination
2. **Backend**: Separated into views by scope (issue, project, workspace, user)
3. **Permissions**: Project-capacity requires ADMIN; timesheet/summary require ADMIN/MEMBER
4. **API consistency**: Cursor-based pagination for project worklogs, but simple filters for summaries

### Time Formatting

- Backend: stores minutes as `PositiveIntegerField`
- Frontend: displays as "2h 30m" format
- Cell input: parses "2h 30m" or bare number (minutes)

### Activity Tracking

- Bulk update fires `issue_activity.delay()` with type: `worklog.activity.created/updated/deleted`
- Includes: current_instance (before), requested_data (changes), actor_id, epoch, origin

### Edit Window / Data Retention

- Worklogs older than 60 working days are read-only (checked in bulk update endpoint)
- Function: `get_min_allowed_date(working_days=60, tz_str=project.timezone)`

### Daily Limit Enforcement

- MAX_DAILY_MINUTES = 720 (12 hours)
- Checked during bulk update, accounting for entries being replaced
- Returns: `{ error: "Daily time limit exceeded. You have X minutes remaining." }`

---

## 9. UNRESOLVED QUESTIONS

1. **Is there a workspace admin summary view?** The WorkspaceWorkLogSummaryEndpoint exists, but no frontend page found yet.
2. **What's the export format?** Bulk API mentions CSV/XLSX export, but no details on format/columns.
3. **How are project timezones used?** Capacity/bulk endpoints reference `project.timezone`, but unclear if user's local tz overrides it.
4. **Are there read API endpoints for historical capacity data?** Found capacity endpoint but no historical trending.
5. **Is time-tracking feature flag controlled?** `project.is_time_tracking_enabled` checked in bulk endpoint—where is this configured?

---

## 10. FILE MANIFEST (Complete)

### Frontend (apps/web/)

- `ce/components/time-tracking/timesheet/timesheet-grid.tsx` (131L)
- `ce/components/time-tracking/timesheet/timesheet-table.tsx` (157L)
- `ce/components/time-tracking/timesheet/timesheet-cell.tsx` (91L)
- `ce/components/time-tracking/timesheet/timesheet-week-navigator.tsx` (101L)
- `ce/components/time-tracking/timesheet/timesheet-add-issue-modal.tsx` (162L)
- `ce/components/time-tracking/timesheet/index.ts` (7L)
- `ce/components/time-tracking/capacity/capacity-dashboard.tsx` (187L)
- `ce/components/time-tracking/capacity/capacity-heatmap.tsx` (152L)
- `ce/components/time-tracking/capacity/capacity-summary-cards.tsx` (85L)
- `ce/components/time-tracking/capacity/index.ts` (1L)
- `core/store/worklog.store.ts` (260L)
- `ce/store/project/worklog.store.ts` (137L)
- `core/services/worklog.service.ts` (172L)
- `ce/services/project-worklog.service.ts` (61L)
- `ce/services/user-worklog.service.ts` (30L)
- `ce/hooks/store/use-project-worklog.ts` (13L)
- `ce/types/worklog-export.ts` (custom export types)

### Backend (apps/api/plane/)

- `db/models/worklog.py` (39L)
- `app/views/issue/worklog.py` (CRUD views)
- `app/views/project/worklog.py` (project-level list/retrieve)
- `app/views/workspace/time_tracking/summary.py` (124L) — ProjectWorkLogSummaryEndpoint + **WorkspaceWorkLogSummaryEndpoint**
- `app/views/workspace/time_tracking/timesheet_grid.py` (122L)
- `app/views/workspace/time_tracking/timesheet_bulk.py` (195L)
- `app/views/capacity.py` (127L)
- `app/views/user/daily_worklog.py` (cross-workspace daily total)
- `app/urls/issue.py` (worklog routes)
- `app/urls/project.py` (worklog routes)
- `app/urls/workspace.py` (workspace summary route)
- `app/urls/user.py` (daily total route)

### Types (packages/types/)

- `src/worklog.ts` (108L) — All type definitions

---

**Report Status**: Complete exploration of time-tracking feature  
**Next Steps**: Ready for implementation planning or architecture review
