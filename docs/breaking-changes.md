# Breaking Changes & Migration Guide

**Last Updated**: 2026-03-29
**Version**: 1.2.4
**Scope**: API breaking changes, data migrations, compatibility notes

---

## Opinion Feature Removal (v1.2.4)

### Overview

The Opinion feature has been completely removed from the platform. Issues no longer support opinions. Existing opinion data is not preserved during migration.

### What Changed

| Aspect                | Before                                     | After                      |
| --------------------- | ------------------------------------------ | -------------------------- |
| **Opinion Model**     | Supported, trackable on issues             | Completely removed         |
| **API Endpoints**     | `GET/POST /api/v1/issues/{id}/opinions/`   | Endpoints deleted (404)    |
| **Database Tables**   | opinion, opinion_comment, opinion_reaction | Dropped by migration 0134  |
| **UI Components**     | Opinion tab in issue detail sidebar        | Removed entirely           |
| **Data Preservation** | All opinion data stored                    | All opinion data discarded |

### Breaking Changes

**API**: All opinion endpoints now return HTTP 404 Not Found

```bash
# Before (v1.2.3 and earlier):
GET /api/v1/issues/{id}/opinions/  → 200 OK + results

# After (v1.2.4+):
GET /api/v1/issues/{id}/opinions/  → 404 Not Found
```

**Frontend**: Opinion components removed entirely

- Opinion tab removed from issue detail sidebar
- Opinion-related API service methods deleted
- No backward compatibility (feature removed)

**Database**: Opinion tables dropped (irreversible)

- Migration 0134: Drops opinion, opinion_comment, opinion_reaction tables
- Applied automatically during deployment
- No rollback path available

### Migration Path

#### For Backend Operators

1. **Deploy Backend Changes**:

   ```bash
   git pull origin preview
   python manage.py migrate db  # Runs migration 0134
   ```

   - Migration removes all opinion tables
   - Expected duration: <1 second (schema-only, no data locks)
   - Safe to run during business hours

2. **Verify Migration Success**:

   ```bash
   python manage.py dbshell
   \dt opinion*  # Should return no results
   ```

3. **Deploy Frontend Changes**:
   - Only after backend migration completes
   - Frontend will no longer attempt to fetch opinion data

#### For API Clients

**Remove Opinion Endpoints**:

```javascript
// Before (v1.2.3 and earlier):
const opinions = await api.get(`/issues/${issueId}/opinions/`);
const opinionCount = opinions.length;

// After (v1.2.4+):
// Remove all opinion-related code
// Opinion feature no longer available via API
```

**Update Issue Detail Rendering**:

```typescript
// Remove opinion section from issue detail
// Before:
<IssueOpinionTab issue={issue} />

// After (v1.2.4+):
// Remove component and related imports
```

### Backward Compatibility

| Component    | Behavior               | Notes                                  |
| ------------ | ---------------------- | -------------------------------------- |
| **Database** | Opinion tables dropped | No "none" records remain; data is lost |
| **API**      | Endpoints return 404   | Intentional breaking change            |
| **Frontend** | Components removed     | Opinion tab no longer appears          |
| **Data**     | Permanently discarded  | No export or preservation mechanism    |

### Risk Assessment

| Risk                       | Severity | Mitigation                                                         |
| -------------------------- | -------- | ------------------------------------------------------------------ |
| Loss of opinion data       | High     | Export data before migration if needed (manual CSV export from DB) |
| API clients break          | Medium   | Update clients to remove opinion endpoints                         |
| Users lose opinion feature | High     | Document feature removal in release notes                          |

### Testing Checklist

- [ ] Verify migration runs without errors: `python manage.py migrate db`
- [ ] Confirm opinion tables dropped: `\dt opinion*` in psql
- [ ] Backend API returns 404 for opinion endpoints
- [ ] Frontend opinion components removed
- [ ] Issue detail sidebar shows no opinion tab
- [ ] API clients updated to not request opinion data

---

## Due Date Change Reason Tracking (v1.2.4)

### Overview

Due date and completion date updates now require an optional reason field for audit trail tracking.

### What Changed

| Aspect               | Before                                    | After                                 |
| -------------------- | ----------------------------------------- | ------------------------------------- |
| **Issue Update API** | `target_date` and `completed_at` optional | `reason` optional, logged if provided |
| **Activity Log**     | No reason recorded for date changes       | Reason stored in IssueActivity        |
| **Audit Trail**      | Limited tracking of date changes          | Full reason + timestamp + actor       |

### Breaking Changes

**API**: PATCH `/api/v1/issues/{id}/` now supports reason field

