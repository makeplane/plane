# Plan: Hide Logtime Button for Done/Cancelled Work Items

## Goal

Ẩn nút **Log Time** trên giao diện frontend khi work item đang ở trạng thái `done` hoặc `cancelled`.

## Context

- Nút logtime được render tại: `core/components/issues/issue-detail/issue-activity/root.tsx`
- Biến kiểm soát hiển thị: `isWorklogButtonEnabled` (line 85)
- Issue object đã sẵn có qua `getIssueById(issueId)`
- Pattern check state group đã tồn tại trong codebase: `getStateById(issue.state_id)?.group`

## Phase Table

| Phase | Name            | File(s)                                                       | Status     |
| ----- | --------------- | ------------------------------------------------------------- | ---------- |
| 01    | Frontend Change | `core/components/issues/issue-detail/issue-activity/root.tsx` | ⬜ Pending |

## Summary of Change

Chỉ cần **1 file** cần sửa, **1 dòng logic** thêm vào:

```ts
// Thêm vào root.tsx, sau khi lấy issue và project
const { getStateById } = useProjectState();
const stateGroup = issue?.state_id ? getStateById(issue.state_id)?.group : undefined;
const isStateTerminal = stateGroup === "done" || stateGroup === "cancelled";

// Cập nhật điều kiện isWorklogButtonEnabled
const isWorklogButtonEnabled =
  !isIntakeIssue && !isGuest && isTimeTrackingEnabled && (isAdmin || isAssigned) && !isStateTerminal;
```
