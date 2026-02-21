# Time Tracking Frontend Architecture Report

## Overview

Plane implements a comprehensive time tracking (worklog) system in the frontend with tight integration into the issue detail view. Time logs are logged, displayed in activity feed, and can be viewed in a dedicated time tracking report page.

---

## 1. Core Time Tracking Components

### Worklog Store & Service

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/store/worklog.store.ts`
**Type**: MobX Observable Store

Key features:

- Maintains `worklogsByIssueId: Record<string, IWorkLog[]>` — caches worklogs per issue
- Tracks loading state with `isLoading` observable
- Manages in-flight delete requests to prevent duplicate calls
- Provides helper methods:
  - `getWorklogsForIssue(issueId)` → returns worklog array for issue
  - `getTotalMinutesForIssue(issueId)` → calculates total duration across all worklogs

**CRUD Operations**:

```typescript
fetchWorklogs(workspaceSlug, projectId, issueId): Promise<IWorkLog[]>
createWorklog(workspaceSlug, projectId, issueId, data): Promise<IWorkLog>
updateWorklog(workspaceSlug, projectId, issueId, worklogId, data): Promise<IWorkLog>
deleteWorklog(workspaceSlug, projectId, issueId, worklogId): Promise<void>
```

**Project Summary**:

```typescript
fetchProjectSummary(workspaceSlug, projectId, params): Promise<IWorkLogSummary>
getWorkspaceSummary(workspaceSlug, params): Promise<IWorkLogSummary>
```

---

### Worklog Service

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/services/worklog.service.ts`
**Type**: APIService wrapper

**API Endpoints** (follows Django backend patterns):

```
POST   /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/
GET    /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/
PATCH  /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/{worklog_id}/
DELETE /api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/worklogs/{worklog_id}/
GET    /api/workspaces/{slug}/projects/{project_id}/worklogs/summary/
GET    /api/workspaces/{slug}/time-tracking/summary/
```

**Error handling**: Throws `error?.response?.data` on failure

---

### Store Hook

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/hooks/store/use-worklog.ts`

```typescript
export const useWorklog = (): IWorklogStore => {
  const context = useContext(StoreContext);
  if (context === undefined) throw new Error("useWorklog must be used within StoreProvider");
  return context.worklog;
};
```

**Registration**: Worklog store is registered in CE root store at:
`/Volumes/Data/SHBVN/plane.so/apps/web/ce/store/root.store.ts`

---

## 2. Worklog Modal Component

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/worklog-modal.tsx`
**Type**: React Observer Component

**Form Fields**:

- **Date**: `logged_at` (YYYY-MM-DD format, max = today's date)
- **Duration**: Separate `hours` (0-23) and `minutes` (0-59) inputs
- **Description**: Optional textarea for additional details

**Submission Logic**:

1. Converts hours + minutes to `duration_minutes` using `parseDisplayToMinutes()`
2. Validates `duration_minutes > 0` (shows error toast if not)
3. Calls store action:
   - **Create**: `store.createWorklog()` (new worklog)
   - **Update**: `store.updateWorklog()` (existing worklog with `existingWorklog` prop)
4. Shows success toast + closes modal on success
5. Shows error toast on API failure

**Props**:

```typescript
type TWorklogModal = {
  isOpen: boolean;
  onClose: () => void;
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  existingWorklog?: IWorkLog; // If provided, switches to edit mode
};
```

---

## 3. Worklog in Issue Detail View

### 3a. Sidebar Property Display

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/property/root.tsx`
**Component**: `IssueWorklogProperty` (observer)

**Features**:

- Fetches worklogs on mount for current issue
- Displays total logged time in sidebar using `Timer` icon (Lucide)
- Shows formatted time via `formatMinutesToDisplay()` helper
- **Hidden** if total minutes = 0
- **Location in sidebar**: Between "Labels" property and "Additional Properties"

**Display Format**:

```
[Timer Icon] {formatted_time}  (e.g., "2h 30m")
```

**Integration Points**:

- Sidebar: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/issues/issue-detail/sidebar.tsx` (lines 262-267)
- Peek Overview: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/issues/peek-overview/properties.tsx`

---

### 3b. Activity Feed Integration

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/activity/root.tsx`
**Component**: `IssueActivityWorklog`

**Rendering in Activity Feed**:

- Located in: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/issues/issue-detail/issue-activity/activity-comment-root.tsx` (lines 91-99)
- Triggers when `activity_type === "WORKLOG"`

**Display**:

```
[Timer Icon] "Time logged" + date
```

**Props**:

```typescript
type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom"; // For visual separators
};
```

---

### 3c. Log Time Button

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx`
**Component**: `IssueActivityWorklogCreateButton`

**Location**: Activity header (top-right, next to "Activity" title)

**Permissions**:

- **Hidden if**: Intake issue OR Guest role
- **Shown if**: Admin OR Issue assignee
- Controlled by `isWorklogButtonEnabled` computed in `IssueActivity` component