```bash
# Before (v1.2.3 and earlier):
PATCH /api/v1/issues/{id}/
{ "target_date": "2026-04-01" }  → 200 OK (no reason)

# After (v1.2.4+):
PATCH /api/v1/issues/{id}/
{
  "target_date": "2026-04-01",
  "reason": "Pushed to next sprint due to dependencies"  # Optional but recommended
}  → 200 OK (reason logged in activity)
```

**Activity Trail**: Reason now recorded in `IssueActivity`

- Migration 0135: Adds `reason` column to issue-related tables
- Reason appears in issue activity feed with timestamp and actor

### Migration Path

#### For API Clients

**Update Issue Updates**:

```javascript
// Before (v1.2.3 and earlier):
await api.patch(`/issues/${issueId}/`, {
  target_date: newDate,
});

// After (v1.2.4+, recommended):
await api.patch(`/issues/${issueId}/`, {
  target_date: newDate,
  reason: "Blocked by issue #123, pushed to next sprint", // Optional but logged
});
```

#### For Frontend Developers

**Update Date Change Modals**:

```typescript
// Add reason input field to date picker modals
<DateChangeModal>
  <DatePicker onChange={handleDateChange} />
  <ReasonInput placeholder="Why are you changing this date?" /> // New
  <ConfirmButton />
</DateChangeModal>
```

### Backward Compatibility

| Component        | Behavior                    | Notes                             |
| ---------------- | --------------------------- | --------------------------------- |
| **API**          | Reason field optional       | Existing clients work unchanged   |
| **Activity Log** | Reason recorded if provided | Null if not provided              |
| **Database**     | New column added            | No data loss; backward compatible |
| **UI**           | Optional reason input       | Clients can ignore reason field   |

### Risk Assessment

| Risk                                              | Severity | Mitigation                                    |
| ------------------------------------------------- | -------- | --------------------------------------------- |
| Activity log shows null reason for legacy updates | Low      | Populate via bulk activity backfill if needed |
| API clients don't provide reason                  | Low      | Reason optional; feature is enhancement       |

### Testing Checklist

- [ ] Verify migration 0135 runs: `python manage.py migrate db`
- [ ] Reason column exists in issue tables
- [ ] API accepts reason in PATCH `/api/v1/issues/{id}/`
- [ ] Activity log records reason when provided
- [ ] Null reason when not provided (backward compatible)
- [ ] UI shows reason input in date change modals
- [ ] Reason appears in activity feed with actor/timestamp

---

## Priority System Simplification (v1.2.3)

### Overview

The priority system has been simplified from 5 levels to 4, removing the "none" option entirely and setting "medium" as the new default.

### What Changed

| Aspect               | Before                                     | After                               |
| -------------------- | ------------------------------------------ | ----------------------------------- |
| **Priority Levels**  | urgent, high, medium, low, none (5 total)  | urgent, high, medium, low (4 total) |
| **Default Priority** | "none"                                     | "medium"                            |
| **API Behavior**     | `GET /api/v1/issues?priority=none` allowed | Returns HTTP 400 Bad Request        |
| **UI**               | "None" option in priority dropdowns        | Option removed entirely             |

### Breaking Changes

**API**: Requests filtering by `priority=none` now return HTTP 400 Bad Request

```bash
# Before (v1.2.2 and earlier):
GET /api/v1/issues?priority=none  → 200 OK + results

# After (v1.2.3+):
GET /api/v1/issues?priority=none  → 400 Bad Request
```

**Frontend**: "None" priority option removed from all UI selectors

- Priority dropdowns only show: Urgent, High, Medium, Low
- No fallback to "None" when priority is unset

**Database**: All existing "none" priority records converted to "medium"

- Migration is irreversible (no rollback path)
- Applied automatically during deployment

### Migration Path

#### For Backend Operators

1. **Deploy Backend Changes** (Phase 1):

   ```bash
   # Pull latest code including migration 0131
   git pull origin preview

   # Run database migration
   python manage.py migrate db
   ```

   - Migration 0131 updates all `priority="none"` → `"medium"` in Issue, IssueVersion, DraftIssue
   - Expected duration: <1 second on typical database (update-only, no locks)
   - Run during low-traffic window for safety

2. **Verify Migration Success**:

   ```bash
   # Check for any remaining "none" priority records
   python manage.py dbshell
   SELECT COUNT(*) FROM issue WHERE priority = 'none';  -- Should be 0
   ```

3. **Deploy Frontend Changes** (Phase 2):
   - Only after backend migration is complete
   - Frontend no longer sends "none" priority
   - API will reject "none" filter requests with 400

#### For API Clients

