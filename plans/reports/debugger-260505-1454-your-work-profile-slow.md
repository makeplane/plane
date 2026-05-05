# Debug Report — Profile "Your Work" page chậm

**Date:** 2026-05-05 14:54 ICT
**URL:** `http://localhost/shinhan-bank-vn/profile/9cb20d7a-5ea9-44f0-8d77-782619c4547e/`
**User:** leduong12c@gmail.com (target = same user)
**Branch:** develop
**Method:** /ck-debug systematic — Phase 1 RCI → Pattern → Hypothesis → Evidence

---

## TL;DR

- **Đúng — query "hết workspace info của user" CHÍNH LÀ nguyên nhân.** Nhưng KHÔNG phải backend chậm; mỗi endpoint chỉ ~70ms. Bottleneck là **frontend fan-out** ở 2 CE component `TodayWorkItems` + `OverdueWorkItems` lặp `Promise.all` qua TẤT CẢ workspace của user (default `crossWorkspaces=true`).
- User có **100 workspaces** → mỗi component bắn **100 × 3 calls** (`user-issues` + `projects` + `states`) → **600 HTTP request mỗi page load**. Browser HTTP/1.1 chỉ song song 6/origin → wall-time ~10–25s.
- Không có endpoint nào single-slow; vấn đề thuần **N+1 ở tầng client**.

---

## Evidence — Đo từ Django access log thực tế

Aggregated từ `docker logs planeso-api-1 --since 60m` (1 user, 2 lần load page):

| Endpoint                 |   Calls | Avg ms | Max ms | p95 ms | **Total wall-CPU** |
| ------------------------ | ------: | -----: | -----: | -----: | -----------------: |
| `user-issues/{userId}`   | **400** |     75 |    218 |    121 |          **30.0s** |
| `projects/` (lite)       | **402** |     24 |    151 |     36 |               9.6s |
| `states/`                | **402** |     20 |    123 |     34 |               8.0s |
| `user-stats/{userId}`    |       2 |     68 |    103 |    103 |              0.14s |
| `user-profile/{userId}`  |       2 |     56 |     85 |     85 |              0.11s |
| `user-activity/{userId}` |       2 |     87 |    125 |    125 |              0.17s |
| `users/me/workspaces/`   |       2 |     89 |    143 |    143 |              0.18s |

→ Per ONE page load: ~600 calls, ~24s tổng CPU backend, **wall ~10–25s** trên browser tuỳ HTTP version.

DB: 100 workspaces, 26 projects ở `shinhan-bank-vn`, 106 issues. Backend xử lý từng call rất nhanh (8–10 SQL/call) — không có slow query.

---

## API Call Waterfall (1 page load)

### Layer A — Auth/me (~5 calls, ~250ms total) — OK

```
GET /api/users/me/                 10ms
GET /api/users/me/profile/         23ms
GET /api/users/me/settings/        25ms
GET /api/users/me/workspaces/      35ms (returns 100 workspaces)
GET /api/users/me/workspaces/shinhan-bank-vn/project-roles/  53ms
```

### Layer B — Profile page core (~5 calls, ~400ms) — OK

```
GET /api/workspaces/shinhan-bank-vn/user-profile/{userId}/   56ms  ← layout.tsx useSWR
GET /api/workspaces/shinhan-bank-vn/user-stats/{userId}/     68ms  ← page.tsx useSWR
GET /api/workspaces/shinhan-bank-vn/user-activity/{userId}/  87ms  ← ProfileActivity
GET /api/workspaces/shinhan-bank-vn/members/                182ms
GET /api/workspaces/shinhan-bank-vn/labels/                  34ms
```

### Layer C — CE fan-out ⚠️ (600 calls, dominates wall-time)

**`<TodayWorkItems>`** + **`<OverdueWorkItems>`** mỗi component:

```
for slug in 100 workspaces:               # crossWorkspaces=true (default)
  Promise.all([
    GET /api/workspaces/{slug}/user-issues/{userId}/?...   ~75ms
    GET /api/workspaces/{slug}/projects/                   ~24ms
    GET /api/workspaces/{slug}/states/                     ~20ms
  ])
```

= 100 × 3 × 2 components = **600 HTTP requests**.

---

## Root Cause Analysis

### #1 — CROSS-WORKSPACE FAN-OUT (primary, ~95% of latency)

**File:** `apps/web/ce/components/profile/today-work-items.tsx:41–96`
**File:** `apps/web/ce/components/profile/overdue-work-items.tsx:41–93`

```ts
const [crossWorkspaces, setCrossWorkspaces] = useState(true);   // ← default ON
const allWorkspaceSlugs = Object.values(workspaces ?? {}).map((ws) => ws.slug);
const workspaceSlugsToFetch = crossWorkspaces ? allWorkspaceSlugs : [...];

const results = await Promise.all(
  workspaceSlugsToFetch.map(async (slug) => {
    const [issuesResponse, projects, states] = await Promise.all([
      userService.getUserProfileIssues(slug, uid, filterParams),
      projectService.getProjectsLite(slug),
      stateService.getWorkspaceStates(slug),
    ]);
    ...
  })
);
```

Vấn đề:

1. Default `crossWorkspaces=true` → fan-out NGAY khi mở page, không user-opt-in.
2. Không cache cross-component: 2 component fetch lặp y hệt `projects` + `states` cho cùng workspace → 200 calls thừa.
3. Không `limit`/`pagination` per-workspace — mỗi call user-issues vẫn chạy full annotation (subquery cycle, link, attachment, sub-issues, worklog).
4. Không degrade gracefully: `OverdueWorkItems` chỉ cần issue có `target_date < today`, nhưng filter này chạy ở client → server vẫn trả về toàn bộ.
5. SWR key dùng `sortedSlugs.join(",")` → key length ~3000 chars cho 100 workspace, mỗi lần `workspaces` map thay đổi sẽ invalidate.

