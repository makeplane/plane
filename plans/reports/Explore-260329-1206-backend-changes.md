# Plane.so Backend Changes Exploration Report

**Date:** March 29, 2026 | **Focus:** Recent Backend Features (Time-tracking, Task Categories, HO Endpoints)

---

## Executive Summary

Recent commits to the Plane.so backend (from `3eb9d1ff0a` to `HEAD`) introduce three major feature areas:

1. **Task Categories** — Instance-level hierarchical classification (Main/Sub categories) for issues
2. **Time-Tracking Enhancements** — Cross-workspace analytics, capacity reporting, and day-level details
3. **Head Office (HO) API** — Cross-workspace issue listing with role-based access control (instance admins, department managers)

All changes follow Plane's backend architecture (views in `plane/app/`, license endpoints in `plane/license/api/`, models in `plane/db/models/`).

---

## 1. TASK CATEGORY SYSTEM

### Models (New)

**Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/task_category.py`

Two hierarchical instance-level models:

```
MainTaskCategory (instance-wide, not workspace-scoped)
├── id (UUID, primary key)
├── name (unique per deletion context)
├── description (optional)
├── sort_order (float, for ordering)
├── is_active (boolean, soft enable/disable)
└── base fields: created_at, updated_at, deleted_at, created_by, updated_by

SubTaskCategory (linked to MainTaskCategory, cascade delete)
├── id (UUID)
├── main_category (ForeignKey → MainTaskCategory, CASCADE)
├── name (unique per main_category + deletion context)
├── description
├── sort_order
├── is_active
└── base fields: created_at, updated_at, deleted_at, created_by, updated_by
```

### Database Migration

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/migrations/0158_add_task_category_models.py`

- Creates `main_task_categories` and `sub_task_categories` tables
- Adds `main_task_category` (ForeignKey, NULL) and `sub_task_category` (ForeignKey, NULL) fields to `Issue` model
- Unique constraints: `main_task_category_unique_name` and `sub_task_category_unique_name_per_main`
- Migrations `0159` and `0160` add category fields to default workspace views and fix display settings

### Serializers

**Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/serializers/task_category.py`

```python
MainTaskCategorySerializer
├── fields: id, name, description, sort_order, is_active, created_at, updated_at
├── read_only: id, created_at, updated_at

SubTaskCategorySerializer
├── fields: id, main_category, name, description, sort_order, is_active, created_at, updated_at
├── validation: ensures main_category is active (if provided)
└── read_only: id, created_at, updated_at
```

### Views (Frontend API - plane/app/)

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/task_category.py`

| View                       | Method | Purpose                                                              | Auth                      |
| -------------------------- | ------ | -------------------------------------------------------------------- | ------------------------- |
| `MainTaskCategoryEndpoint` | GET    | List active main categories                                          | Session (workspace level) |
| `SubTaskCategoryEndpoint`  | GET    | List active sub categories (optionally filtered by main_category_id) | Session                   |

**URLs:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/urls/task_category.py`

```
GET  /workspaces/<slug>/task-categories/main/
GET  /workspaces/<slug>/task-categories/sub/?main_category=<uuid>
```

### Views (Admin/Instance API - plane/license/api/)

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/task_category.py`

Full CRUD endpoints for instance admins (God Mode):

| Endpoint                                 | Methods            | Purpose                                   |
| ---------------------------------------- | ------------------ | ----------------------------------------- |
| `InstanceMainTaskCategoryEndpoint`       | GET, POST          | List and create main categories           |
| `InstanceMainTaskCategoryDetailEndpoint` | GET, PATCH, DELETE | Detail, update, soft-delete main category |
| `InstanceSubTaskCategoryEndpoint`        | GET, POST          | List and create sub categories            |
| `InstanceSubTaskCategoryDetailEndpoint`  | GET, PATCH, DELETE | Detail, update, soft-delete sub category  |

**URLs:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/urls/task_category.py`

```
GET  /task-categories/main/
POST /task-categories/main/
GET  /task-categories/main/<uuid>/
PATCH /task-categories/main/<uuid>/
DELETE /task-categories/main/<uuid>/

