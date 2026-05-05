# Báo cáo: Profile "Your Work" page chậm — phân tích + fix

**URL:** `/[workspaceSlug]/profile/[userId]/`
**Files chính:**
- `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/page.tsx`
- `apps/web/app/(all)/[workspaceSlug]/(projects)/profile/[userId]/layout.tsx`
- `apps/web/ce/components/profile/today-work-items.tsx`
- `apps/web/ce/components/profile/overdue-work-items.tsx`

## Root cause #1: `crossWorkspaces=TRUE` default → multiplier N×

`today-work-items.tsx:41` và `overdue-work-items.tsx:41`:
```ts
const [crossWorkspaces, setCrossWorkspaces] = useState(true); // ❌ default ON
```

Logic fetch (line 64-72):
```ts
workspaceSlugsToFetch.map(async (slug) => {
  const [issuesResponse, projects, states] = await Promise.all([
    userService.getUserProfileIssues(slug, uid, filterParams),  // 1
    projectService.getProjectsLite(slug),                        // 2
    stateService.getWorkspaceStates(slug),                       // 3
  ]);
});
```

→ **Mỗi component = 3 × N workspaces calls**.
→ **Today + Overdue = 6 × N calls** ngay khi mount.

## Root cause #2: Duplicate fetch projects/states

`apps/web/core/layouts/auth-layout/workspace-wrapper.tsx` đã fetch:
- `WORKSPACE_PARTIAL_PROJECTS` (line 88)
- `WORKSPACE_STATES` (line 110)

Cho **current workspace**. TodayWorkItems + OverdueWorkItems lại fetch lại 2 endpoints này cho current workspace → **2 duplicate calls / component**. Tổng 4 duplicate calls.

## Root cause #3: WorkItemsTable không virtualize

`grep` không tìm thấy `react-window` / `react-virtual` / `FixedSize` trong `work-items-table.tsx` → render full DOM. Nếu user có 200+ work items → 200 rows DOM = 50-200ms render + re-layout.

## Root cause #4: API không có pagination

`userService.getUserProfileIssues(slug, userId, params)` không gửi `limit` → backend trả full list issue (filter `state_group: backlog,unstarted,started`). Có thể payload MB.

## Tổng API calls khi load profile page (N=5 workspaces)

| Component | Calls | N=5 |
|-----------|-------|-----|
| Layout `USER_PROFILE_PROJECT_SEGREGATION` | 1 | 1 |
| Page `USER_PROFILE_DATA` | 1 | 1 |
| TodayWorkItems (×N workspaces × 3 endpoints) | 3N | 15 |
| OverdueWorkItems (×N workspaces × 3 endpoints) | 3N | 15 |
| ProfileActivity (initial + load more) | 1+ | 1 |
| Workspace-wrapper duplicates (chỉ cho current workspace) | 0 (ngầm) | 0 |
| **Tổng** | **3 + 6N** | **~33** |

→ **33 parallel HTTP calls** → Django 4-8 gunicorn workers backlog → TTFB tăng cao.
→ Mỗi call kích hoạt auth + perm check + DB queries → bottleneck server.

## Quick fixes (theo impact)

### Fix 1: Default `crossWorkspaces = false` ⭐⭐⭐
**Effort:** 2 phút | **Impact:** -80% calls cho user multi-workspace

```ts
// today-work-items.tsx:41 + overdue-work-items.tsx:41
const [crossWorkspaces, setCrossWorkspaces] = useState(false); // ✅ chỉ workspace hiện tại
```

User vẫn toggle ON khi cần xem cross-workspace. Mặc định nhanh hơn nhiều.

### Fix 2: Reuse projects/states từ workspace store ⭐⭐⭐
**Effort:** 30 phút | **Impact:** -2 calls/workspace cho current workspace, có thể -2N nếu cache shared

```ts
// thay vì:
const projects = await projectService.getProjectsLite(slug);
const states = await stateService.getWorkspaceStates(slug);

// dùng:
const { joinedProjectIds, projectMap } = useProject(); // current workspace
const { workspaceStates } = useProjectState(); // current workspace
// + fallback fetch chỉ cho workspace KHÁC current
```

### Fix 3: Add `limit` cho user-issues endpoint ⭐⭐
**Effort:** 5 phút frontend, có thể cần backend support | **Impact:** payload nhẹ + render nhanh

```ts
const filterParams = {
  assignees: uid,
  state_group: "backlog,unstarted,started",
  order_by: "target_date",
  limit: 100, // ✅ thêm
};
```

Cần verify backend support `limit` query param. Nếu không, defer Fix 4.

### Fix 4: Virtualize WorkItemsTable ⭐⭐
**Effort:** 1-2 giờ | **Impact:** render nhanh nếu >100 items

Dùng `@tanstack/react-virtual` (đã có `@tanstack/react-table`). Wrap row container.

### Fix 5: Gộp Today + Overdue thành 1 endpoint backend ⭐
**Effort:** 1-2 giờ (backend) | **Impact:** giảm half số calls

Endpoint mới: `/api/workspaces/{slug}/user-issues/{userId}/timeline/?date=YYYY-MM-DD` trả về `{ today: [...], overdue: [...] }` trong 1 request.

### Fix 6: Defer Today/Overdue khi tab không active
**Effort:** 30 phút | **Impact:** giảm initial render

Profile page có nhiều section. Today/Overdue có thể đặt sau Workload chart, lazy mount khi scroll vào view (`IntersectionObserver`) → giảm initial blocking.

## Đề xuất triển khai

### Phase A — Quick wins (2 giờ)

1. ✅ Fix 1 (default cross=false) — 2 phút
2. ✅ Fix 2 (reuse store data) — 30 phút
3. ✅ Fix 3 (limit param) — 5 phút + verify backend
4. ⏸ Fix 4 (virtualize) — 1 giờ nếu cần (verify số items thực tế trước)

→ Expected: 33 calls → ~7-9 calls (giảm ~75%), TTFB giảm tương ứng.

### Phase B — Backend gộp endpoint (1-2 giờ, optional)

5. Fix 5 (timeline endpoint) — nếu vẫn slow sau Phase A.

## File code cụ thể (cho dev)

| File | Sửa |
|------|-----|
| `apps/web/ce/components/profile/today-work-items.tsx` | line 41: `useState(false)` |
| `apps/web/ce/components/profile/overdue-work-items.tsx` | line 41: `useState(false)` |
| `apps/web/ce/components/profile/today-work-items.tsx` | line 64-72: thay `getProjectsLite` + `getWorkspaceStates` bằng store |
| `apps/web/ce/components/profile/overdue-work-items.tsx` | line 64-72: tương tự |
| `apps/web/ce/components/profile/today-work-items.tsx` | line 62: thêm `limit: 100` vào filterParams |
| `apps/web/ce/components/profile/overdue-work-items.tsx` | line 62: tương tự |

DRY note: 2 file gần giống hệt nhau (~150 LOC mỗi file × 2). Có thể refactor thành 1 component `WorkItemsSection` với prop `mode: "today" | "overdue"`. Đây là technical debt cần xử lý sau.

## Câu hỏi chưa giải quyết

- User Shinhan thường có bao nhiêu workspace? Nếu chỉ 1-2 thì impact Fix 1 nhỏ. Cần đo baseline trên LAN nội bộ.
- Số items trung bình của work-items table? Nếu <50 items thì Fix 4 (virtualize) không cần thiết (YAGNI).
- Backend `getUserProfileIssues` có support `limit` query param không? Cần grep `apps/api/plane/app/views/user.py` hoặc tương tự.
- Có muốn em implement Phase A trong session sau không?