### #2 — N+1 trên backend `WorkspaceUserProfileEndpoint` (secondary)

**File:** `apps/api/plane/app/views/workspace/user.py:294–387`

4 `Count(filter=Q(...))` annotation lồng nhau trên `Project`, mỗi cái join `project_issue` + `assignees` (m2m) + `state`. Postgres dùng `COUNT(*) FILTER (WHERE ...)` nên chấp nhận được, nhưng:

- 3/4 annotation thiếu `project_issue__parent__isnull=True` (chỉ `assigned_issues` line 327 có) → **đếm cả sub-task** → số sai + scan thêm rows.
- Không filter `project_issue__deleted_at__isnull=True` ở level join → join hết bag rồi filter, không tận dụng partial index nếu có.

Hiện tại endpoint vẫn nhanh (~56ms với 26 project) vì data nhỏ. Khi workspace có 100+ project hoặc 10k+ issue thì sẽ degrade nhanh. **Không phải bottleneck hiện tại**, nhưng tích sẵn debt.

### #3 — `WorkspaceUserProfileStatsEndpoint` — 8 query tuần tự (low priority)

**File:** `apps/api/plane/app/views/workspace/user.py:416–541`

8 query riêng lẻ (state/priority distribution + 4 `count()` + cycle queries). Tổng ~68ms. Có thể gộp vào 1–2 query với `CASE WHEN`. Hiện tại OK nhưng nên refactor cùng lần sau.

---

## Trả lời câu hỏi user

> **"Có phải query hết các workspace info của user làm chậm không?"**

**Đúng — nhưng ở tầng FRONTEND, không phải backend.** Cụ thể:

- ❌ KHÔNG phải `WorkspaceUserProfileEndpoint` query "tất cả workspace" — nó chỉ query 1 workspace hiện tại (~56ms).
- ✅ ĐÚNG là `TodayWorkItems` + `OverdueWorkItems` (CE override, có thể do team SHBVN tự thêm) **chủ động loop qua 100 workspace của user và gọi 3 API mỗi cái**, sinh 600 request → trình duyệt nghẽn → page hiển thị chậm.

---

## Recommendations (ưu tiên impact/effort)

### P0 — Tắt mặc định cross-workspace fan-out (5 phút, 90% impact)

File: `apps/web/ce/components/profile/today-work-items.tsx:41`, `overdue-work-items.tsx:41`

```ts
- const [crossWorkspaces, setCrossWorkspaces] = useState(true);
+ const [crossWorkspaces, setCrossWorkspaces] = useState(false);
```

User vẫn có thể bật toggle nếu muốn xem all-workspaces. Giảm 600 → ~6 calls.

### P1 — Thêm endpoint backend `/users/me/work-items/today/` aggregate cross-workspace (2–4h, đúng cách)

Một endpoint duy nhất nhận `cross_workspaces=true`, server JOIN tất cả workspace user là member → trả 1 response. Tránh hoàn toàn fan-out client-side.

Pattern: `apps/api/plane/app/views/user/` — thêm `UserCrossWorkspaceWorkItemsEndpoint(BaseAPIView)`, queryset:

```python
Issue.issue_objects.filter(
    assignees=request.user,
    workspace__workspace_member__member=request.user,
    workspace__workspace_member__is_active=True,
    state__group__in=['backlog','unstarted','started'],
    # for OverdueWorkItems: target_date__lt=today
).select_related('workspace','project','state').prefetch_related('assignees','labels')
```

### P2 — Dedupe `projects/` + `states/` calls giữa Today + Overdue (1h)

Cùng `workspaceSlug` → cùng response. Lift fetch lên parent hoặc dùng SWR key shared:

```ts
useSWR(`PROJECTS_LITE_${slug}`, () => projectService.getProjectsLite(slug)); // SWR sẽ dedupe
```

### P3 — Backend: fix N+1 `WorkspaceUserProfileEndpoint` (30 phút, future-proof)

File: `apps/api/plane/app/views/workspace/user.py:310–360`

- Thêm `project_issue__parent__isnull=True` cho 3 annotation còn thiếu (line 311, 335, 347).
- Cân nhắc cache projects-with-counts với key `(workspace_id, user_id, viewer_id)` TTL 60s — page profile thường refresh.

### P4 — `WorkspaceUserProfileStatsEndpoint` — gộp 4 count thành 1 query với CASE (1h, gentle)

---

## Verification Plan

Sau khi áp P0:

1. Reload page profile, check Django log:
   ```bash
   docker logs planeso-api-1 --since 1m | grep user-issues | wc -l
   ```
   Kỳ vọng: ~6 calls (1 workspace × 3 endpoints × 2 components) thay vì 600.
2. Browser DevTools Network panel: total requests dropping từ ~700 xuống ~30, DOMContentLoaded từ ~15s xuống <2s.

---

## Unresolved Questions

1. CE components `TodayWorkItems` / `OverdueWorkItems` có phải team SHBVN tự thêm không? Nếu có spec yêu cầu cross-workspace mặc định ON → cần thảo luận lại với product (toggle off-by-default vẫn giữ feature).
2. User có thực sự cần xem work items cross-workspace ở profile của ai khác (`profile/{userId}/`), hay chỉ "my profile"? Nếu chỉ self-profile → có thể giới hạn fan-out chỉ khi `userId === currentUser.id`.
3. Có khả năng dedupe SWR key bằng `useSWRImmutable` cho `projects/states` (data thay đổi rất ít trong session) không?
