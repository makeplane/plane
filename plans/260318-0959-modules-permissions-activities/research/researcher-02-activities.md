# Activity Tracking System Research

## Backend Architecture

**IssueActivity Model** (`apps/api/plane/db/models/issue.py:439`)

- FK to Issue, actor (User), IssueComment (nullable)
- Fields: `verb`, `field`, `old_value`, `new_value`, `comment`, `attachments` (URLField array, max 10)
- Extends ProjectBaseModel (has id, workspace, project, created_at, updated_at, created_by)

**Activity Endpoint** (`apps/api/plane/app/views/issue/activity.py`)

- GET `/api/workspaces/{slug}/projects/{project_id}/issues/{issue_id}/activities/` (BaseAPIView, ProjectEntityPermission)
- Filters: excludes comment/vote/reaction/draft fields, requires active project member
- Query params: `created_at__gt` (delta sync), `activity_type` (issue-property | issue-comment)
- Returns serialized activities OR comments (mixed in response)
- Serializer: IssueActivitySerializer

**Activity Creation Pattern** (inferred from codebase)

- No dedicated "create activity" endpoint — activities logged server-side (via signals or views)
- Verb verbs: "created", and field-level changes tracked via verb+field+old/new_value
- Comment activities use separate IssueComment table + IssueCommentSerializer

## Frontend Architecture

**IssueActivityStore** (`apps/web/ce/store/issue/issue-details/activity.store.ts`)

- Extends CoreRootStore pattern
- Observables: `loader` (fetch|mutate|undefined), `activities` (TIssueActivityIdMap), `activityMap` (TIssueActivityMap)
- Actions: `fetchActivities(workspaceSlug, projectId, issueId, loaderType?)` → Promise<TIssueActivity[]>
- Helpers: `getActivitiesByIssueId()`, `getActivityById()`, `getActivityAndCommentsByIssueId(issueId, sortOrder)`
- Service: IssueActivityService (dynamically supports ISSUES/EPICS via EIssueServiceType)
- Merges activities + comments into unified timeline via `buildActivityAndCommentItems()`

**Activity Display Components**

- **Issue Detail Activity Root**: `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx` (permission-gated)
- **Activity List**: renders per-field action components (priority, state, assignee, labels, dates, etc.) in `activity/actions/`
- **Activity Filter**: `activity-filter.tsx` (activity_type selector)
- **Worklog Activity Component**: `apps/web/ce/components/issues/worklog/activity/root.tsx` (renders TIssueActivityComment, detects worklog entries)

**Worklog as Activity Reference**

- Activities mixed with comments in unified stream
- Worklog entries identified by `activityComment.id` matching worklog IDs
- Permissions: admin-only edit/delete within 60-working-day window (isWithinEditWindow utility)
- Shows actor name, duration, formatted date, edit/delete menu with error extraction

## Key Integration Points

1. **Activity Fetch**: triggered on issue detail load via store action
2. **Comment + Activity Merge**: frontend combines separate API responses into single timeline
3. **Field-level Rendering**: each activity field (state, priority, etc.) has custom action component for humanized display
4. **Permissions**: ProjectEntityPermission + ProjectMember check on backend; frontend uses allowPermissions hook
5. **Error Handling**: extractApiError utility for user-facing messages

## Unresolved Questions

- How are activities created server-side (signals, middleware, or view-level)?
- What triggers verb determination (e.g., "updated" vs field-specific)?
- Are there audit/soft-delete requirements for activities themselves?
- IssueComment relation purpose (for comment field activities vs comment_activity distinction)?