GET  /task-categories/sub/?main_category_id=<uuid>
POST /task-categories/sub/
GET  /task-categories/sub/<uuid>/
PATCH /task-categories/sub/<uuid>/
DELETE /task-categories/sub/<uuid>/
```

### Integration with Issues

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/serializers/issue.py`

Issue serializer now includes category fields:

```python
IssueCreateSerializer (and IssueSerializer)
├── main_task_category_id (write field, source: main_task_category)
│   └── queryset: active MainTaskCategory objects
├── sub_task_category_id (write field, source: sub_task_category)
│   └── queryset: active SubTaskCategory objects
└── validation rules:
    - For non-draft issues: main_task_category is required (if any categories exist in system)
    - For non-draft issues: sub_task_category is required
    - sub_task_category.main_category must match selected main_task_category
```

Fields included in read responses:

- `main_task_category_id` (UUID)
- `sub_task_category_id` (UUID)

---

## 2. TIME-TRACKING ENHANCEMENTS

### New Endpoints

**Location:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/workspace/time_tracking/`

#### A. Cross-Workspace Timesheet (Enhanced)

**File:** `cross_workspace.py` - `CrossWorkspaceTimesheetEndpoint`

**Changed behavior:**

- **Before:** Only showed issues with logged time in the selected week
- **Now:** Shows ALL issues assigned to the current user (across all their workspaces), with logged time for the week (0 if no logs)

```
GET /api/workspaces/<slug>/time-tracking/cross-workspace/timesheet/
?week_start=YYYY-MM-DD  (optional, defaults to Monday of current week)
```

**Response:**

```json
{
  "week_start": "2026-03-24",
  "week_end": "2026-03-30",
  "rows": [
    {
      "issue_id": "<uuid>",
      "issue_name": "string",
      "issue_identifier": "PRJ-123",
      "project_id": "<uuid>",
      "workspace_slug": "workspace-slug",
      "workspace_name": "Workspace Name",
      "days": {
        "2026-03-24": 120,  // minutes logged
        "2026-03-25": 0
      },
      "total_minutes": 120
    }
  ],
  "daily_totals": {"2026-03-24": 250, ...},
  "grand_total_minutes": 1500
}
```

#### B. Cross-Workspace Capacity

**File:** `cross_workspace.py` - `CrossWorkspaceCapacityEndpoint`

Lists all members from user's workspaces with logged time aggregated per day.

```
GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/
?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD  (optional, defaults to current week)
```

**Response:**

```json
{
  "date_from": "2026-03-24",
  "date_to": "2026-03-30",
  "members": [
    {
      "member_id": "<uuid>",
      "display_name": "John Doe",
      "avatar_url": "https://...",
      "total_logged_minutes": 480,
      "days": {
        "2026-03-24": 120,
        "2026-03-25": 60
      }
    }
  ],
  "project_total_logged": 1500
}
```

#### C. Cross-Workspace Capacity Day Details (NEW)

**File:** `cross_workspace.py` - `CrossWorkspaceCapacityDayDetailsEndpoint`

Provides per-task breakdown for a specific member on a specific day (used by capacity heatmap popover).

```
GET /api/workspaces/<slug>/time-tracking/cross-workspace/capacity/day-details/
?member_id=<uuid>&date=YYYY-MM-DD
```

**Response:**

```json
{
  "tasks": [
    {
      "issue_id": "<uuid>",
      "issue_name": "Fix login bug",
      "issue_identifier": "PRJ-42",
      "total_minutes": 120
    }
  ]
}
```

#### D. Project Analytics Timesheet

**File:** `analytics_timesheet.py` - `ProjectAnalyticsTimesheetEndpoint`

Week-grid view showing ALL issues in a project with aggregate logtime from ALL users. Includes per-user breakdown per issue per day.

```
GET /api/workspaces/<slug>/projects/<project_id>/time-tracking/analytics/timesheet/
?week_start=YYYY-MM-DD  (optional)
```

**Response:**

```json
{
  "week_start": "2026-03-24",
  "week_end": "2026-03-30",
  "rows": [
    {
      "issue_id": "<uuid>",
      "issue_name": "Build dashboard",
      "issue_identifier": "PRJ-10",
      "project_id": "<uuid>",
      "days": {"2026-03-24": 240, ...},
      "by_user": [
        {
          "user_id": "<uuid>",
          "display_name": "Jane Smith",
          "avatar_url": "https://...",
          "days": {"2026-03-24": 120, ...},
          "total_minutes": 240
        }
      ],
      "total_minutes": 480
    }
  ],
  "daily_totals": {...},
  "grand_total_minutes": 2100
}
```

### Worklog Summary Endpoints (Existing, Enhanced)

**File:** `summary.py`

- `ProjectWorkLogSummaryEndpoint` — Aggregates worklog by member and issue within a project
- `WorkspaceWorkLogSummaryEndpoint` — Workspace-wide aggregation with optional filters (project_id, member_id, date range)

**Filtering:** Both support optional `date_from`, `date_to` query parameters (inclusive range)

**Result capping:** Responses limited to 500 results per grouping (SUMMARY_RESULT_LIMIT) to prevent huge payloads

---

## 3. HEAD OFFICE (HO) API — Cross-Workspace Issue Management

### Overview

New endpoints for cross-workspace issue viewing with role-based access control:

- **Instance Admins:** Can view all workspace issues
- **Department Managers:** Can view issues from workspaces linked to their managed departments (and descendants)
- **Regular Users:** Forbidden (403)

### New Files

#### Serializer

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/serializers/ho.py`

