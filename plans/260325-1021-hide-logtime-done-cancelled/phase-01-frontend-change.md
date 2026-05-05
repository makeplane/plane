# Phase 01: Hide Logtime Button for Done/Cancelled Work Items

## Overview

- **Priority**: High (UX correctness)
- **Status**: ⬜ Pending
- **Scope**: Frontend only — pure UI logic, no backend changes needed

## Requirements

- Functional: Nút "Log Time" phải ẩn hoàn toàn khi `issue.state_id` thuộc group `done` hoặc `cancelled`
- Non-functional: Không ảnh hưởng đến các trạng thái khác, không thêm network request mới

## Related Code Files

### Modify

- `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx`

### No change needed

- `apps/web/ce/components/issues/worklog/activity/worklog-create-button.tsx` — button đã hỗ trợ prop `disabled` → trả về `null`, logic chỉ cần ở caller

## Embedded Rules

1. **`observer()` always**: Component `IssueActivity` đã là `observer` — không cần thay đổi
2. **CE Override Pattern**: File nằm trong `core/` — KHÔNG tạo override trong `ce/` vì logic này là core behavior chung
3. **`useProjectState` pattern**: dùng `getStateById(stateId)?.group` — đã xác nhận qua `use-issue-form-validation.ts` và nhiều component khác
4. **No hardcoded colors**: Change này không liên quan đến UI color
5. **Import order**: React → `import type` → `@plane/*` → `@/` → relative

## Implementation Steps

### Step 1 — Thêm `useProjectState` import và hook vào `IssueActivity`

File: `apps/web/core/components/issues/issue-detail/issue-activity/root.tsx`

Thêm import ở line ~23 (sau `useUser, useUserPermissions`):

```ts
import { useProjectState } from "@/hooks/store/use-project-state";
```

### Step 2 — Tính `isStateTerminal` từ `state_id` của issue

Sau `const isAssigned = ...` (line 83), thêm:

```ts
const { getStateById } = useProjectState();
const stateGroup = issue?.state_id ? getStateById(issue.state_id)?.group : undefined;
const isStateTerminal = stateGroup === "done" || stateGroup === "cancelled";
```

### Step 3 — Cập nhật `isWorklogButtonEnabled`

Sửa line 85 từ:

```ts
const isWorklogButtonEnabled = !isIntakeIssue && !isGuest && isTimeTrackingEnabled && (isAdmin || isAssigned);
```

Thành:

```ts
const isWorklogButtonEnabled =
  !isIntakeIssue && !isGuest && isTimeTrackingEnabled && (isAdmin || isAssigned) && !isStateTerminal;
```

## Post-Phase Checklist

- [ ] `observer()` đã wrap component (đã có sẵn)
- [ ] `useProjectState` import đúng từ `@/hooks/store/use-project-state`
- [ ] Logic `isStateTerminal` sử dụng string literals `"done"` và `"cancelled"` (confirm từ `use-issue-form-validation.ts`: `"backlog"`)
- [ ] Nút ẩn khi state group = `done` hoặc `cancelled`
- [ ] Nút hiên khi state group = `started`, `unstarted`, `backlog`, etc.
- [ ] Không có hardcoded color nào thêm vào
- [ ] Không có text hardcode (không thêm UI string mới)
- [ ] Lint pass: `pnpm check:lint`

## Success Criteria

- Work item ở status **Done** → không thấy nút "Log Time"
- Work item ở status **Cancelled** → không thấy nút "Log Time"
- Work item ở status **In Progress / Todo / Backlog** → nút "Log Time" hiển thị bình thường (nếu enabled)
- Không có regression với các điều kiện khác (`isIntakeIssue`, `isGuest`, `isTimeTrackingEnabled`)

## Verification Plan

### Manual Verification

1. Chạy frontend dev server: `pnpm dev` (đã running)
2. Mở một work item ở trạng thái **Done** → vào tab Activity → xác nhận không có nút "Log Time"
3. Mở một work item ở trạng thái **Cancelled** → vào tab Activity → xác nhận không có nút "Log Time"
4. Mở một work item ở trạng thái **In Progress** → vào tab Activity → xác nhận nút "Log Time" còn hiển thị
5. Đổi trạng thái từ "In Progress" → "Done" → xác nhận nút "Log Time" biến mất ngay lập tức (reactive)

### Lint Check

```bash
cd /Users/ngoctran/Documents/Shinhan/plane
pnpm check:lint
```
