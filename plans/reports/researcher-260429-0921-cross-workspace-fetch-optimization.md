# Báo cáo: Tối ưu cross-workspace fetch trong Profile (50 workspaces)

**Context:** User Shinhan có ~50 workspaces, default `crossWorkspaces=true` cần giữ.
**Hiện trạng:** Mỗi lần mở profile → **300+ API calls** (TodayWorkItems 3×50 + OverdueWorkItems 3×50).

## Review code hiện tại — chưa tối ưu

### Issue 1: Backend endpoint scope 1 workspace
`apps/api/plane/app/views/workspace/user.py:155` — `WorkspaceUserProfileIssuesEndpoint`:
```python
issue_queryset = Issue.issue_objects.filter(
    workspace__slug=slug,  # ← scope cứng 1 workspace
    project__project_projectmember__member=request.user,
)
```
→ KHÔNG hỗ trợ cross-workspace. Frontend phải loop call.

### Issue 2: Frontend Promise.all spam Django
`today-work-items.tsx:64-72`:
```ts
const results = await Promise.all(
  workspaceSlugsToFetch.map(async (slug) => {
    const [issues, projects, states] = await Promise.all([
      userService.getUserProfileIssues(slug, uid, filterParams),  // 50 calls
      projectService.getProjectsLite(slug),                        // 50 calls
      stateService.getWorkspaceStates(slug),                       // 50 calls
    ]);
  })
);
```
- 150 HTTP calls đồng thời → Django gunicorn (4-8 workers) backlog → 6-8 lượt batch
- HTTP/2 multiplex KHÔNG cứu được vì backend serial workers
- Mỗi response heavy với annotations (cycle, links, attachments, sub_issues, worklog) — `apply_annotations` query DB nặng

### Issue 3: Lookup workspace O(N²)
`today-work-items.tsx:67`:
```ts
const ws = Object.values(workspaces ?? {}).find((w) => w.slug === slug);
```
Loop 50 workspaces × `find` (linear) = O(2500). Nên dùng `Map<slug, workspace>` lookup O(1).

### Issue 4: Bug ngầm — categories chỉ fetch current workspace
`today-work-items.tsx:51-53`:
```ts
useEffect(() => {
  if (workspaceSlug) void taskCategoryStore.fetchCategories(workspaceSlug.toString());
}, [workspaceSlug]); // ← chỉ current
```
→ Items từ 49 workspaces khác có `main_task_category_id` nhưng category name lookup miss → UI hiển thị empty.

### Issue 5: Cùng pattern duplicate ở Today + Overdue
2 file ~150 LOC mỗi cái, gần giống hệt nhau. DRY violation. Mỗi fix phải sửa 2 chỗ.

### Issue 6: API không pagination → payload lớn
50 workspaces × N issues mỗi workspace → có thể MB JSON. Filter frontend chỉ làm UI list nhỏ → lãng phí transfer.

## 3 phương án + ROI

### ⭐⭐⭐ Phương án A — Backend bulk endpoint (RECOMMENDED)

**Effort:** 3-4 giờ (1 backend dev + 1 frontend dev)
**Impact:** 300 calls → **1 call** (-99.7%)

**Backend mới:**
```python
# apps/api/plane/app/views/user/work_items.py (NEW)
class UserWorkItemsTimelineEndpoint(BaseAPIView):
    """Cross-workspace user work items aggregator."""

    def get(self, request):
        period = request.GET.get("period", "today")  # today | overdue
        user_id = request.user.id
        today = timezone.now().date()

        # Workspaces user là active member
        member_workspace_ids = WorkspaceMember.objects.filter(
            member=request.user, is_active=True
        ).values_list("workspace_id", flat=True)

        # Single query cross-workspace
        qs = Issue.issue_objects.filter(
            assignees__in=[user_id],
            workspace_id__in=member_workspace_ids,
            project__project_projectmember__member=request.user,
            project__project_projectmember__is_active=True,
            state__group__in=["backlog", "unstarted", "started"],
        )
        if period == "today":
            qs = qs.filter(Q(start_date__lte=today) | Q(start_date__isnull=True),
                           ~Q(target_date__lt=today))
        elif period == "overdue":
            qs = qs.filter(target_date__lt=today)

        qs = qs.select_related("workspace", "project", "state").order_by("target_date")[:500]  # cap

        # Bulk lookups
        workspaces = {w.id: {"id": w.id, "slug": w.slug, "name": w.name}
                      for w in Workspace.objects.filter(id__in=member_workspace_ids)}
        # categories: bulk fetch all main + sub categories qua workspace_ids

        return Response({
            "items": IssueSerializer(qs, many=True).data,
            "workspace_lookup": workspaces,
            "project_lookup": {...},  # bulk fetch projects of touched workspaces
            "state_lookup": {...},    # bulk fetch states
            "category_lookup": {...}, # bulk fetch categories
        })
```

**URL:** `path("users/me/work-items/", UserWorkItemsTimelineEndpoint.as_view())`