```python
HoIssueSerializer
├── Read-only, computed fields
├── Fields:
│   ├── id, project_id
│   ├── workspace_slug (computed: project.workspace.slug)
│   ├── department_name (computed: project.workspace.name)
│   ├── project_name (computed: project.name)
│   ├── name (issue name)
│   ├── main_task_category_name, sub_task_category_name
│   ├── sub_issues_count (annotated)
│   ├── project_lead (computed: project.project_lead.display_name)
│   ├── assignees (array: {id, display_name, avatar})
│   ├── is_bank_wide_project (computed)
│   ├── priority, state_name, state_color
│   ├── start_date, target_date, completed_at
│   ├── cycle_name (from issue_cycle relation)
│   ├── module_names (array, from issue_module relation)
│   ├── total_log_time (sum of worklog durations)
│   └── reference_link_count (annotated)

HoCategorySummarySerializer
├── Aggregated counts per category combination
├── Fields: department_name, workspace_slug, project_id, project_name,
│   main_task_category_name, sub_task_category_name, work_item_count
```

#### Views

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/views/ho.py`

##### Helper Functions

- `_is_instance_admin(user)` — Checks if user is in InstanceAdmin table
- `_get_all_descendant_dept_ids(dept_id)` — BFS to collect all descendant departments
- `get_accessible_workspace_ids(user)` — Returns list of workspace IDs based on user role:
  - Instance admin: all workspaces
  - Department managers: workspaces linked to their managed depts (and descendants)
  - Others: empty list (forbidden)

##### Endpoints

| Endpoint                | Method | Purpose                                                       |
| ----------------------- | ------ | ------------------------------------------------------------- |
| `HoIssueListView`       | GET    | Paginated cross-workspace issue list with filtering & sorting |
| `HoCategorySummaryView` | GET    | Aggregated work item counts per category combination          |

**HoIssueListView Parameters:**

```
GET /api/ho/issues/
?order_by=<field>      (default: project__workspace__name)
?from_date=YYYY-MM-DD  (optional, date range filter)
?to_date=YYYY-MM-DD    (optional)
?page=<int>            (pagination, default page 1)
?page_size=<int>       (default 100, max 500)
```

**Allowed order_by fields:**

- `project__workspace__name`, `-project__workspace__name`
- `project__name`, `-project__name`
- `main_task_category__name`, `-main_task_category__name`
- `sub_task_category__name`, `-sub_task_category__name`
- `priority`, `-priority`
- `state__name`, `-state__name`
- `start_date`, `-start_date`, `target_date`, `-target_date`
- `created_at`, `-created_at`

**Date Range Filtering Logic:**
Issues are included if their [start_date, target_date] overlaps [from_date, to_date]:

```
- If from_date specified: include if target_date >= from_date OR target_date IS NULL
- If to_date specified: include if start_date <= to_date OR start_date IS NULL
```

**Response:** Paginated list with HoIssueSerializer

---

**HoCategorySummaryView Parameters:**

```
GET /api/ho/category-summary/
?from_date=YYYY-MM-DD  (optional)
?to_date=YYYY-MM-DD    (optional)
```

**Response:** Array of category summary objects (no pagination)

```json
{
  "results": [
    {
      "department_name": "Engineering",
      "workspace_slug": "engineering-ws",
      "project_id": "<uuid>",
      "project_name": "Platform",
      "main_task_category_name": "Feature",
      "sub_task_category_name": "Backend",
      "work_item_count": 42
    }
  ]
}
```

#### URLs

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/urls/ho.py`

