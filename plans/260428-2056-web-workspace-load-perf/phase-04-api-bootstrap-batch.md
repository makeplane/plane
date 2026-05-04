# Phase 04: Giảm/gộp 11 API calls bootstrap

**Priority:** P1 (impact TB, effort M, đòi hỏi backend) | **Status:** TODO

## Context Links

- Report §4: 11 API calls song song khi mount workspace
- Files frontend:
  - `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx:76-128`
  - `apps/web/ce/components/workspace/content-wrapper.tsx:29-34`
  - `apps/web/ce/components/navigations/top-navigation-root.tsx:35-38`
  - `apps/web/ce/components/navigations/daily-logtime-indicator.tsx`
- Files backend (cần locate): `apps/api/plane/app/views/workspace/*.py`

## Overview

Khi user vào `/{workspaceSlug}/`, frontend phát 8 SWR + 3 thêm = 11 calls song song. Mỗi call qua Django auth + perm check. Giải pháp: tạo endpoint backend `/api/workspaces/{slug}/bootstrap/` gộp data cần thiết → 1 round-trip.

## Key Insights

- 8 calls trong workspace-wrapper là CRITICAL (block render)
- 3 calls thêm (categories, notification count, worklog total) có thể defer (chạy sau khi workspace đã render)
- Caching: nếu workspace data ít thay đổi, có thể cache server-side 30-60s → giảm load Django
- SWR `revalidateIfStale: false` đã ngăn re-fetch khi navigate nội bộ → tốt

## Requirements

### Functional
- Endpoint mới `GET /api/workspaces/{slug}/bootstrap/` trả về JSON gộp:
  ```json
  {
    "workspace_member": { ... },
    "project_permissions": { ... },
    "projects": [ ... ],
    "members": [ ... ],
    "states": [ ... ],
    "favorites": [ ... ],
    "sidebar_preferences": { ... },
    "project_navigation_preferences": { ... }
  }
  ```
- Frontend: tạo 1 SWR call mới, hydrate từng store từ response
- Giữ endpoints cũ để tương thích (admin, mobile, third-party clients)

### Non-functional
- Backend response time bootstrap <600ms p95
- Frontend bundle không tăng

## Architecture

```
Trước:
  WorkspaceWrapper mount → 8 SWR → 8 HTTP requests → 8 view handlers → 8 queries → 8 serialize
  (~ 1-3s + RTT × N)

Sau:
  WorkspaceWrapper mount → 1 SWR → 1 HTTP request → 1 view handler → parallel queries → gộp serialize
  (~ 400-800ms tổng)
```

## Related Code Files

**Backend (modify):**
- `apps/api/plane/app/views/workspace/__init__.py` (đăng ký view)
- `apps/api/plane/app/urls/workspace.py` (route)
- `apps/api/plane/app/views/workspace/bootstrap.py` (NEW)

**Frontend (modify):**
- `apps/web/core/layouts/auth-layout/workspace-wrapper.tsx` (replace 8 SWR → 1)
- `packages/services/src/workspace.service.ts` (thêm method `getBootstrap`)
- `packages/services/src/types/` (type WorkspaceBootstrapResponse)

**Defer (chuyển sang sau workspace render):**
- `ce/components/workspace/content-wrapper.tsx` (categories) — wrap useEffect deferred
- `ce/components/navigations/top-navigation-root.tsx` (unread count) — keep separate
- `ce/components/navigations/daily-logtime-indicator.tsx` — increase refresh interval 60s → 5min

## Implementation Steps

### Step 1 — Backend: tạo bootstrap view

```python
# apps/api/plane/app/views/workspace/bootstrap.py
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
# import existing serializers/queries

class WorkspaceBootstrapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, slug):
        # parallelize via thread pool nếu DB pool đủ, hoặc sequential nhanh
        return Response({
            "workspace_member": ...,
            "project_permissions": ...,
            "projects": ...,
            "members": ...,
            "states": ...,
            "favorites": ...,
            "sidebar_preferences": ...,
            "project_navigation_preferences": ...,
        })
```

### Step 2 — Backend: route

```python
# apps/api/plane/app/urls/workspace.py
path("workspaces/<str:slug>/bootstrap/", WorkspaceBootstrapView.as_view()),
```

### Step 3 — Frontend service

```ts
// packages/services/src/workspace.service.ts
async getBootstrap(slug: string): Promise<WorkspaceBootstrapResponse> {
  return this.get(`/api/workspaces/${slug}/bootstrap/`);
}
```

### Step 4 — Frontend hydrate

```tsx
// workspace-wrapper.tsx
const { data: bootstrap } = useSWR(
  workspaceSlug && currentWorkspace ? WORKSPACE_BOOTSTRAP(slug) : null,
  () => workspaceService.getBootstrap(slug),
  { revalidateIfStale: false, revalidateOnFocus: false }
);

useEffect(() => {
  if (!bootstrap) return;
  hydrateUserPermissions(bootstrap.workspace_member, bootstrap.project_permissions);
  hydrateProjects(bootstrap.projects);
  hydrateMembers(bootstrap.members);
  hydrateStates(bootstrap.states);
  hydrateFavorites(bootstrap.favorites);
  hydrateSidebarPrefs(bootstrap.sidebar_preferences, bootstrap.project_navigation_preferences);
}, [bootstrap]);
```

### Step 5 — Defer non-critical

- `daily-logtime-indicator.tsx`: `refreshInterval: 60_000` → `300_000` (5min)
- `content-wrapper.tsx` (categories): wrap trong `requestIdleCallback` hoặc `useEffect` không dependency, vì categories chỉ cần khi user mở spreadsheet

### Step 6 — Server-side cache (optional)

- Cache `bootstrap` response 30s key=`workspace_bootstrap:{slug}:{user_id}` qua Redis
- Invalidate khi workspace member/project/state thay đổi (signals)

## Todo List

- [ ] Backend: tạo `WorkspaceBootstrapView` + route
- [ ] Backend: viết test cho endpoint
- [ ] Frontend: thêm method `getBootstrap` vào service
- [ ] Frontend: type `WorkspaceBootstrapResponse`
- [ ] Frontend: refactor `workspace-wrapper.tsx` từ 8 SWR → 1
- [ ] Frontend: defer categories fetch + tăng refresh interval worklog
- [ ] Verify: 11 calls → 2-3 calls trong Network tab
- [ ] Regression test: tất cả store hydrate đúng (projects, members, states, favorites, …)
- [ ] (Optional) Redis cache bootstrap response

## Success Criteria

- Critical workspace API calls: 8 → 1
- TTFB bootstrap <600ms p95
- Workspace landing page interactive thấp hơn ≥30% so với baseline
- Không regression: store data đầy đủ, sidebar/projects/members hiển thị bình thường

## Risks

- Endpoint bootstrap to → response payload lớn → mitigate: chỉ trả field cần thiết, không nest deep
- Backwards compat: giữ endpoints cũ
- Race condition khi hydrate nhiều store cùng lúc → wrap trong `runInAction`

## Security

- Endpoint mới phải có cùng permission check như endpoints cũ (workspace member only)
- Mỗi nhánh data trong response phải tôn trọng visibility (vd: `projects` chỉ list project user có quyền)

## Next

→ Phase 05 (measurement)
