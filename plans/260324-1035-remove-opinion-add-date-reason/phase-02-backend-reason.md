# Phase 02: Backend – Reason Validation & Activity Storage

## Overview
Khi PATCH issue có `target_date` hoặc `completed_at` thay đổi, backend phải:
1. Yêu cầu `reason` non-empty trong request body
2. Lưu `reason` vào `IssueActivity.comment` cho activity entry tương ứng

## Key Insight (Pattern from Worklog)
- Worklog: `reason` → `IssueActivity.new_value` (vì `new_value` không dùng cho worklog)
- Due date / Completed at: `new_value` đã dùng cho giá trị ngày → lưu `reason` vào `comment` field
- `IssueActivity.comment` hiện được set cứng `"updated the target date to"` (không hiển thị ở frontend) → an toàn để thay bằng reason của user

## File: `apps/api/plane/app/views/issue/base.py`

### Changes trong `partial_update` method

Vị trí: sau khi `current_instance` và `requested_data` được capture (lines 701-703), trước khi gọi serializer.

```python
# Capture trước khi pop (để requested_data có reason)
current_instance = json.dumps(IssueDetailSerializer(issue).data, cls=DjangoJSONEncoder)
requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)  # includes reason

# Pop reason (không phải model field)
reason = request.data.pop("reason", [""])[0] if isinstance(request.data.get("reason"), list) else request.data.pop("reason", "")

# Validate: nếu SETTING (non-null) protected fields thì reason bắt buộc
# Clearing (null/empty) không cần reason — chỉ khi edit sang giá trị mới
REASON_REQUIRED_FIELDS = {"target_date", "completed_at"}
is_setting_protected = any(
    field in request.data and request.data[field] not in (None, "", [])
    for field in REASON_REQUIRED_FIELDS
)
if is_setting_protected and not (reason or "").strip():
    return Response(
        {"error": "A reason is required when changing the due date or completed date."},
        status=status.HTTP_400_BAD_REQUEST,
    )
```

> **Note:** `requested_data` được capture TRƯỚC khi pop `reason`, nên `reason` sẽ có trong `requested_data` và được truyền vào activity task tự động.

> **Edge case:** Nếu `reason` không có trong request (các field khác update bình thường) → không validate → không ảnh hưởng existing flows.

> **Validated decision:** Clearing date (null value) does NOT require reason — only when setting a new date value.

<!-- Updated: Validation Session 1 - Only require reason when setting non-null value, not when clearing -->

## File: `apps/api/plane/bgtasks/issue_activities_task.py`

### Changes trong `track_target_date`

```python
def track_target_date(requested_data, current_instance, issue_id, project_id, workspace_id, actor_id, issue_activities, epoch):
    if current_instance.get("target_date") != requested_data.get("target_date"):
        reason = (requested_data.get("reason") or "").strip()
        issue_activities.append(
            IssueActivity(
                issue_id=issue_id,
                actor_id=actor_id,
                verb="updated",
                old_value=(current_instance.get("target_date") if current_instance.get("target_date") is not None else ""),
                new_value=(requested_data.get("target_date") if requested_data.get("target_date") is not None else ""),
                field="target_date",
                project_id=project_id,
                workspace_id=workspace_id,
                comment=reason,  # user-provided reason (replaces hardcoded text)
                epoch=epoch,
            )
        )
```

### Changes trong `track_completed_at`

Same pattern — thêm `reason = (requested_data.get("reason") or "").strip()` và set `comment=reason`.

## Verification
- Gọi PATCH với `{ "target_date": "2026-04-01" }` (không có reason) → 400 error
- Gọi PATCH với `{ "target_date": "2026-04-01", "reason": "Q2 deadline" }` → 200 OK
- `IssueActivity.comment` có giá trị là reason
- Các field khác (state, priority, v.v.) update bình thường không cần reason