```
GET  /api/ho/issues/                    → HoIssueListView
GET  /api/ho/category-summary/          → HoCategorySummaryView
```

**Registered in:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/app/urls/__init__.py` (added to main urlpatterns)

---

## 4. DATABASE SCHEMA CHANGES

### Issue Model Extensions

**File:** `/Volumes/Data/SHBVN/plane.so/apps/api/plane/db/models/issue.py` (lines 187-201)

```python
main_task_category = models.ForeignKey(
    "db.MainTaskCategory",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="issues",
)
sub_task_category = models.ForeignKey(
    "db.SubTaskCategory",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="issues",
)
```

Both fields are:

- **Optional** (null=True, blank=True) — Issues can exist without categories
- **SET_NULL on delete** — If category is deleted, issue retains other data
- **Allow multiple issues per category** (related_name="issues")

---

## 5. KEY ARCHITECTURAL PATTERNS

### API Layering

| Layer                  | Location                   | Auth                    | Use Case                             |
| ---------------------- | -------------------------- | ----------------------- | ------------------------------------ |
| **Frontend API (v0)**  | `plane/app/views/`         | Session (cookie)        | Browser-based frontend calls         |
| **Instance Admin API** | `plane/license/api/views/` | InstanceAdminPermission | God Mode / instance-level management |
| **External API (v1)**  | `plane/api/views/`         | API Key / OAuth         | Third-party integrations             |

**All new task category endpoints use appropriate layers:**

- `plane/app/views/task_category.py` — For workspace-level listing
- `plane/license/api/views/task_category.py` — For instance-level CRUD (God Mode)

### HO Access Control Pattern

```python
def get_accessible_workspace_ids(user):
    if _is_instance_admin(user):
        return ALL_WORKSPACES

    for managed_dept in user.departments_managing:
        collect_descendant_workspaces(managed_dept)

    return collected_workspaces  # Empty if user has no role
```

This pattern allows flexible role hierarchies: a manager can manage a department and automatically see all sub-departments' workspaces.

### Pagination

**HoIssuePagination:**

- Default page size: 100 items
- Query param: `page_size` (max 500)
- Standard DRF PageNumberPagination

---

## 6. QUERY OPTIMIZATION PATTERNS

### Cross-Workspace Timesheet

Efficiently fetches all assigned issues + their worklogs for a week:

```python
# Step 1: Get user's workspace IDs
user_workspace_ids = WorkspaceMember.objects.filter(
    member=user, is_active=True
).values_list("workspace_id", flat=True)

# Step 2: Get all assigned issues (select_related for project/workspace)
assigned_issues = Issue.issue_objects.filter(
    workspace_id__in=user_workspace_ids,
    assignees=user
).select_related("project", "workspace")

# Step 3: Get worklogs only for assigned issues
worklogs = IssueWorkLog.objects.filter(
    issue_id__in=assigned_issue_ids,
    logged_by=user,
    logged_at__range=[week_start, week_end]
).values("issue_id", "logged_at").annotate(total=Sum("duration_minutes"))

