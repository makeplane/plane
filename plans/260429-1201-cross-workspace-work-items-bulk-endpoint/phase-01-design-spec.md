# Phase 01: Design spec — Logic preservation

**Priority:** P0 (blocker cho Phase 02 + 04) | **Status:** TODO | **Effort:** 30 phút

## Goal

Lock contract (request + response) + đảm bảo migrate KHÔNG break logic hiện tại của TodayWorkItems + OverdueWorkItems.

## Logic hiện tại (cần preserve)

### TodayWorkItems

**Source:** `apps/web/ce/components/profile/today-work-items.tsx`

- Backend filter (line 62):
  ```ts
  { assignees: uid, state_group: "backlog,unstarted,started", order_by: "target_date" }
  ```
- Frontend post-filter (line 99-103):
  - `state.group NOT IN [completed, cancelled]`
  - `start_date <= today` (or null)
- Frontend enrich:
  - `_workspaceSlug`, `_workspaceName` từ workspace lookup
  - `_project` (name + identifier) từ project lookup
  - `_state` (name + color + group) từ state lookup
  - `_mainCategoryName`, `_subCategoryName` từ taskCategoryStore (BUG: chỉ có current ws)

### OverdueWorkItems

**Source:** `apps/web/ce/components/profile/overdue-work-items.tsx`

- Backend filter: GIỐNG TodayWorkItems
- Frontend post-filter (line 97-100):
  - `state.group NOT IN [completed, cancelled]`
  - **`target_date` MUST exist**
  - `target_date < today` (overdue)
- Frontend enrich: GIỐNG TodayWorkItems

### Workspace scope

- `crossWorkspaces=true` (default): tất cả workspace user là active member
- `crossWorkspaces=false`: chỉ current `workspaceSlug`

### Backend scope hiện tại

`apps/api/plane/app/views/workspace/user.py:155` — `WorkspaceUserProfileIssuesEndpoint`:
- Filter `assignees__in=[user_id] OR created_by_id=user_id OR issue_subscribers__subscriber_id=user_id` ⚠️
  - **KHÁC** với frontend chỉ pass `assignees=uid` → response có cả issues created/subscribed nhưng frontend filter `state_group` đã restrict → trùng khớp trong thực tế
- Workspace member check: `project__project_projectmember__member=request.user` AND `is_active=True`
- Annotations: `cycle_id`, `link_count`, `attachment_count`, `sub_issues_count`, `total_logged_minutes`, `main_task_category_name`, `sub_task_category_name`
- prefetch: `assignees`, `labels`, `issue_module__module`

→ Endpoint mới phải preserve các annotations + prefetch này.

## Contract đề xuất (LOCK trước khi Phase 02 + 04)

### Request

```http
GET /api/users/me/work-items/?period=today&workspace_slug=<optional>
```

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `period` | enum | yes | `today` \| `overdue` |
| `workspace_slug` | string | no | Nếu có → scope 1 workspace. Nếu không → cross-workspace. |

**Auth:** session-authenticated (giống endpoint hiện tại). Lấy `user_id` từ `request.user.id` (KHÔNG nhận từ URL — security default).

### Response (200 OK)

```json
{
  "items": [
    {
      "id": "...",
      "name": "...",
      "sequence_id": 123,
      "project_id": "...",
      "state_id": "...",
      "assignee_ids": ["..."],
      "start_date": "2026-04-29",
      "target_date": "2026-04-30",
      "main_task_category_id": "...",
      "sub_task_category_id": "...",
      "main_task_category_name": "Engineering",
      "sub_task_category_name": "Backend",
      "workspace_id": "...",
      "workspace_slug": "shinhan-bank-vn",
      "workspace_name": "Shinhan Bank VN",
      "cycle_id": "...",
      "link_count": 0,
      "attachment_count": 1,
      "sub_issues_count": 0,
      "total_logged_minutes": 60,
      "label_ids": ["..."],
      "module_ids": ["..."]
    }
  ],
  "lookups": {
    "workspaces": {"<ws_id>": {"id": "...", "slug": "...", "name": "..."}},
    "projects": {"<proj_id>": {"id": "...", "name": "...", "identifier": "..."}},
    "states": {"<state_id>": {"id": "...", "name": "...", "color": "...", "group": "..."}},
    "categories": {
      "main": {"<cat_id>": {"id": "...", "name": "..."}},
      "sub": {"<cat_id>": {"id": "...", "name": "..."}}
    }
  },
  "meta": {
    "total": 47,
    "capped": false,
    "cache_hit": true
  }
}
```

