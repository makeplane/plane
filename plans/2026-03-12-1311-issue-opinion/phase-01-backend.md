# Phase 01: Backend – Model, Migration, Serializer, Views, URLs

## Overview

- **Priority**: Highest (prerequisite for all other phases)
- **Status**: Not started
- Tạo model `IssueOpinion` liên kết với `IssueActivity`, migration, serializer, view, URL

## Requirements

### Functional

- Opinion liên kết 1-to-1 với 1 `IssueActivity` row cụ thể (FK `activity`)
- Chỉ **actor của IssueActivity đó** mới được POST/PATCH opinion tương ứng
- Opinion gồm: `sentiment` (approve / neutral / reject) + `content` (text ngắn, optional)
- Upsert: 1 opinion per (activity, actor) — nếu đã tồn tại thì update, chưa có thì create
- GET per-activity: trả về opinion của actor trên row đó, visible cho ALL MEMBER/GUEST (không filter theo `request.user`)
- **Batch GET**: `GET .../issues/<issueId>/activity-opinions/` — trả về tất cả opinions của issue, keyed by `activityId`, cho mọi MEMBER/GUEST (để frontend batch-load 1 lần khi activity feed mount)
- DELETE: chỉ chủ opinion (actor) mới xoá được

<!-- Updated: Validation Session 1 - Visibility=Public; add batch GET endpoint -->

### Non-functional

- Tuân thủ `BaseViewSet`, `@allow_permission`, `workspace__slug` filter
- `select_related` để tránh N+1
- Backend enforce actor ownership (không chỉ dựa vào client-side guard)

## Related Code Files

### Tạo mới

- `apps/api/plane/db/models/opinion.py`
- `apps/api/plane/app/serializers/issue/opinion.py`
- `apps/api/plane/app/views/issue/opinion.py`

### Sửa đổi

- `apps/api/plane/db/models/__init__.py` — đăng ký `IssueOpinion`
- `apps/api/plane/app/serializers/__init__.py` — export serializer
- `apps/api/plane/app/views/__init__.py` — export view
- `apps/api/plane/app/views/issue/__init__.py` — export view
- `apps/api/plane/app/urls/issue.py` — đăng ký URL patterns

## Embedded Rules

1. **ProjectBaseModel** — opinion scoped theo project. UUID pk, workspace, project, created_by, updated_by, deleted_at được thừa kế tự động.
2. **`workspace__slug` filter** — LUÔN filter `workspace__slug=slug` trong mọi queryset để tránh data leak cross-workspace.
3. **`BaseAPIView` / `allow_permission`** — tất cả views PHẢI inherit `BaseAPIView` và dùng `@allow_permission` decorator.
4. **`select_related`** — tránh N+1: `.select_related("actor", "workspace", "project", "activity")`.
5. **Register `__init__.py`** — mọi model/serializer/view phải được export qua `__init__.py`.
6. **NEVER mix serializers** — dùng `plane/app/serializers/` (internal/session auth). Không đụng `plane/api/`.
7. **Actor ownership enforcement** — trong POST/PATCH/DELETE, kiểm tra `request.user == opinion.actor`. Trả 403 nếu vi phạm.
8. **Upsert pattern** — dùng `update_or_create(activity=activity, actor=request.user, defaults={...})`.

## Implementation Steps

### Step 1 — Model (`opinion.py`)

```python
# apps/api/plane/db/models/opinion.py
from django.conf import settings
from django.db import models
from .project import ProjectBaseModel


class IssueOpinion(ProjectBaseModel):
    """
    One opinion per actor per IssueActivity row.
    Only the actor who created the activity can post/update their opinion on it.
    """

    SENTIMENT_CHOICES = (
        ("approve", "Approve"),
        ("neutral", "Neutral"),
        ("reject", "Reject"),
    )

    activity = models.ForeignKey(
        "db.IssueActivity",
        on_delete=models.CASCADE,
        related_name="opinions",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="issue_opinions",
    )
    sentiment = models.CharField(
        max_length=20,
        choices=SENTIMENT_CHOICES,
        default="neutral",
    )
    content = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Issue Opinion"
        verbose_name_plural = "Issue Opinions"
        db_table = "issue_opinions"
        ordering = ("-created_at",)
        # 1 opinion per (activity, actor) — soft-delete aware
        constraints = [
            models.UniqueConstraint(
                fields=["activity", "actor"],
                condition=models.Q(deleted_at__isnull=True),
                name="issue_opinion_unique_activity_actor_when_not_deleted",
            )
        ]

    def __str__(self):
        return f"{self.actor} — {self.sentiment} on activity {self.activity_id}"
```

### Step 2 — Đăng ký model

Trong `apps/api/plane/db/models/__init__.py`, thêm:

```python
from .opinion import IssueOpinion
```

### Step 3 — Migration

```bash
cd apps/api
python manage.py makemigrations
```

### Step 4 — Serializer

```python
# apps/api/plane/app/serializers/issue/opinion.py
from plane.db.models import IssueOpinion
from ..base import BaseSerializer


class IssueOpinionSerializer(BaseSerializer):
    class Meta:
        model = IssueOpinion
        fields = [
            "id", "activity", "actor", "sentiment", "content",
            "created_at", "updated_at", "created_by", "updated_by",
        ]
        read_only_fields = [
            "id", "activity", "actor",
            "created_at", "updated_at", "created_by", "updated_by",
        ]
```

Thêm vào `apps/api/plane/app/serializers/__init__.py`:

```python
from .issue.opinion import IssueOpinionSerializer
```

### Step 5 — Views