**Behavior**:

1. Button click → Opens `WorklogModal`
2. User fills form → Modal closes on success
3. Worklog appears in activity feed immediately

---

### 3d. Activity Filter Integration

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/components/issues/worklog/activity/filter-root.tsx`
**Component**: `ActivityFilterRoot`

**Filtering**:

- Worklog entries can be toggled in/out of activity feed via filter UI
- Filter options defined in `ACTIVITY_FILTER_TYPE_OPTIONS` from `@plane/constants`
- Uses `filterActivityOnSelectedFilters()` helper to apply filters

---

## 4. Activity Display Pipeline

### Data Flow:

```
Issue Detail
  ├─ IssueActivity (root component)
  │   ├─ Fetches activity via useIssueDetail()
  │   ├─ Displays IssueActivityWorklogCreateButton (if allowed)
  │   └─ Passes to IssueActivityCommentRoot
  │
  └─ IssueActivityCommentRoot
      ├─ Gets activityAndComments from store
      ├─ Applies selectedFilters
      └─ Renders based on activity_type:
          ├─ COMMENT → CommentCard
          ├─ BASE_ACTIVITY_FILTER_TYPES → IssueActivityItem
          ├─ ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY → IssueAdditionalPropertiesActivity
          ├─ WORKLOG → IssueActivityWorklog (custom render)
```

**Activity Comment Root**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/issues/issue-detail/issue-activity/activity-comment-root.tsx`

---

## 5. Time Tracking Report Page

### Overview

**Location**: `/Volumes/Data/SHBVN/plane.so/apps/web/app/(all)/[workspaceSlug]/(projects)/projects/(detail)/[projectId]/time-tracking/`

**URL Pattern**: `/:workspaceSlug/projects/:projectId/time-tracking`

### Components

#### 5a. TimeTrackingReportPage (Root)

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/time-tracking/time-tracking-report-page.tsx`

**Features**:

- Fetches `IWorkLogSummary` via `WorklogService.getProjectSummary()`
- Supports date range filtering (`date_from`, `date_to`)
- Displays loading/error/empty states
- Renders KPI cards + issue table

**State Management**:

- Uses direct `WorklogService` calls (not store-based)
- No caching — fresh data on each "Apply" filter click

#### 5b. TimeTrackingFilters

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/time-tracking/time-tracking-filters.tsx`

**UI**:

- Date input: "From" (date picker)
- Date input: "To" (date picker)
- Apply button (triggers refetch)

#### 5c. TimeTrackingSummaryCards

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/time-tracking/time-tracking-summary-cards.tsx`

**KPI Metrics**:

1. **Total Logged**: Sum of all `duration_minutes` across issues
2. **Total Estimated**: Sum of all `estimate_time` from issues
3. **Variance**: `Total Logged - Total Estimated`
   - Positive (red): Over-estimate
   - Negative (green): Under-estimate
   - Zero (neutral): On-target

#### 5d. TimeTrackingIssueTable

**File**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/components/time-tracking/time-tracking-issue-table.tsx`

**Columns**:
| Column | Value | Format |
|--------|-------|--------|
| Issue | `issue_name` | Text (or "Deleted issue" if missing) |
| Estimate | `estimate_time` | Formatted via `formatMinutesToDisplay()` or "—" |
| Logged | `total_minutes` | Formatted via `formatMinutesToDisplay()` |
| Variance | Logged - Estimate | Color-coded (red/green/neutral) |

**Data Source**: `IWorkLogSummary.by_issue` array

---

## 6. TypeScript Types & Interfaces

**File**: `/Volumes/Data/SHBVN/plane.so/packages/types/src/worklog.ts`

```typescript
interface IWorkLog {
  id: string;
  issue: string;
  logged_by: string;
  duration_minutes: number;
  description: string;
  logged_at: string; // YYYY-MM-DD
  created_at: string;
  updated_at: string;
  logged_by_detail?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
}

interface IWorkLogCreate {
  duration_minutes: number;
  description?: string;
  logged_at: string;
}

interface IWorkLogUpdate {
  duration_minutes?: number;
  description?: string;
  logged_at?: string;
}

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
    estimate_time: number | null;
    total_minutes: number;
  }>;
}
```

---

## 7. Utility Functions

**File**: `/Volumes/Data/SHBVN/plane.so/packages/constants/src/worklog.ts`

```typescript
// Format minutes to human-readable string
export const formatMinutesToDisplay = (minutes: number): string => {
  // 90 → "1h 30m", 60 → "1h", 25 → "25m", 0 → "0m"
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Convert hours + minutes form inputs to total minutes
export const parseDisplayToMinutes = (hours: number, minutes: number): number => hours * 60 + minutes;
```

---

## 8. State Management Architecture

### Store Registration

**CE Root Store**: `/Volumes/Data/SHBVN/plane.so/apps/web/ce/store/root.store.ts`

