# Phase 02: Backend bulk endpoint

**Priority:** P0 | **Status:** TODO | **Effort:** 2-3 giờ | **Owner:** backend dev

## Context

Implement endpoint `GET /api/users/me/work-items/?period={today|overdue}&workspace_slug={optional}` theo spec [phase-01](phase-01-design-spec.md).

## Files to create / modify

**Create:**
- `apps/api/plane/app/views/user/work_items.py` — `UserWorkItemsTimelineEndpoint`
- `apps/api/plane/app/serializers/user/work_items.py` — response serializer (nếu cần custom shape)
- `apps/api/plane/tests/views/user/test_work_items.py` — unit tests

**Modify:**
- `apps/api/plane/app/views/user/__init__.py` — export endpoint
- `apps/api/plane/app/urls/user.py` — add route

**Reference (no change):**
- `apps/api/plane/app/views/workspace/user.py:100-...` — `WorkspaceUserProfileIssuesEndpoint` (logic mẫu)
- `apps/api/plane/db/models/issue.py` — Issue model + manager

## Implementation

### 1. View

```python
# apps/api/plane/app/views/user/work_items.py
from django.db.models import F, Q, Subquery, OuterRef, Func, Sum
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.db.models import (
    Issue, IssueLink, IssueWorkLog, FileAsset, CycleIssue,
    Workspace, WorkspaceMember, Project, State, IssueLabel,
    MainTaskCategory, SubTaskCategory,
)


PERIOD_TODAY = "today"
PERIOD_OVERDUE = "overdue"
ALLOWED_PERIODS = {PERIOD_TODAY, PERIOD_OVERDUE}
ITEM_CAP = 500


class UserWorkItemsTimelineEndpoint(BaseAPIView):
    """Cross-workspace user work items aggregator (today | overdue)."""

    permission_classes = [IsAuthenticated]  # session auth, scope = self only

    def get(self, request):
        period = request.GET.get("period", PERIOD_TODAY)
        if period not in ALLOWED_PERIODS:
            return Response(
                {"error": f"period must be one of {ALLOWED_PERIODS}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        scope_slug = request.GET.get("workspace_slug")
        today = timezone.now().date()
        user = request.user

        # Workspaces user là active member
        ws_qs = WorkspaceMember.objects.filter(member=user, is_active=True)
        if scope_slug:
            ws_qs = ws_qs.filter(workspace__slug=scope_slug)
        member_workspace_ids = list(ws_qs.values_list("workspace_id", flat=True))

        if not member_workspace_ids:
            return Response({"items": [], "lookups": self._empty_lookups(),
                             "meta": {"total": 0, "capped": False, "cache_hit": False}})

        # Base filter
        qs = Issue.issue_objects.filter(
            assignees__in=[user.id],
            workspace_id__in=member_workspace_ids,
            project__project_projectmember__member=user,
            project__project_projectmember__is_active=True,
            state__group__in=["backlog", "unstarted", "started"],
        )

        # Period filter
        if period == PERIOD_TODAY:
            qs = qs.filter(Q(start_date__lte=today) | Q(start_date__isnull=True))
        elif period == PERIOD_OVERDUE:
            qs = qs.filter(target_date__lt=today)  # __lt skip nulls naturally

        # Annotations (preserve from old endpoint)
        qs = self._apply_annotations(qs)

        # Order + cap
        qs = qs.order_by("target_date").distinct()[: ITEM_CAP + 1]
        items_list = list(qs)
        capped = len(items_list) > ITEM_CAP
        items_list = items_list[:ITEM_CAP]

        # Bulk lookups
        ws_ids = {i.workspace_id for i in items_list}
        proj_ids = {i.project_id for i in items_list if i.project_id}
        state_ids = {i.state_id for i in items_list if i.state_id}
        main_cat_ids = {i.main_task_category_id for i in items_list if i.main_task_category_id}
        sub_cat_ids = {i.sub_task_category_id for i in items_list if i.sub_task_category_id}

        lookups = {
            "workspaces": {
                str(w.id): {"id": str(w.id), "slug": w.slug, "name": w.name}
                for w in Workspace.objects.filter(id__in=ws_ids)
            },
            "projects": {
                str(p.id): {"id": str(p.id), "name": p.name, "identifier": p.identifier}
                for p in Project.objects.filter(id__in=proj_ids)
            },
            "states": {
                str(s.id): {"id": str(s.id), "name": s.name, "color": s.color, "group": s.group}
                for s in State.objects.filter(id__in=state_ids)
            },
            "categories": {
                "main": {
                    str(c.id): {"id": str(c.id), "name": c.name}
                    for c in MainTaskCategory.objects.filter(id__in=main_cat_ids)
                },
                "sub": {
                    str(c.id): {"id": str(c.id), "name": c.name}
                    for c in SubTaskCategory.objects.filter(id__in=sub_cat_ids)
                },
            },
        }

        # Items serialize (use existing IssueSerializer or simple dict)
        items_data = [self._serialize_item(i) for i in items_list]

        return Response({
            "items": items_data,
            "lookups": lookups,
            "meta": {
                "total": len(items_data),
                "capped": capped,
                "cache_hit": False,
            },
        })

    def _apply_annotations(self, issues):
        """Match annotations of existing WorkspaceUserProfileIssuesEndpoint.apply_annotations."""
        return (
            issues.annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True)
                    .values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                total_logged_minutes=Subquery(
                    IssueWorkLog.objects.filter(issue_id=OuterRef("id"))
                    .values("issue_id")
                    .annotate(total=Sum("duration_minutes"))
                    .values("total")[:1]
                )
            )
            .prefetch_related("assignees", "labels", "issue_module__module")
        )

    def _serialize_item(self, issue):
        """Lean serializer matching frontend EnrichedIssue type."""
        return {
            "id": str(issue.id),
            "name": issue.name,
            "sequence_id": issue.sequence_id,
            "project_id": str(issue.project_id) if issue.project_id else None,
            "state_id": str(issue.state_id) if issue.state_id else None,
            "workspace_id": str(issue.workspace_id),
            "main_task_category_id": str(issue.main_task_category_id) if issue.main_task_category_id else None,
            "sub_task_category_id": str(issue.sub_task_category_id) if issue.sub_task_category_id else None,
            "start_date": issue.start_date.isoformat() if issue.start_date else None,
            "target_date": issue.target_date.isoformat() if issue.target_date else None,
            "assignee_ids": [str(a.id) for a in issue.assignees.all()],
            "label_ids": [str(l.id) for l in issue.labels.all()],
            "module_ids": [str(m.module_id) for m in issue.issue_module.all()],
            "cycle_id": str(issue.cycle_id) if issue.cycle_id else None,
            "link_count": issue.link_count or 0,
            "attachment_count": issue.attachment_count or 0,
            "sub_issues_count": issue.sub_issues_count or 0,
            "total_logged_minutes": issue.total_logged_minutes or 0,
        }

    def _empty_lookups(self):
        return {"workspaces": {}, "projects": {}, "states": {},
                "categories": {"main": {}, "sub": {}}}
```