**Frontend mới:**
```ts
// today-work-items.tsx + overdue-work-items.tsx → gộp thành 1 component WorkItemsSection
const { data } = useSWR(
  userId ? `WORK_ITEMS_${period}` : null,
  () => workItemsService.getTimeline({ period }),
  { revalidateIfStale: false }
);
// data.items với lookup maps đã sẵn → render trực tiếp, KHÔNG cần loop workspace
```

**Pros:**
- 1 call thay 150 cho mỗi component (today + overdue = 2 calls tổng)
- Backend làm 1 query DB optimized (single JOIN), index workspace_id
- Lookup maps trả sẵn → frontend không cần fetch projects/states/categories rời
- Fix luôn Issue 4 (categories cross-workspace)
- Có thể server-side cache Redis 30s key=`user_work_items:{user_id}:{period}:{date}`

**Cons:**
- Cần backend dev support
- Endpoint mới — phải thêm tests, permission check, security review

### ⭐⭐ Phương án B — Frontend batching + store reuse (mitigation)

**Effort:** 1 giờ | **Impact:** ~60% giảm calls (vẫn nhiều)

```ts
import pLimit from "p-limit";  // hoặc tự viết simple semaphore
const limit = pLimit(5);  // tối đa 5 concurrent requests

const results = await Promise.all(
  workspaceSlugsToFetch.map((slug) =>
    limit(() => userService.getUserProfileIssues(slug, uid, filterParams))
  )
);
```
- Bỏ `getProjectsLite` + `getWorkspaceStates` — dùng store đã cache (cho current workspace) hoặc skip lookup cho cross-workspace items (chỉ show workspace name + project_id raw)
- Concurrency limit 5 → Django nhận 5 calls đồng thời thay 50 → workers không bị flood
- Workspace lookup dùng Map O(1)

**Pros:**
- Không cần backend
- Triển khai nhanh

**Cons:**
- Vẫn 50 calls user-issues → vẫn chậm (5-10 giây cho 50 workspaces ngay cả với batching)
- Server bandwidth + DB connections vẫn cao
- KHÔNG fix root cause

### ⭐ Phương án C — Server-side cache (combine với A hoặc B)

**Effort:** 30 phút Django | **Impact:** -90% load DB cho calls tiếp theo

```python
# decorator cache trên endpoint
from django.core.cache import cache

def get(self, request, slug, user_id):
    cache_key = f"user_issues:{slug}:{user_id}:{date.today()}"
    cached = cache.get(cache_key)
    if cached:
        return Response(cached)
    # ... compute
    cache.set(cache_key, data, 30)  # 30s TTL
    return Response(data)
```

→ Lần đầu vẫn slow, lần sau nhanh. Hữu ích nếu user reload nhiều lần / điều hướng tới-lui.

## Khuyến nghị triển khai

**Best path** (3-5 giờ tổng):

1. **Phase A1** — Backend tạo `UserWorkItemsTimelineEndpoint` + Redis cache (3 giờ backend dev)
2. **Phase A2** — Frontend gộp Today+Overdue thành `WorkItemsSection`, gọi 1 endpoint (1 giờ FE)
3. **Phase A3** — Fix Map lookup O(1), add `limit` cap server-side (15 phút)

**Quick mitigation while waiting** (nếu backend chưa available):
- Phase B (concurrency limit 5) — 1 giờ FE — tạm giảm flood, đợi Phase A

**Benchmark expected** (LAN nội bộ Shinhan, 50 workspaces):
- Hiện tại: ~10-20 giây load profile (300 calls + render)
- Sau Phase A: ~500-800ms (1 query bulk + render với data sẵn)
- Sau Phase A + cache: ~200-400ms (cache hit)

## Bug ngầm cần fix kèm

**Issue 4** — categories chỉ fetch current workspace nhưng items render từ cross-workspace → category name empty:
```ts
// Sau Phase A, response đã có category_lookup → fix luôn
// Trước Phase A (mitigation): 
useEffect(() => {
  workspaceSlugsToFetch.forEach((slug) => 
    taskCategoryStore.fetchCategories(slug)
  );
}, [workspaceSlugsToFetch]);  // 50 fetch categories thêm! NOT good
```
→ Bug này CHỈ fix được clean qua Phase A (backend trả category_lookup).

## DRY refactor đề xuất

Sau Phase A, gộp 2 file:
```
apps/web/ce/components/profile/work-items-section.tsx  (NEW)
  ↑ accept prop `period: "today" | "overdue"`
  
apps/web/ce/components/profile/today-work-items.tsx    (DELETE)
apps/web/ce/components/profile/overdue-work-items.tsx  (DELETE)
```
~150 LOC duplicate → ~80 LOC shared component.

## Câu hỏi chưa giải quyết

- Anh có quyền sửa backend Django (Phase A) không? Hay chỉ frontend?
- 50 workspaces là số ổn định hay đang tăng? Nếu 100+ thì Phase B chắc chắn không scale.
- Backend hiện có Redis cache infrastructure không? (Em thấy có `plane-redis` container, nhưng cần verify Django settings có cache backend)
- Có muốn em viết PR cho Phase B (mitigation) trong khi đợi backend Phase A không?