```python
# apps/api/plane/app/views/issue/opinion.py
from rest_framework.response import Response
from rest_framework import status

from .. import BaseAPIView
from plane.app.permissions import allow_permission, ROLE
from plane.app.serializers import IssueOpinionSerializer
from plane.db.models import IssueActivity, IssueOpinion


class IssueOpinionEndpoint(BaseAPIView):
    """
    Scoped per activity row.
    GET  /activities/<activity_id>/opinion/   → get opinion của row này (nếu có)
    POST /activities/<activity_id>/opinion/   → upsert opinion của current user
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id, activity_id):
        opinion = IssueOpinion.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            activity_id=activity_id,
            # Chỉ trả về opinion của chính user đang request
            actor=request.user,
        ).select_related("actor", "workspace", "project", "activity").first()
        if not opinion:
            return Response(None, status=status.HTTP_204_NO_CONTENT)
        return Response(IssueOpinionSerializer(opinion).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def post(self, request, slug, project_id, issue_id, activity_id):
        # Verify activity exists và actor match
        activity = IssueActivity.objects.filter(
            pk=activity_id,
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
        ).first()
        if not activity:
            return Response({"error": "Activity not found"}, status=status.HTTP_404_NOT_FOUND)

        # Enforce: chỉ actor của activity mới được tạo opinion
        if str(activity.actor_id) != str(request.user.id):
            return Response(
                {"error": "Only the activity owner can add an opinion."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = IssueOpinionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        opinion, _ = IssueOpinion.objects.update_or_create(
            activity=activity,
            actor=request.user,
            defaults={
                "sentiment": serializer.validated_data.get("sentiment", "neutral"),
                "content": serializer.validated_data.get("content", ""),
                "workspace_id": activity.workspace_id,
                "project_id": activity.project_id,
            },
        )
        return Response(IssueOpinionSerializer(opinion).data, status=status.HTTP_200_OK)


class IssueOpinionDetailEndpoint(BaseAPIView):
    """
    DELETE /activities/<activity_id>/opinion/<pk>/
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def delete(self, request, slug, project_id, issue_id, activity_id, pk):
        opinion = IssueOpinion.objects.filter(
            pk=pk,
            workspace__slug=slug,
            project_id=project_id,
            activity_id=activity_id,
        ).first()
        if not opinion:
            return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
        if str(opinion.actor_id) != str(request.user.id):
            return Response({"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN)
        opinion.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
```

Đăng ký trong `apps/api/plane/app/views/issue/__init__.py`:

```python
from .opinion import IssueOpinionEndpoint, IssueOpinionDetailEndpoint
```

Đăng ký trong `apps/api/plane/app/views/__init__.py`:

```python
from .issue.opinion import IssueOpinionEndpoint, IssueOpinionDetailEndpoint
```

### Step 6 — URLs

Trong `apps/api/plane/app/urls/issue.py`, thêm:

```python
from plane.app.views import IssueOpinionEndpoint, IssueOpinionDetailEndpoint

urlpatterns += [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/activities/<uuid:activity_id>/opinion/",
        IssueOpinionEndpoint.as_view(),
        name="issue-activity-opinion",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/activities/<uuid:activity_id>/opinion/<uuid:pk>/",
        IssueOpinionDetailEndpoint.as_view(),
        name="issue-activity-opinion-detail",
    ),
]
```

## Batch Endpoint Addition

### `IssueOpinionListEndpoint` (batch GET)

```python
# GET /workspaces/<slug>/projects/<project_id>/issues/<issue_id>/activity-opinions/
# Returns: { "<activityId>": { ...opinion data } } for all activities in this issue

class IssueOpinionListEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id, issue_id):
        opinions = IssueOpinion.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            activity__issue_id=issue_id,
        ).select_related("actor", "workspace", "project", "activity")
        # Return as dict keyed by activityId for O(1) frontend lookup
        data = {
            str(op.activity_id): IssueOpinionSerializer(op).data
            for op in opinions
        }
        return Response(data, status=status.HTTP_200_OK)
```

URL: `path("workspaces/<str:slug>/projects/<uuid:project_id>/issues/<uuid:issue_id>/activity-opinions/", IssueOpinionListEndpoint.as_view(), name="issue-activity-opinions-list")`

Also update `IssueOpinionEndpoint.get` to remove the `actor=request.user` filter so any member can GET the actor's opinion on a specific row.

<!-- Updated: Validation Session 1 - Add batch list endpoint --></p>

## Post-Phase Checklist

- [ ] Model `IssueOpinion` có FK `activity → IssueActivity` (CASCADE)
- [ ] `UniqueConstraint(activity, actor)` — soft-delete aware
- [ ] Migration tạo thành công (`makemigrations` không lỗi)
- [ ] `workspace__slug=slug` filter có ở MỌI queryset
- [ ] `select_related("actor", "workspace", "project", "activity")` được thêm
- [ ] POST view kiểm tra `activity.actor_id == request.user.id` → 403 nếu sai
- [ ] Serializer nằm trong `plane/app/serializers/` (không phải `plane/api/`)
- [ ] Views inherit `BaseAPIView`, có `@allow_permission` decorator
- [ ] Tất cả classes được export qua `__init__.py`
- [ ] URL patterns được đăng ký đúng (nested dưới activity_id)
- [ ] GUEST chỉ có GET, không có POST/DELETE
- [ ] Batch endpoint `GET .../activity-opinions/` trả về dict keyed by activityId

## Success Criteria

- `GET /activities/<activity_id>/opinion/` trả về opinion của actor (visible to all members)
- `GET /issues/<issue_id>/activity-opinions/` trả về tất cả opinions của issue (dict keyed by activityId)
- `POST /activities/<activity_id>/opinion/` tạo/cập nhật opinion — trả 403 nếu không phải actor
- `DELETE /activities/<activity_id>/opinion/<pk>/` xoá opinion — trả 403 nếu không phải chủ
- Migration apply thành công
