# Phase 3: Backend -- Extended Spreadsheet Data

## Context

- `ViewIssueListSerializer`: `apps/api/plane/app/serializers/view.py` (already returns `completed_at`)
- `WorkspaceViewIssuesViewSet`: `apps/api/plane/app/views/view/base.py`
- Issue links: `apps/api/plane/db/models/issue.py` (`IssueLink` model)
- Worklogs: `apps/api/plane/db/models/worklog.py`

## Overview

Ensure the workspace view issues API returns all data needed for the 16-column spreadsheet. `completed_at` is already included. Need to add `issue_link` data and worklog totals to the response or provide batch endpoints.

## Requirements

1. `completed_at` -- already in `ViewIssueListSerializer` (line 30) -- verified
2. Issue links -- list of `{url, title}` per issue for reference-link column
3. Worklog total minutes per issue for total-log-time column

## Architecture

### Option A: Annotate in list serializer (chosen for worklogs)

Add `total_logged_minutes` annotation to `WorkspaceViewIssuesViewSet.apply_annotations()` using a Subquery on IssueWorkLog model.

### Option B: Lazy-load via separate endpoint (chosen for links)

<!-- Updated: Validation Session 2 - Confirmed lazy-load via IntersectionObserver, no backend annotation -->

Issue links can be numerous. Frontend lazy-loads per issue **only when row scrolls into viewport** (IntersectionObserver), using existing `GET /issues/{id}/links/` endpoint. No backend changes needed.

## Related Files

- `apps/api/plane/app/views/view/base.py` -- `apply_annotations()`
- `apps/api/plane/app/serializers/view.py` -- `ViewIssueListSerializer`
- `apps/api/plane/db/models/issue.py` -- `IssueLink`
- Worklog model (grep for `IssueWorkLog` or `Worklog`)

## Implementation Steps

### 3.1 Add worklog annotation

- In `WorkspaceViewIssuesViewSet.apply_annotations()`, add:

```python
from django.db.models import Sum
.annotate(
    total_logged_minutes=Subquery(
        IssueWorkLog.objects.filter(issue=OuterRef("id"))
        .values("issue")
        .annotate(total=Sum("duration_in_minutes"))
        .values("total")[:1]
    )
)
```

- Add `total_logged_minutes` to `ViewIssueListSerializer.to_representation()`

### 3.2 Verify completed_at

- Already present in serializer (line 30) -- no changes needed

### 3.3 Issue links strategy

- Frontend will use existing per-issue links endpoint
- No backend changes; lazy-load in `reference-link-column.tsx`

### 3.4 Add `total_logged_minutes` to TIssue type

- Add optional `total_logged_minutes?: number` to `TIssue` in `packages/types/src/issues/issue.ts`

## Todo

- [ ] Add worklog annotation to `apply_annotations()`
- [ ] Add `total_logged_minutes` to serializer output
- [ ] Add `total_logged_minutes` to `TIssue` type
- [ ] Verify `IssueWorkLog` model location and import

## Success Criteria

- View issues API returns `total_logged_minutes` per issue
- `completed_at` confirmed in response
- No N+1 queries (annotation via Subquery)

## Risk Assessment

- **Performance**: Subquery annotation is O(1) per row, acceptable
- **Missing worklog model**: need to verify exact model name/location

## Security Considerations

- Worklog data respects existing project membership permissions (inherits from ViewSet)

## Next Steps

Phase 4: build frontend column components