### 2. URL

```python
# apps/api/plane/app/urls/user.py — append
from plane.app.views.user import UserWorkItemsTimelineEndpoint

urlpatterns += [
    path(
        "users/me/work-items/",
        UserWorkItemsTimelineEndpoint.as_view(),
        name="user-work-items-timeline",
    ),
]
```

### 3. Tests

```python
# apps/api/plane/tests/views/user/test_work_items.py
class UserWorkItemsTimelineTest(BaseAPITestCase):
    def test_today_period_returns_assigned_issues(self): ...
    def test_overdue_period_filters_target_date_lt_today(self): ...
    def test_cross_workspace_returns_all_member_workspaces(self): ...
    def test_workspace_slug_param_scopes_single_ws(self): ...
    def test_excludes_completed_cancelled_state(self): ...
    def test_cap_500_items(self): ...
    def test_lookups_complete_for_returned_items(self): ...
    def test_unauthorized_returns_401(self): ...
    def test_inactive_membership_excluded(self): ...
    def test_invalid_period_returns_400(self): ...
```

## Performance considerations

### DB Indexes (verify đã có)

```sql
-- Issue
CREATE INDEX IF NOT EXISTS issue_assignees_idx ON issue_assignees(assignee_id);
CREATE INDEX IF NOT EXISTS issue_workspace_idx ON issues(workspace_id);
CREATE INDEX IF NOT EXISTS issue_state_idx ON issues(state_id);
CREATE INDEX IF NOT EXISTS issue_target_date_idx ON issues(target_date);
CREATE INDEX IF NOT EXISTS issue_start_date_idx ON issues(start_date);

-- WorkspaceMember
CREATE INDEX IF NOT EXISTS ws_member_user_active_idx ON workspace_members(member_id, is_active);
```

Verify với `\d+ issues` trong psql sau migration. Nếu thiếu — add migration.

### Query plan target

EXPLAIN ANALYZE expected:
- WorkspaceMember filter: index scan
- Issue filter cross-workspace: index scan on `(workspace_id, state_id)` composite
- Annotations subquery: kept fast với `[:1]` + `count_filter`
- Total < 100ms cho user có 50 ws và 200 issues

### N+1 prevention

`prefetch_related("assignees", "labels", "issue_module__module")` đã có. Verify với `django.db.connection.queries` trong test.

## Acceptance criteria Phase 02

- [ ] Endpoint trả response đúng spec phase-01
- [ ] All tests pass (>= 10 test cases)
- [ ] Logic preserve: items giống endpoint cũ (so sánh diff)
- [ ] EXPLAIN ANALYZE cho query <100ms p95 trên DB sample
- [ ] N+1 free (≤5 queries cho 1 request)
- [ ] OpenAPI/Swagger doc updated nếu có

## Risks

| Risk | Mitigation |
|------|-----------|
| Query không dùng index | EXPLAIN ANALYZE + add index nếu cần |
| Edge case state_group sai | Verify với prod data: `SELECT DISTINCT group FROM states;` |
| Memory với cap 500 + annotations | `iterator()` nếu cần, hoặc serializer streaming |

## Next

→ Phase 03 (Redis cache wrap endpoint) + Phase 04 (frontend integrate parallel)
