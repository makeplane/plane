# Phase 2: Backend -- Extended Spreadsheet Data (Project Scope)

## Context

- `IssueSerializer` / `ProjectIssueViewSerializer`: `apps/api/plane/app/serializers/issue/` (check which is used for project views)
- `ProjectViewIssuesViewSet`: `apps/api/plane/app/views/view/base.py`
- Issue links: `apps/api/plane/db/models/issue.py` (`IssueLink` model)
- Worklogs: `apps/api/plane/db/models/worklog.py` (or similar)
- **Reference**: workspace plan Phase 3 already added `total_logged_minutes` annotation to `WorkspaceViewIssuesViewSet` — verify if `ProjectViewIssuesViewSet` shares the same `apply_annotations()` base or needs its own

## Overview

Ensure the project view issues API returns all data needed for the 14-column spreadsheet. `completed_at` is likely already included. Need to confirm worklog annotation is also applied to the **project** view issues endpoint.

## Requirements

1. `completed_at` — verify present in project view issues serializer
2. `total_logged_minutes` — verify annotation in `ProjectViewIssuesViewSet.apply_annotations()`
3. Issue links — lazy-loaded per row via existing per-issue endpoint (no backend change)

## Architecture

### Check if annotation already exists

The workspace plan added `total_logged_minutes` to `WorkspaceViewIssuesViewSet.apply_annotations()`. Check if:

- Both ViewSets share a base class with the annotation — **if yes, no change needed**
- Or they have separate `apply_annotations()` — **if yes, must add to `ProjectViewIssuesViewSet` too**

### Option A: Shared base class (preferred, no change needed)

If `WorkspaceViewIssuesViewSet` and `ProjectViewIssuesViewSet` share `BaseViewSet.apply_annotations()`, the annotation is already present for project views.

### Option B: Separate ViewSets (add annotation)

Add `total_logged_minutes` Subquery to `ProjectViewIssuesViewSet.apply_annotations()`:

```python
from django.db.models import Subquery, OuterRef, Sum
.annotate(
    total_logged_minutes=Subquery(
        IssueWorkLog.objects.filter(issue=OuterRef("id"))
        .values("issue")
        .annotate(total=Sum("duration_in_minutes"))
        .values("total")[:1]
    )
)
```

### Links strategy (same as workspace plan)

Frontend lazy-loads per issue using `GET /issues/{id}/links/` — no backend change needed.

## Related Files

- `apps/api/plane/app/views/view/base.py` — ProjectViewIssuesViewSet + apply_annotations()
- `apps/api/plane/app/serializers/view.py` — serializer used for project view issues
- `packages/types/src/issues/issue.ts` — TIssue type (may already have `total_logged_minutes?` from workspace plan)

## Implementation Steps

### 2.1 Verify `completed_at` in project view issues serializer

- Check serializer output for `GET /projects/{id}/views/{viewId}/issues/`
- If missing, add `completed_at` to serializer fields

### 2.2 Verify `total_logged_minutes` annotation in ProjectViewIssuesViewSet

- Grep `apply_annotations` in `base.py` for project ViewSet
- If already in base class → done
- If separate → add Subquery annotation (see above)

### 2.3 Verify `TIssue` type

- `total_logged_minutes?: number` should already exist from workspace plan
- If missing, add to `packages/types/src/issues/issue.ts`

## Todo

- [ ] Grep `ProjectViewIssuesViewSet.apply_annotations()` for `total_logged_minutes`
- [ ] Add annotation if missing
- [ ] Verify `completed_at` in project view issues response
- [ ] Verify `total_logged_minutes` in `TIssue` type

## Post-Phase Checklist

- [ ] `GET /api/v1/workspaces/{slug}/projects/{id}/views/{viewId}/issues/` returns `total_logged_minutes`
- [ ] `GET` response includes `completed_at` field
- [ ] No N+1 queries (annotation via Subquery, not per-row call)

## Success Criteria

- Project view issues API returns `total_logged_minutes` per issue
- `completed_at` confirmed in response
- No extra backend endpoints added

## Risk Assessment

- **Low risk**: mostly verification. Only adds annotation if truly missing.
- **Null worklog**: Subquery returns null if no worklogs — frontend must handle gracefully

## Security Considerations

- Annotation inherits existing project membership permissions from ViewSet authentication

## Next Steps

Phase 3: build frontend column components (5 CE columns)
