# Phase 1: Backend — User Daily Worklog Total Endpoint

**Priority**: High | **Status**: Pending | **Effort**: Small

## Overview

Create a lightweight endpoint returning the current user's total logged minutes for today across all workspaces. No pagination, no grouping — just a single integer.

## Key Insights

- Existing `WorkspaceWorkLogSummaryEndpoint` is workspace-scoped and returns heavy payload (by_member, by_issue)
- We need cross-workspace total for current user only → new simple endpoint
- `IssueWorkLog` model has `logged_by`, `duration_minutes`, `logged_at` fields
- `logged_at` is a DateField (YYYY-MM-DD)

## Architecture

```
GET /api/users/me/daily-worklog-total/?tz=Asia/Saigon
→ { "total_minutes": 345, "date": "2026-03-25" }
```

- Auth: any authenticated user (no role check needed — user queries own data)
- Filter: `logged_by=request.user`, `logged_at=today_in_user_tz`
- `tz` query param: IANA timezone string (e.g., `Asia/Saigon`). Falls back to UTC if missing/invalid.
- Single `aggregate(Sum("duration_minutes"))` query

<!-- Updated: Validation Session 1 - timezone-aware date computation via ?tz= param -->

## Related Code Files

**Modify:**

- `apps/api/plane/app/urls/user.py` — add URL pattern
- `apps/api/plane/app/views/__init__.py` — export new view (if needed)

**Create:**

- `apps/api/plane/app/views/user/daily_worklog.py` — new view (verify `user/` subdir exists first; create with `__init__.py` if missing)

<!-- Updated: Validation Session 2 - check views/user/ subdirectory before creating file -->

**Reference:**

- `apps/api/plane/app/views/workspace/time_tracking/summary.py` — pattern reference
- `apps/api/plane/db/models/worklog.py` — IssueWorkLog model

## Implementation Steps

1. Check if `apps/api/plane/app/views/user/` directory exists. If not, create it with an empty `__init__.py`.

2. Create `apps/api/plane/app/views/user/daily_worklog.py`:

   ```python
   from datetime import datetime
   from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
   from django.db.models import Sum
   from rest_framework.response import Response
   from rest_framework import status
   from plane.app.views.base import BaseAPIView
   from plane.db.models import IssueWorkLog

   class UserDailyWorklogTotalEndpoint(BaseAPIView):
       def get(self, request):
           tz_str = request.GET.get("tz", "UTC")
           try:
               tz = ZoneInfo(tz_str)
           except (ZoneInfoNotFoundError, KeyError):
               tz = ZoneInfo("UTC")
           today = datetime.now(tz).date()
           total = IssueWorkLog.objects.filter(
               logged_by=request.user,
               logged_at=today,
           ).aggregate(total=Sum("duration_minutes"))["total"] or 0
           return Response(
               {"total_minutes": total, "date": str(today)},
               status=status.HTTP_200_OK,
           )
   ```

3. Register URL in `apps/api/plane/app/urls/user.py`:

   ```python
   path("users/me/daily-worklog-total/", UserDailyWorklogTotalEndpoint.as_view(), name="user-daily-worklog-total"),
   ```

4. Export view from `__init__` if pattern requires it

## Todo

- [ ] Create view file `daily_worklog.py`
- [ ] Register URL pattern
- [ ] Verify endpoint returns correct data

## Success Criteria

- `GET /api/users/me/daily-worklog-total/` returns `{ total_minutes: N, date: "YYYY-MM-DD" }`
- Query scoped to current user + today only
- Response time < 50ms (single indexed query)
