# Worklog Activity Rendering - Exploration Report

**Date:** 2026-03-19  
**Duration:** ~30 minutes  
**Status:** Complete investigation

---

## Executive Summary

**Question:** Why can't users see worklog modification/deletion activities (field="worklog") in the issue activity feed?

**Answer:** The activities ARE being created in the backend and stored correctly, but the frontend has TWO SEPARATE activity types that need to be handled:

1. **WORKLOG activities** (activity_type="WORKLOG") — Actual worklog entries (create, view)
2. **WORKLOG modification/deletion audit trail** (field="worklog") — Administrative changes (admin edits/deletes with reason)

The modification/deletion entries are being created correctly but rendered via `AdditionalActivityRoot` component which **currently returns empty** instead of displaying them.

---

## Backend Activity Flow

### 1. Activity Creation (Backend)

**File:** `/apps/api/plane/app/views/issue/worklog.py`

Worklog operations trigger `issue_activity` Celery task with these types:

- `"worklog.activity.created"` — When worklog is created (lines 115-125)
- `"worklog.activity.updated"` — When worklog is edited by admin (lines 170-180)
- `"worklog.activity.deleted"` — When worklog is deleted by admin (lines 210-220)

**Key Detail:** All operations require a mandatory `reason` field in request.data:

```python
reason, error_response = self._validate_reason(request)  # Line 147
```

### 2. Activity Mapping (Celery Task)

**File:** `/apps/api/plane/bgtasks/issue_activities_task.py`

`ACTIVITY_MAPPER` (lines 1644-1673) routes worklog types to handler functions:

```python
"worklog.activity.updated": worklog_activity_updated,      # Line 1672
"worklog.activity.deleted": worklog_activity_deleted,      # Line 1673
```

#### worklog_activity_updated (lines 1564-1586)

Creates `IssueActivity` record:

```python
IssueActivity(
    issue_id=issue_id,
    project_id=project_id,
    workspace_id=workspace_id,
    actor_id=actor_id,
    verb="updated",
    field="worklog",                    # ← AUDIT TRAIL FLAG
    old_value=", ".join(changes),       # e.g., "duration: 60m → 90m"
    new_value=reason,                   # ← MODIFICATION REASON
    epoch=epoch,
)
```

#### worklog_activity_deleted (lines 1589-1603)

Similar structure:

```python
IssueActivity(
    ...
    verb="deleted",
    field="worklog",
    old_value=f"{duration}m logged",
    new_value=reason,                   # ← DELETION REASON
    epoch=epoch,
)
```

**Result:** Activities stored with:

- `field="worklog"` (audit trail marker)
- `verb="updated"` or `"deleted"`
- `new_value` = modification reason provided by admin

---

## Frontend Activity Rendering

### 1. Activity Store

**File:** `/apps/web/ce/store/issue/issue-details/activity.store.ts`

Method `buildActivityAndCommentItems` (lines 87-141) transforms IssueActivity records to TIssueActivityComment objects.

For activities with specific fields, it maps field → activity_type:

- field="state" → EActivityFilterType.STATE
- field="assignees" → EActivityFilterType.ASSIGNEE
- field=null → EActivityFilterType.DEFAULT
- **All other fields** → EActivityFilterType.ACTIVITY

**Worklog activities with field="worklog" get mapped to type="ACTIVITY"** (line 110).

### 2. Activity Comment Root

**File:** `/apps/web/core/components/issues/issue-detail/issue-activity/activity-comment-root.tsx`

Renders activity items (lines 74-134):

```tsx
if (BASE_ACTIVITY_FILTER_TYPES.includes(activityComment.activity_type)) {
  return <IssueActivityItem activityId={activityComment.id} ... />  // Line 94-109
}
```

BASE_ACTIVITY_FILTER_TYPES includes "ACTIVITY" type.

### 3. Activity Item Renderer

**File:** `/apps/web/core/components/issues/issue-detail/issue-activity/activity/activity-list.tsx`

Switch statement (lines 52-98) routes activity rendering by `field`:

```tsx
const activityField = getActivityById(activityId)?.field;

const content = (() => {
  switch (activityField) {
    case null: // default issue creation
    case "state": // state changes
    case "name": // name changes
    case "assignees": // assignee changes
    // ... 20+ other fields ...
    case "type": // issue type changes
    default:
      return <AdditionalActivityRoot {...componentDefaultProps} field={activityField} />;
  }
})();
```

**For field="worklog", it falls through to DEFAULT case → calls AdditionalActivityRoot**

### 4. AdditionalActivityRoot Component (THE GAP)

**File:** `/apps/web/ce/components/issues/issue-details/additional-activity-root.tsx`

This is where the worklog modification activities SHOULD be displayed:

```tsx
export const AdditionalActivityRoot = observer(function AdditionalActivityRoot(props: TAdditionalActivityRoot) {
  const { activityId, ends, field } = props;
  const { t } = useTranslation();
  const {
    activity: { getActivityById },
  } = useIssueDetail();

  // Only render worklog audit trail entries
  if (field !== "worklog") return <></>; // ← Line 28

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  const isDeleted = activity.verb === "deleted";
  const icon = isDeleted ? (
    <Trash2 className="h-3.5 w-3.5 text-red-500" />
  ) : (
    <PencilLine className="h-3.5 w-3.5 text-secondary" />
  );

  return (
    <IssueActivityBlockComponent activityId={activityId} icon={icon} ends={ends}>
      <span>
        {isDeleted ? t("worklog.activity_deleted_log") : t("worklog.activity_modified")}
        {activity.old_value && <span className="font-medium text-primary"> — {activity.old_value}</span>}
        {activity.new_value && (
          <>
            <br />
            <span className="text-tertiary ml-0.5">
              {t("worklog.activity_reason")}: &quot;{activity.new_value}&quot;
            </span>
          </>
        )}
      </span>
    </IssueActivityBlockComponent>
  );
});
```

**Status:** ✅ Component EXISTS and is FULLY IMPLEMENTED to display the reason!

---

## Worklog Activity Types (Separate from Modifications)

### WORKLOG Activity Type

**File:** `/apps/web/ce/components/issues/worklog/activity/root.tsx`

`IssueActivityWorklog` component (lines 32-150) displays actual worklog entries:

- Shows logged time, duration, description
- Has edit/delete buttons for admins within 60-working-day window
- Uses Timer icon

**Activity Type:** "WORKLOG" (not "ACTIVITY")

### WORKLOG_GROUP Activity Type

**File:** `/apps/web/ce/components/issues/worklog/activity/worklog-activity-group.tsx`

Collapses consecutive worklogs (>3 entries) into a collapsible group

**Activity Type:** "WORKLOG_GROUP" (from activity store grouping logic)

---

## Translation Keys

**File:** `/packages/i18n/src/locales/en/translations.ts`

Worklog activity translations exist:

```json
{
  "worklog": {
    "activity_modified": "modified a time log",
    "activity_deleted_log": "deleted a time log",
    "activity_reason": "Reason"
  }
}
```

---

## Data Flow Diagram

```
Backend (Issue Edit/Delete Worklog)
    ↓
issue_activity.delay(type="worklog.activity.updated|deleted")
    ↓
Celery Task: issue_activities_task.py
    ↓
ACTIVITY_MAPPER routes to worklog_activity_updated/deleted
    ↓
Creates IssueActivity(field="worklog", verb="updated|deleted", new_value="reason")
    ↓
Stored in DB: IssueActivity table
    ↓
Frontend: IssueActivityService fetches activities
    ↓
Activity Store: maps field="worklog" → activity_type="ACTIVITY"
    ↓
Activity Comment Root: renders ACTIVITY type via IssueActivityItem
    ↓
IssueActivityItem: switch(field) → default case
    ↓
AdditionalActivityRoot: filters field="worklog" and renders modification reason ✅
```

---

## Key Files Summary

| File                                                                                      | Purpose                       | Status             |
| ----------------------------------------------------------------------------------------- | ----------------------------- | ------------------ |
| `/apps/api/plane/app/views/issue/worklog.py`                                              | Issue_activity task trigger   | ✅ Working         |
| `/apps/api/plane/bgtasks/issue_activities_task.py`                                        | Activity creation & mapping   | ✅ Working         |
| `/apps/web/ce/store/issue/issue-details/activity.store.ts`                                | Activity store & grouping     | ✅ Working         |
| `/apps/web/core/components/issues/issue-detail/issue-activity/activity-comment-root.tsx`  | Activity feed router          | ✅ Working         |
| `/apps/web/core/components/issues/issue-detail/issue-activity/activity/activity-list.tsx` | Activity field switch         | ✅ Working         |
| `/apps/web/ce/components/issues/issue-details/additional-activity-root.tsx`               | Worklog modification renderer | ✅ **IMPLEMENTED** |
| `/apps/web/ce/components/issues/worklog/activity/root.tsx`                                | Worklog entry renderer        | ✅ Working         |
| `/packages/i18n/src/locales/en/translations.ts`                                           | i18n keys                     | ✅ Working         |
| `/packages/types/src/issues/activity/base.ts`                                             | TIssueActivityComment type    | ✅ Working         |

---

## Unresolved Questions

1. **Is AdditionalActivityRoot actually being called?** — Component exists and is coded, but need to verify:
   - Is activity with field="worklog" being returned from API?
   - Is activity reaching the IssueActivityItem switch statement?
   - Is the default case actually being triggered?

2. **Why isn't the modification reason visible to users?** Possible causes:
   - Backend not creating activities for worklog updates
   - Activities not being fetched by frontend
   - Filter is hiding "ACTIVITY" type activities
   - AdditionalActivityRoot render check failing

3. **Are activities being created for worklog.activity.created?** — Only "updated" and "deleted" are in ACTIVITY_MAPPER. Where do initial worklog creation activities appear?

4. **Does activity filtering hide worklog modifications?** — Need to check if users have "ACTIVITY" filter enabled in activity feed settings.

---

