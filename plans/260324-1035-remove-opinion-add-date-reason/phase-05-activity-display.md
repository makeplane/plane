# Phase 05: Frontend – Activity Display with Reason

## Overview
Hiển thị reason trong activity feed cho `target_date` và `completed_at` changes.

- `target_date` đã có component riêng → chỉ cần thêm dòng reason
- `completed_at` chưa có component → handle trong `AdditionalActivityRoot` (CE)

---

## 1. Target Date – CE Approach (DO NOT modify core/target_date.tsx)

<!-- Updated: Validation Session 2 - Do NOT patch core/ for display. Use CE override pattern. -->

> **Decision:** `apps/web/core/.../activity/actions/target_date.tsx` must remain unchanged. Reason display must be injected via a CE mechanism.

### Investigation Required Before Implementation

Determine which CE override pattern applies:

**Option A — AdditionalActivityRoot** (preferred if `target_date` field routes there):
- Check `activity-comment-root.tsx` — does it pass `field="target_date"` to `AdditionalActivityRoot`?
- If yes: add `field === "target_date"` case to `AdditionalActivityRoot` (same file as `completed_at`)

**Option B — CE activity action override**:
- Check if there is a CE-level registry/map for activity field → component overrides
- If yes: register a CE version of `target_date` activity component that adds reason display

**Option C — Wrap at IssueActivityItem level**:
- Check `IssueActivityItem` for a CE injection point (slot/render prop/CE import)
- If yes: inject reason display at item level without touching core/target_date.tsx

### Expected display (same as before)
```
[user] set the due date to [date] [time ago]
       Reason: "[reason text]"
```

### Implementation (once CE pattern confirmed)
```tsx
// In whichever CE file handles target_date activity:
{activity.comment && (
  <>
    <br />
    <span className="text-tertiary ml-0.5">
      {t("issue.activity_reason")}: &quot;{activity.comment}&quot;
    </span>
  </>
)}
```

> **Note:** `activity.comment` is already in `TIssueActivity` type — no new field needed.

---

## 2. Completed At – `apps/web/ce/components/issues/issue-details/additional-activity-root.tsx`

### Current behavior
`AdditionalActivityRoot` chỉ render khi `field === "worklog"`. `completed_at` activities rơi vào default case → render `AdditionalActivityRoot` với `field="completed_at"` → hiện tại return `<></>` vì chỉ check worklog.

### Change: thêm case `completed_at`

```tsx
export const AdditionalActivityRoot = observer(function AdditionalActivityRoot(props: TAdditionalActivityRoot) {
  const { activityId, ends, field } = props;
  const { t } = useTranslation();
  const { activity: { getActivityById } } = useIssueDetail();

  const activity = getActivityById(activityId);
  if (!activity) return <></>;

  // Worklog audit trail
  if (field === "worklog") {
    const isDeleted = activity.verb === "deleted";
    const icon = isDeleted
      ? <Trash2 className="h-3.5 w-3.5 text-red-500" />
      : <PencilLine className="h-3.5 w-3.5 text-secondary" />;
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
  }

  // Completed at change
  if (field === "completed_at") {
    return (
      <IssueActivityBlockComponent
        activityId={activityId}
        icon={<CalendarCheck className="h-3.5 w-3.5 text-secondary" />}
        ends={ends}
      >
        <span>
          {activity.new_value ? t("issue.activity_completed_at_set") : t("issue.activity_completed_at_removed")}
          {activity.new_value && (
            <span className="font-medium text-primary ml-1">
              {renderFormattedDate(activity.new_value)}
            </span>
          )}
          {activity.comment && (
            <>
              <br />
              <span className="text-tertiary ml-0.5">
                {t("issue.activity_reason")}: &quot;{activity.comment}&quot;
              </span>
            </>
          )}
        </span>
      </IssueActivityBlockComponent>
    );
  }

  return <></>;
});
```

### New import needed
```tsx
import { CalendarCheck } from "lucide-react";
import { renderFormattedDate } from "@plane/utils";
```

---

## Result in Activity Feed

**Due date change:**
```
📅 [user] set the due date to Mar 31, 2026 [2 minutes ago]
          Reason: "Q2 deadline adjusted per PM request"
```

**Completed at change:**
```
✅ [user] set the completed date to Mar 24, 2026 [just now]
          Reason: "Issue resolved ahead of schedule"
```

## Verification
- Update target_date with reason → activity feed shows reason below date
- Update completed_at with reason → activity feed shows completed_at entry with reason
- Old activities (before this feature) → no reason shown (comment empty) → no UI change