```typescript
export class RootStore extends CoreRootStore {
  worklog: IWorklogStore;

  constructor() {
    super();
    this.worklog = new WorklogStore();
  }
}
```

**Core Root Store**: `/Volumes/Data/SHBVN/plane.so/apps/web/core/store/root.store.ts`

- Worklog is a separate, isolated store (not nested in issue detail store)

### Store Context

- Accessed via `useWorklog()` hook
- Available throughout app via `StoreProvider`
- Maintains cache per issue via `worklogsByIssueId` observable

---

## 9. Integration Points in Issue Detail

### Sidebar Display

```
Issue Detail Sidebar
├── State
├── Assignees
├── Priority
├── Created By
├── Start Date
├── Target Date (with Due Date Alert)
├── Estimate
├── Modules
├── Cycle
├── Parent
├── Labels
├── [IssueWorklogProperty] ← Time logged display
└── Additional Properties
```

### Activity Feed

```
Issue Activity Section
├── Header: "Activity" title
├── [Log Time Button] ← Permission-based visibility
├── Sort toggle
├── Filter toggle
└── Activity List
    ├── Comments (CommentCard)
    ├── Properties (IssueActivityItem)
    ├── Additional Properties
    ├── [IssueActivityWorklog] ← Worklog entries
    └── Comments (more)
```

---

## 10. Key Implementation Details

### 10a. Modal State Management

- Modal open/close controlled by parent component (`useState`)
- `WorklogModal` accepts `existingWorklog` prop for edit mode
- Form resets on close (via `useEffect` dependency on `isOpen`)

### 10b. Worklog Creation Flow

1. User clicks "Log Time" button
2. `WorklogModal` opens (create mode)
3. User fills date, hours, minutes, description
4. Submit → Validates `duration_minutes > 0`
5. Store action `createWorklog()` → API POST
6. On success: Modal closes, toast shown, worklog appears in activity feed
7. On failure: Error toast, modal stays open

### 10c. Worklog Update Flow

1. User clicks edit icon on existing worklog entry (if available in activity)
2. `WorklogModal` opens with `existingWorklog` prop
3. Form auto-populates from `existingWorklog` data
4. User modifies fields
5. Submit → Store action `updateWorklog()` → API PATCH
6. Modal closes, activity feed updates

### 10d. Worklog Delete Flow

1. User clicks delete icon on worklog entry
2. Store action `deleteWorklog()` → API DELETE
3. Optimistic update: Remove from `worklogsByIssueId[issueId]`
4. On failure: Restore from backup (`prevList`)
5. In-flight tracking prevents duplicate delete calls

### 10e. Permission Control

```typescript
// IssueActivity component
const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && (isAdmin || isAssigned);
```

- Admin: Always can log time
- Member assigned to issue: Can log time
- Guest: Cannot log time
- Intake issues: Cannot log time

---

## 11. Activity Type Filtering

**Supported Filter Types** (from `@plane/constants`):

- `COMMENT`
- `PROPERTY_CHANGE` (state, assignees, priority, etc.)
- `WORKLOG` ← Can be toggled in/out
- `ISSUE_ADDITIONAL_PROPERTIES_ACTIVITY`

**Filter UI**: Activity header dropdown allows toggling each filter type

---

## 12. Responsive Layout

### Desktop (Issue Detail):

- Sidebar: Right panel with worklog property + button
- Activity: Full-width activity feed with worklog entries

### Mobile (Peek Overview):

- Same sidebar integration via `PeekOverviewProperties` component
- Worklog property still visible in issue properties

---

## Summary

**Time tracking in Plane is a well-integrated CE feature**:

1. **Core**: Worklog store + service for CRUD operations
2. **Issue Detail**:
   - Sidebar shows total logged time (via `IssueWorklogProperty`)
   - Activity feed displays worklog entries (via `IssueActivityWorklog`)
   - Log Time button (conditional visibility based on permissions)
3. **Modal**: Dedicated `WorklogModal` for create/edit workflows
4. **Report Page**: Project-level summary with KPIs and issue-by-issue breakdown
5. **State**: MobX store with cache per issue, no store nesting
6. **Types**: Fully typed with TypeScript interfaces from `@plane/types`

**Key Files Summary**:
| Component | Path |
|-----------|------|
| Store | `apps/web/core/store/worklog.store.ts` |
| Service | `apps/web/core/services/worklog.service.ts` |
| Hook | `apps/web/core/hooks/store/use-worklog.ts` |
| Modal | `apps/web/ce/components/issues/worklog/worklog-modal.tsx` |
| Sidebar Property | `apps/web/ce/components/issues/worklog/property/root.tsx` |
| Activity Entry | `apps/web/ce/components/issues/worklog/activity/root.tsx` |
| Log Time Button | `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx` |
| Report Page | `apps/web/core/components/time-tracking/time-tracking-report-page.tsx` |
| Types | `packages/types/src/worklog.ts` |
| Utilities | `packages/constants/src/worklog.ts` |