# Python-side aggregation into dict structure (avoids complex GROUP BY)
```

### HO Issue List

Optimized for cross-workspace querying:

```python
qs = Issue.objects.filter(
    workspace_id__in=workspace_ids,
    is_draft=False,
    archived_at__isnull=True,
    deleted_at__isnull=True
).select_related(
    "project", "project__workspace", "project__project_lead",
    "state", "main_task_category", "sub_task_category"
).prefetch_related(
    "assignees",
    "issue_module__module",
    "issue_cycle__cycle"
).annotate(
    total_log_time=Coalesce(
        Sum("issue_worklogs__duration_minutes",
            filter=Q(issue_worklogs__deleted_at__isnull=True)),
        0
    ),
    sub_issues_count=Count("parent_issue", distinct=True),
    reference_link_count=Count("issue_link", distinct=True)
)
```

**Key optimizations:**

- `select_related` for direct FK traversals (project, state, categories)
- `prefetch_related` for reverse relations (assignees, modules, cycles)
- `Coalesce` to default NULL sums to 0
- `distinct=True` in Count to avoid duplication from joins

---

## 7. ISSUE-SPECIFIC NOTES

### Issue.issue_objects vs Issue.objects

**Pattern observed:** Time-tracking uses both:

- `Issue.issue_objects` for user queries (respects soft deletes, drafts)
- `Issue.objects` in HO views (manual filtering for is_draft, deleted_at, archived_at)

This is consistent with Plane's architecture where `issue_objects` is a custom manager ensuring proper filtering.

### Activity Tracking

No explicit activity tracking (issue_activity.delay() calls) found in time-tracking endpoints — these are read-only operations. Task category CRUD endpoints inherit activity tracking from BaseSerializer if configured.

### Soft Deletes

All new models use:

- `deleted_at` (DateTimeField, nullable) for soft deletes
- Unique constraints filtered on `deleted_at__isnull=True`
- Manual filtering in queries (no automatic filtering via custom manager)

---

## 8. UNRESOLVED QUESTIONS & OBSERVATIONS

1. **Instance model availability** — HO views assume `Instance.objects.first()` returns a singleton. Is this created during system initialization?

2. **Department hierarchy breadth** — BFS in `_get_all_descendant_dept_ids()` could be expensive for deep/wide dept trees. No caching observed. Is pagination/limiting in place at the frontend level?

3. **Category requirement logic** — Issue validation requires categories "only when categories exist in the system." Is there admin UI to globally disable category requirements?

4. **Worklog soft-delete handling** — Sum aggregate filters on `issue_worklogs__deleted_at__isnull=True`, but is there a soft-delete field on IssueWorkLog model?

5. **Issue.objects usage in HO views** — Line 126 in ho.py uses `Issue.objects` (not `issue_objects`). Manual filtering applied instead. Is this intentional to allow admins to see all issues including drafts?

6. **Cross-workspace HoIssueListView** — No workspace_slug required in URL (unlike most workspace endpoints). How is the workspace context used for permission checks beyond role verification?

---

## 9. FILE MANIFEST

### New Files Created

| Path                                                             | Type       | Purpose                                        |
| ---------------------------------------------------------------- | ---------- | ---------------------------------------------- |
| `plane/db/models/task_category.py`                               | Model      | MainTaskCategory, SubTaskCategory              |
| `plane/app/views/task_category.py`                               | View       | Workspace-level task category list endpoints   |
| `plane/app/serializers/task_category.py`                         | Serializer | Task category serializers                      |
| `plane/app/urls/task_category.py`                                | URL Config | Task category routes                           |
| `plane/app/views/ho.py`                                          | View       | HoIssueListView, HoCategorySummaryView         |
| `plane/app/serializers/ho.py`                                    | Serializer | HoIssueSerializer, HoCategorySummarySerializer |
| `plane/app/urls/ho.py`                                           | URL Config | HO routes (/ho/issues/, /ho/category-summary/) |
| `plane/license/api/views/task_category.py`                       | View       | Instance-level CRUD endpoints                  |
| `plane/license/api/urls/task_category.py`                        | URL Config | God Mode task category routes                  |
| `plane/db/migrations/0158_add_task_category_models.py`           | Migration  | Create tables + add Issue FKs                  |
| `plane/db/migrations/0159_add_task_category_to_default_views.py` | Migration  | Add category fields to default views           |
| `plane/db/migrations/0160_fix_task_category_display_true.py`     | Migration  | Fix display settings                           |

### Modified Files

| Path                                                         | Changes                                                                                  |
| ------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `plane/app/views/workspace/time_tracking/cross_workspace.py` | Enhanced CrossWorkspaceTimesheetEndpoint, added CrossWorkspaceCapacityDayDetailsEndpoint |
| `plane/app/views/workspace/time_tracking/__init__.py`        | Export new CrossWorkspaceCapacityDayDetailsEndpoint                                      |
| `plane/app/views/__init__.py`                                | Export new time-tracking and HO endpoints                                                |
| `plane/app/urls/workspace.py`                                | Register capacity/day-details route                                                      |
| `plane/app/urls/__init__.py`                                 | Register HO URL patterns                                                                 |
| `plane/app/serializers/issue.py`                             | Add main_task_category_id, sub_task_category_id fields + validation                      |
| `plane/db/models/issue.py`                                   | Add main_task_category and sub_task_category FK fields                                   |

### Key Configuration / Registration Points

- **Serializers:** All task_category and ho serializers registered in respective **init**.py files
- **Views:** Exported in `plane/app/views/__init__.py` and `plane/license/api/views/__init__.py`
- **URLs:** Registered in main URL config (`plane/app/urls/__init__.py`)

---

## 10. SUMMARY TABLE: API Endpoints

### Task Categories (Frontend API)

| Path                                       | Method | View                     | Auth    |
| ------------------------------------------ | ------ | ------------------------ | ------- |
| `/workspaces/<slug>/task-categories/main/` | GET    | MainTaskCategoryEndpoint | Session |
| `/workspaces/<slug>/task-categories/sub/`  | GET    | SubTaskCategoryEndpoint  | Session |

### Task Categories (Instance Admin API)

| Path                            | Method             | View                                   | Auth                    |
| ------------------------------- | ------------------ | -------------------------------------- | ----------------------- |
| `/task-categories/main/`        | GET, POST          | InstanceMainTaskCategoryEndpoint       | InstanceAdminPermission |
| `/task-categories/main/<uuid>/` | GET, PATCH, DELETE | InstanceMainTaskCategoryDetailEndpoint | InstanceAdminPermission |
| `/task-categories/sub/`         | GET, POST          | InstanceSubTaskCategoryEndpoint        | InstanceAdminPermission |
| `/task-categories/sub/<uuid>/`  | GET, PATCH, DELETE | InstanceSubTaskCategoryDetailEndpoint  | InstanceAdminPermission |

### Time-Tracking Endpoints

| Path                                                                          | Method | View                                     | Purpose                             |
| ----------------------------------------------------------------------------- | ------ | ---------------------------------------- | ----------------------------------- |
| `/workspaces/<slug>/time-tracking/cross-workspace/timesheet/`                 | GET    | CrossWorkspaceTimesheetEndpoint          | My timesheet across workspaces      |
| `/workspaces/<slug>/time-tracking/cross-workspace/capacity/`                  | GET    | CrossWorkspaceCapacityEndpoint           | Team capacity across workspaces     |
| `/workspaces/<slug>/time-tracking/cross-workspace/capacity/day-details/`      | GET    | CrossWorkspaceCapacityDayDetailsEndpoint | Task breakdown for member on date   |
| `/workspaces/<slug>/projects/<project_id>/time-tracking/analytics/timesheet/` | GET    | ProjectAnalyticsTimesheetEndpoint        | Project-wide timesheet (all users)  |
| `/workspaces/<slug>/projects/<project_id>/time-tracking/summary/`             | GET    | ProjectWorkLogSummaryEndpoint            | Worklog aggregation by member/issue |
| `/workspaces/<slug>/time-tracking/summary/`                                   | GET    | WorkspaceWorkLogSummaryEndpoint          | Workspace-wide worklog aggregation  |

### Head Office (HO) Endpoints

| Path                        | Method | View                  | Purpose                          | Access                         |
| --------------------------- | ------ | --------------------- | -------------------------------- | ------------------------------ |
| `/api/ho/issues/`           | GET    | HoIssueListView       | Paginated cross-workspace issues | Instance admin / Dept managers |
| `/api/ho/category-summary/` | GET    | HoCategorySummaryView | Aggregated counts by category    | Instance admin / Dept managers |

---

**Report Generated:** 2026-03-29 | **Thoroughness:** Very Thorough | **Status:** Complete