**Update Priority Filters**:

```javascript
// Before (v1.2.2 and earlier):
const issues = await api.get("/issues/", { params: { priority: "none" } });

// After (v1.2.3+):
// Option 1: Omit priority filter (no longer needed)
const issues = await api.get("/issues/");

// Option 2: Filter by explicit priorities
const issues = await api.get("/issues/", {
  params: { priority: "urgent,high,medium,low" },
});
```

**Update Issue Creation**:

```javascript
// Before (v1.2.2 and earlier):
const newIssue = await api.post("/issues/", {
  title: "My Issue",
  priority: "none", // Valid
});

// After (v1.2.3+):
const newIssue = await api.post("/issues/", {
  title: "My Issue",
  // Priority defaults to 'medium' (no need to specify)
  // Or explicitly set to one of: urgent, high, medium, low
});
```

#### For Frontend Developers

**Update Priority Handling**:

```typescript
// Remove checks for "none" priority
// Before:
if (issue.priority === "none") {
  // Show special "no priority" UI
}

// After (v1.2.3+):
// This condition will never be true; remove or replace with:
// - Show unassigned state for null priority (not applicable here)
// - Default to "medium" in forms
```

**Update Type Definitions**:

```typescript
// TypeScript types are type-safe
import type { IIssuePriority } from "@plane/types";

const priority: IIssuePriority = "medium"; // Type-safe, includes urgent|high|medium|low

// Legacy code checking for "none":
// @ts-ignore
const wasNone = priority === "none"; // Type error (as expected)
```

### Backward Compatibility

| Component                  | Behavior                                             | Notes                                           |
| -------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| **Database**               | All "none" values converted to "medium" in migration | No "none" values remain post-migration          |
| **API**                    | Rejects `priority=none` filter with HTTP 400         | Intentional breaking change                     |
| **Frontend Types**         | TIssuePriorities includes "none" for type safety     | Won't be called; exists for edge case rendering |
| **PriorityIcon Component** | Still supports "none" for safety                     | Won't be invoked post-migration                 |
| **CSS Variables**          | `--priority-none` retained                           | No longer used in UI                            |

### Risk Assessment

| Risk                                               | Severity | Mitigation                                               |
| -------------------------------------------------- | -------- | -------------------------------------------------------- |
| Existing issues with "none" priority lose identity | Low      | Migration converts to "medium"; no data loss             |
| API clients filtering by priority=none break       | Medium   | Update clients to remove "none" from filters             |
| Analytics reports missing "none" priority data     | Low      | All data preserved; queries just return "medium" instead |
| Downtime during migration                          | Low      | Update-only operation; <1 second on typical DB           |

### Testing Checklist

- [ ] Verify migration runs without errors: `python manage.py migrate db`
- [ ] Check no "none" records remain: `SELECT COUNT(*) FROM issue WHERE priority = 'none';` → 0
- [ ] Backend API accepts `priority` in (urgent, high, medium, low)
- [ ] Backend API rejects `priority=none` with HTTP 400
- [ ] Frontend removes "none" from priority dropdowns
- [ ] New issues default to "medium" priority
- [ ] Existing issues now show "medium" (previously "none")
- [ ] API clients handle 400 response gracefully

### Related Documentation

- **System Architecture**: `/docs/system-architecture.md` - API changes documented
- **Changelog**: `/docs/project-changelog.md` - v1.2.3 entry with breaking changes
- **Code Standards**: `/docs/code-standards.md` - Priority system standards
- **Implementation Plan**: `plans/260304-1454-remove-none-priority/plan.md`

---

## Department & Staff Management Migration (v1.2.4)

### Overview

Department and Staff profile management has been migrated from workspace-scoped user interfaces to a centralized instance-admin (God-mode) layer. The data models remain unchanged, but administrative CRUD operations are now exclusive to instance administrators.

### What Changed

| Aspect                    | Before                                   | After                                      |
| ------------------------- | ---------------------------------------- | ------------------------------------------ |
| **Admin Access Location** | Workspace Settings → Departments/Staff   | Admin Panel → God-mode → Departments/Staff |
| **API Location**          | `/api/v1/workspaces/{slug}/departments/` | `/god-mode/departments/`                   |
| **Workspace UI**          | Department & Staff management pages      | Org Chart (read-only view only)            |
| **Who Can Manage**        | Workspace Admins                         | Instance Admins (God-mode)                 |

### Breaking Changes

**Workspace Settings**:

- Routes removed from workspace settings
- `/[workspaceSlug]/(settings)/settings/departments/` - No longer exists
- `/[workspaceSlug]/(settings)/settings/staff/` - No longer exists