### Filter logic backend (cần áp dụng)

```python
today = timezone.now().date()
qs = Issue.issue_objects.filter(
    assignees__in=[request.user.id],  # CHỈ assignees (đơn giản hóa, KHÔNG break vì frontend luôn filter assignees)
    workspace_id__in=member_workspace_ids,  # active member
    project__project_projectmember__member=request.user,
    project__project_projectmember__is_active=True,
    state__group__in=["backlog", "unstarted", "started"],  # exclude completed/cancelled ngay tại BE
)

if period == "today":
    qs = qs.filter(
        Q(start_date__lte=today) | Q(start_date__isnull=True),
        # KHÔNG filter target_date — frontend hiện tại không filter target cho today
    )
elif period == "overdue":
    qs = qs.filter(target_date__lt=today)
    # frontend hiện tại require target_date exists → BE filter ngầm vì lt operator skip null
```

→ Frontend post-filter có thể BỎ vì BE đã làm.

### Sort

`order_by("target_date")` — nulls last (Postgres default). Same logic.

### Cap items

`[:500]` server-side. Trả `meta.capped: true` nếu vượt → frontend show banner.

## Decisions cần lock

| Decision | Choice | Lý do |
|----------|--------|-------|
| URL pattern | `/api/users/me/work-items/` | RESTful, namespace `users/me/` đã có sẵn |
| user_id source | `request.user.id` (không từ URL) | Security: user chỉ xem work items của chính mình |
| `assignees + created_by + subscribed`? | CHỈ `assignees` | Logic frontend hiện tại chỉ assignees |
| State group filter ở đâu? | Backend (excl completed+cancelled) | Giảm payload + đơn giản FE |
| Period as query vs path? | Query (`?period=today`) | Linh hoạt, dễ extend `next-week`, `this-month` sau |
| Single endpoint cho today + overdue, hay 2 calls riêng? | **2 calls riêng** với cùng endpoint khác param | KISS, dễ cache riêng từng period |
| Lookups response shape | Nested object map (Map<id, obj>) | O(1) lookup frontend |
| Pagination? | Cap `[:500]` + `meta.capped` | YAGNI — 500 đủ cho 99% user |

## Acceptance criteria Phase 01

- [ ] Contract đã lock (file này approved)
- [ ] Backend dev confirm có thể implement
- [ ] Frontend dev confirm contract đủ data render UI cũ
- [ ] List "differences from current" được document
- [ ] Migration risk identified

## Differences from current (audit list)

1. **`created_by` + `subscribed` issues**: BE cũ trả về, BE mới KHÔNG. Frontend không dùng → an toàn bỏ.
2. **State group filter**: chuyển từ FE → BE. Test edge case: nếu state.group = "started" nhưng có sub-state custom với group khác → cần verify.
3. **Today filter `start_date <= today`**: chuyển FE → BE.
4. **Overdue filter `target_date < today AND target_date IS NOT NULL`**: chuyển FE → BE (`__lt` skip null).
5. **Categories** trong response (lookup) — fix bug current.
6. **Cap 500 items**: limit mới — verify thực tế user có >500 không (có thể cao trong tổ chức 100 ws).
7. **`workspace_slug` query param**: replace logic `crossWorkspaces=false` của FE.

## Câu hỏi review trước khi implement

- Backend dev: Có objection gì với contract này?
- Mobile/third-party clients có dùng endpoint cũ `workspaces/<slug>/user-issues/<user_id>/` không? Nếu có → giữ song song.
- Cap 500 có đủ không? Cần check `SELECT COUNT(*) FROM issues WHERE assignee_id = max_user_id GROUP BY user_id ORDER BY count DESC LIMIT 5;`

## Next

→ Phase 02 (backend implement) + Phase 04 (frontend refactor) parallel.