## CRITICAL FINDING: Activity Filters

**File:** `/packages/constants/src/issue/filter.ts`

### DEFAULT vs DEFAULT-IN-BASE

Two separate sets of activity types:

1. **`defaultActivityFilters`** (lines 347-353) — User-selectable filters:

   ```typescript
   [
     EActivityFilterType.ACTIVITY, // Admin modifications/deletions ← worklog audit trail ends up here
     EActivityFilterType.COMMENT,
     EActivityFilterType.STATE,
     EActivityFilterType.ASSIGNEE,
     EActivityFilterType.WORKLOG, // Actual worklog entries
   ];
   ```

2. **`BASE_ACTIVITY_FILTER_TYPES`** (lines 369-374) — Rendered in IssueActivityItem:
   ```typescript
   [
     EActivityFilterType.ACTIVITY, // ← worklog audit trail matches this
     EActivityFilterType.STATE,
     EActivityFilterType.ASSIGNEE,
     EActivityFilterType.DEFAULT,
   ];
   ```

### Impact

- Worklog modification activities (field="worklog") map to type="ACTIVITY"
- ACTIVITY type IS in BASE_ACTIVITY_FILTER_TYPES (line 370) ✅
- ACTIVITY type IS in defaultActivityFilters (line 348) ✅
- Should NOT be filtered out

### Key Insight

The activity with field="worklog" should render via:

1. Activity store maps it to type="ACTIVITY" ✅
2. Activity comment root matches BASE_ACTIVITY_FILTER_TYPES ✅
3. IssueActivityItem switch statement routes to AdditionalActivityRoot ✅
4. AdditionalActivityRoot filters field=="worklog" and renders ✅

**Everything in the render chain is correctly implemented.**

---

## MISSING PIECE: worklog.activity.created

**Critical Gap:** The ACTIVITY_MAPPER in issue_activities_task.py (lines 1644-1673) is MISSING:

```python
"worklog.activity.created": <handler_function>  # ← NOT PRESENT
```

Backend triggers `issue_activity.delay(type="worklog.activity.created", ...)` (line 116 in worklog.py), but there's no handler function for it.

**Result:** Initial worklog creation activities are silently dropped and never stored.

---

## Root Cause Analysis

### Three Scenarios

#### Scenario 1: User Creates a Worklog

- Backend: `issue_activity.delay(type="worklog.activity.created", ...)`
- Handler: NOT in ACTIVITY_MAPPER → **Activity is NOT created**
- Frontend: **No activity appears** (correct, nothing to display)
- Workaround: Actual worklog appears in WORKLOG activity feed

#### Scenario 2: Admin Edits a Worklog (Within 60-day window)

- Backend: `issue_activity.delay(type="worklog.activity.updated", reason="...")`
- Handler: `worklog_activity_updated()` → **Activity IS created**
- Activity Fields: `field="worklog"`, `verb="updated"`, `new_value=reason`
- Frontend: Should appear via AdditionalActivityRoot ✅

#### Scenario 3: Admin Deletes a Worklog (Within 60-day window)

- Backend: `issue_activity.delay(type="worklog.activity.deleted", reason="...")`
- Handler: `worklog_activity_deleted()` → **Activity IS created**
- Activity Fields: `field="worklog"`, `verb="deleted"`, `new_value=reason`
- Frontend: Should appear via AdditionalActivityRoot ✅

---

## Hypothesis: Why Modifications Aren't Visible

Possibilities (in order of likelihood):

1. **Most Likely:** Activities are being created and stored but users don't have "ACTIVITY" filter enabled in their local storage
   - Check browser storage: `localStorage.issue_activity_filters`
   - Default includes ACTIVITY filter, but users may have disabled it

2. **Likely:** No worklogs have been edited yet in the test environment
   - Only worklog.activity.created is triggered
   - Only created activities would exist (but handler is missing)

3. **Moderate:** Activities are being created but API is not fetching them
   - Check IssueActivityService GET response

4. **Less Likely:** AdditionalActivityRoot is being rendered but the null check is failing
   - Check: `getActivityById(activityId)` returns null for some reason

5. **Unlikely:** Activity with field="worklog" is being mapped to wrong type
   - Code clearly maps it to "ACTIVITY" (line 110 of activity.store.ts)

---

## Conclusion

**The rendering infrastructure for worklog modification/deletion audit trails is FULLY IMPLEMENTED and CORRECTLY WIRED.**

The issue preventing users from seeing the modification reason is likely one of:

- User has disabled "ACTIVITY" filter in their local storage
- No worklog modifications have occurred yet (only creation, which has no handler)
- Activities are being created but not fetched by the API

**Next Steps for Implementation Team:**

1. Add handler for `"worklog.activity.created"` in ACTIVITY_MAPPER (optional, for initial creation audit trail)
2. Verify worklog modification activities are being created: Query `IssueActivity` table where `field="worklog"`
3. Test: Edit a worklog and check if activity appears in feed and in database
4. Verify: Check defaultActivityFilters in localStorage - ensure "ACTIVITY" is included