**API Endpoints** (Workspace-level):

- Old workspace-scoped endpoints removed/deprecated
- New endpoints available at instance-level only (`/god-mode/`)

**Frontend Store Impact**:

- Workspace stores no longer manage department/staff state
- Admin stores (`instance-department.store.ts`, `instance-staff.store.ts`) now handle all CRUD

### New Features

**Org-Chart Page** (Workspace-level, read-only):

- New route: `/:workspaceSlug/org-chart/`
- Displays organizational hierarchy linked to workspace
- Shows all departments and staff members
- No edit capabilities (view-only)

**God-Mode Admin Panel**:

- `/god-mode/departments/` - Create, edit, delete departments
- `/god-mode/staff/` - Create, edit, delete staff profiles
- Bulk import/export capabilities
- Cross-workspace management

**Auto-Join Logic** (v1.2.4):

- Celery task `sync_department_workspace_members` runs when department linked
- Automatically adds staff members as workspace members
- Supports deactivation workflow with cascading user deactivation

### Migration Path

#### For Workspace Admins

**Before (v1.2.3 and earlier)**:

1. Go to Workspace Settings
2. Navigate to Departments or Staff tabs
3. Perform CRUD operations directly

**After (v1.2.4+)**:

1. ✅ Can still view org chart at `/:workspaceSlug/org-chart/`
2. ⚠️ Must contact instance admin to manage departments/staff
3. Instance admin uses `/god-mode/` panel for all management

#### For Instance Admins

**New Responsibilities** (v1.2.4+):

```bash
# Access admin panel
/god-mode/departments/  # Manage all departments
/god-mode/staff/        # Manage all staff profiles

# Workspace linking
Link department to workspace → Auto-syncs members via Celery task
```

#### For API Clients

**Update Endpoint URLs**:

```bash
# Before (v1.2.3 and earlier):
GET /api/v1/workspaces/{slug}/departments/

# After (v1.2.4+):
# Endpoint removed (workspace-level)
# Must use admin API:
GET /god-mode/departments/?workspace_id={id}
```

### Backward Compatibility

| Component          | Behavior                          | Notes                                             |
| ------------------ | --------------------------------- | ------------------------------------------------- |
| **Database**       | Department/Staff models unchanged | Data preserved; only access layer changed         |
| **Workspace Data** | Org-chart endpoint available      | Read-only view of linked departments              |
| **Old API**        | Removed/deprecated                | Update clients to use `/god-mode/` endpoints      |
| **Frontend**       | Settings pages removed            | Org-chart view available to all workspace members |

### Risk Assessment

| Risk                                                   | Severity | Mitigation                                                  |
| ------------------------------------------------------ | -------- | ----------------------------------------------------------- |
| Workspace admins lose direct access to manage staff    | Medium   | Instance admin access via God-mode; support process defined |
| API clients using old endpoints break                  | Medium   | Updated endpoint documentation; deprecation notice provided |
| Auto-join not triggered for existing departments       | Low      | Can manually trigger via admin UI or Celery task            |
| Deactivation removes workspace membership unexpectedly | Low      | Clear workflow documented; reversible via re-activation     |

### Testing Checklist

- [ ] Org-chart page loads and displays linked departments
- [ ] Workspace admins cannot access `/settings/departments/` (404)
- [ ] Workspace admins cannot access `/settings/staff/` (404)
- [ ] Instance admin can access `/god-mode/departments/` (200)
- [ ] Instance admin can perform CRUD on departments
- [ ] Instance admin can perform CRUD on staff profiles
- [ ] Department linking to workspace triggers auto-join Celery task
- [ ] Staff deactivation removes WorkspaceMember role=15 records
- [ ] Staff deactivation sets User.is_active=False
- [ ] Old workspace API endpoints return 404 or deprecation warning

### Related Documentation

- **System Architecture**: `/docs/system-architecture.md` - Complete org structure overview
- **Codebase Summary**: `/docs/codebase-summary.md` - Admin app department/staff features
- **Project Overview**: `/docs/project-overview-pdr.md` - Organizational hierarchy feature

---

## Future Breaking Changes

- TypeScript strict mode rollout (planned for Q2 2026)
- ESLint enforcement (planned for Q2 2026)
- GraphQL API introduction (Q2 2026, alongside REST)

---

**Document Location**: `/Volumes/Data/SHBVN/plane.so/docs/breaking-changes.md`
**Format**: Markdown
**Last Updated**: 2026-03-29 (added opinion removal and due date reason tracking)
**Status**: Final
**Related**: `/docs/project-changelog.md`, `/docs/system-architecture.md`
