# Phase B1: Backend User Management APIs

## Context Links

- [Admin views (reference)](../../apps/api/plane/license/api/views/admin.py)
- [Workspace views (reference)](../../apps/api/plane/license/api/views/workspace.py)
- [Admin serializers](../../apps/api/plane/license/api/serializers/admin.py)
- [License URLs](../../apps/api/plane/license/urls.py)
- [InstanceAdminPermission](../../apps/api/plane/license/api/permissions/)
- [User model](../../apps/api/plane/db/models/user.py)
- [WorkspaceMember model](../../apps/api/plane/db/models/workspace.py)

## Overview

- **Priority:** P1
- **Status:** pending
- **Description:** Create instance-admin user CRUD endpoints + add-to-workspace endpoint in `plane/license/api/`

## Key Insights

- Pattern follows `InstanceWorkSpaceEndpoint` (existing): `BaseAPIView` + `InstanceAdminPermission`
- User model: `plane.db.models.User` (Django's custom user, has `email`, `first_name`, `last_name`, `is_active`, `is_password_autoset`, `avatar`, etc.)
- WorkspaceMember model: `plane.db.models.WorkspaceMember` (FK to User + Workspace, has `role` field)
- Pagination: use `BasePaginator.paginate()` method from `BaseAPIView`
- Password: use `user.set_password()` (Django's built-in hashing) — NOT raw storage
- Search: `User.objects.filter(Q(email__icontains=q) | Q(first_name__icontains=q) | Q(last_name__icontains=q))`

## Requirements

**Functional:**

- `GET /api/instances/users/` — list all users (paginated, search by name/email)
- `POST /api/instances/users/` — create user (first_name, last_name, email, password)
- `GET /api/instances/users/<id>/` — user detail with workspace memberships
- `PATCH /api/instances/users/<id>/` — update user fields
- `POST /api/instances/users/<id>/workspaces/` — add user to workspace with role

**Non-functional:**

- All endpoints require `InstanceAdminPermission`
- Pagination consistent with workspace list endpoint
- Email uniqueness enforced

## Architecture

```
/api/instances/users/           → InstanceUserEndpoint
    GET  → list (paginated, search)
    POST → create (email, password, name)

/api/instances/users/<id>/      → InstanceUserEndpoint
    GET   → detail (+ workspace memberships)
    PATCH → update fields

/api/instances/users/<id>/workspaces/ → InstanceUserWorkspaceEndpoint
    POST → add to workspace with role
```

## Related Code Files

**Files to create:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/user.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/serializers/user.py`

**Files to modify:**

- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/views/__init__.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/api/serializers/__init__.py`
- `/Volumes/Data/SHBVN/plane.so/apps/api/plane/license/urls.py`

## Implementation Steps

### Step 1: Create serializers (`serializers/user.py`)

```python
# apps/api/plane/license/api/serializers/user.py

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.db.models import User, WorkspaceMember


class InstanceUserSerializer(BaseSerializer):
    """Serializer for listing/detail user in admin."""
    display_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "display_name",
            "avatar",
            "is_active",
            "date_joined",
            "last_login",
        ]
        read_only_fields = ["id", "date_joined", "last_login"]


class InstanceUserCreateSerializer(serializers.Serializer):
    """Serializer for creating user via admin."""
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, default="")
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value.lower()


class InstanceUserUpdateSerializer(serializers.Serializer):
    """Serializer for updating user via admin."""
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    is_active = serializers.BooleanField(required=False)


class InstanceUserWorkspaceSerializer(BaseSerializer):
    """Serializer for user's workspace memberships."""
    workspace_name = serializers.CharField(source="workspace.name", read_only=True)
    workspace_slug = serializers.CharField(source="workspace.slug", read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = [
            "id",
            "workspace",
            "workspace_name",
            "workspace_slug",
            "role",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class InstanceUserAddToWorkspaceSerializer(serializers.Serializer):
    """Serializer for adding user to workspace."""
    workspace_id = serializers.UUIDField()
    role = serializers.IntegerField(default=15)  # Default: MEMBER

    def validate_role(self, value):
        if value not in [5, 15, 20]:  # GUEST, MEMBER, ADMIN
            raise serializers.ValidationError("Role must be 5 (Guest), 15 (Member), or 20 (Admin).")
        return value
```

### Step 2: Create views (`views/user.py`)

```python
# apps/api/plane/license/api/views/user.py

from django.db.models import Q

from rest_framework import status
from rest_framework.response import Response

from plane.db.models import User, Workspace, WorkspaceMember
from plane.license.api.permissions import InstanceAdminPermission
from plane.license.api.views.base import BaseAPIView
from plane.license.api.serializers.user import (
    InstanceUserSerializer,
    InstanceUserCreateSerializer,
    InstanceUserUpdateSerializer,
    InstanceUserWorkspaceSerializer,
    InstanceUserAddToWorkspaceSerializer,
)


class InstanceUserEndpoint(BaseAPIView):
    """CRUD for users in instance admin."""

    permission_classes = [InstanceAdminPermission]

    def get(self, request, pk=None):
        if pk:
            return self._detail(request, pk)
        return self._list(request)

    def _list(self, request):
        """GET /api/instances/users/ — paginated list with search."""
        queryset = User.objects.all().order_by("-date_joined")

        search = request.query_params.get("search", "").strip()
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search)
                | Q(first_name__icontains=search)
                | Q(last_name__icontains=search)
                | Q(display_name__icontains=search)
            )

        is_active = request.query_params.get("is_active")
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == "true")

        return self.paginate(request=request, queryset=queryset, controller=self, serializer_cls=InstanceUserSerializer)

    def _detail(self, request, pk):
        """GET /api/instances/users/<pk>/ — detail with workspace memberships."""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        user_data = InstanceUserSerializer(user).data

        memberships = WorkspaceMember.objects.filter(
            member=user, is_active=True
        ).select_related("workspace")
        user_data["workspaces"] = InstanceUserWorkspaceSerializer(memberships, many=True).data

        return Response(user_data, status=status.HTTP_200_OK)

    def post(self, request):
        """POST /api/instances/users/ — create user."""
        serializer = InstanceUserCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        user = User.objects.create(
            email=data["email"],
            first_name=data["first_name"],
            last_name=data.get("last_name", ""),
            username=data["email"],  # Plane uses email as username
        )
        user.set_password(data["password"])
        user.is_password_autoset = False
        user.save()

        return Response(
            InstanceUserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )

    def patch(self, request, pk=None):
        """PATCH /api/instances/users/<pk>/ — update user."""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InstanceUserUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        for field, value in serializer.validated_data.items():
            setattr(user, field, value)
        user.save()

        # Cascade deactivation: when user is deactivated, deactivate all workspace memberships
        if "is_active" in serializer.validated_data and not serializer.validated_data["is_active"]:
            WorkspaceMember.objects.filter(member=user, is_active=True).update(is_active=False)

        return Response(InstanceUserSerializer(user).data, status=status.HTTP_200_OK)


class InstanceUserWorkspaceEndpoint(BaseAPIView):
    """Add user to workspace."""

    permission_classes = [InstanceAdminPermission]

    def post(self, request, pk=None):
        """POST /api/instances/users/<pk>/workspaces/ — add to workspace."""
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = InstanceUserAddToWorkspaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        workspace_id = serializer.validated_data["workspace_id"]
        role = serializer.validated_data["role"]

        try:
            workspace = Workspace.objects.get(pk=workspace_id)
        except Workspace.DoesNotExist:
            return Response({"error": "Workspace not found"}, status=status.HTTP_404_NOT_FOUND)

        # Check if already a member
        membership, created = WorkspaceMember.objects.get_or_create(
            workspace=workspace,
            member=user,
            defaults={"role": role, "is_active": True},
        )

        if not created:
            if not membership.is_active:
                membership.is_active = True
                membership.role = role
                membership.save()
            else:
                return Response(
                    {"error": "User is already a member of this workspace"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        return Response(
            InstanceUserWorkspaceSerializer(membership).data,
            status=status.HTTP_201_CREATED,
        )
```

### Step 3: Register serializers in `__init__.py`

Add to `apps/api/plane/license/api/serializers/__init__.py`:

```python
from .user import (
    InstanceUserSerializer,
    InstanceUserCreateSerializer,
    InstanceUserUpdateSerializer,
    InstanceUserWorkspaceSerializer,
    InstanceUserAddToWorkspaceSerializer,
)
```

### Step 4: Register views in `__init__.py`

Add to `apps/api/plane/license/api/views/__init__.py`:

```python
from .user import InstanceUserEndpoint, InstanceUserWorkspaceEndpoint
```

### Step 5: Add URL routes (`license/urls.py`)

```python
from plane.license.api.views import (
    # ... existing imports ...
    InstanceUserEndpoint,
    InstanceUserWorkspaceEndpoint,
)

# Add to urlpatterns:
    # User management
    path("users/", InstanceUserEndpoint.as_view(), name="instance-users"),
    path("users/<uuid:pk>/", InstanceUserEndpoint.as_view(), name="instance-user-detail"),
    path(
        "users/<uuid:pk>/workspaces/",
        InstanceUserWorkspaceEndpoint.as_view(),
        name="instance-user-workspaces",
    ),
```

Full URLs will be: `/api/instances/users/`, `/api/instances/users/<id>/`, `/api/instances/users/<id>/workspaces/`

### Step 6: Verify pagination

Check if `BaseAPIView` in `plane/license/api/views/base.py` has `paginate()` method. If not, use manual pagination with `OffsetPaginator` or Django's built-in paginator:

```python
from django.core.paginator import Paginator

page = int(request.query_params.get("page", 1))
per_page = int(request.query_params.get("per_page", 20))
paginator = Paginator(queryset, per_page)
page_obj = paginator.get_page(page)

return Response({
    "results": InstanceUserSerializer(page_obj, many=True).data,
    "total_count": paginator.count,
    "total_pages": paginator.num_pages,
    "current_page": page,
    "per_page": per_page,
    "next_page": page + 1 if page_obj.has_next() else None,
})
```

<!-- Updated: Validation Session 1 - Added reset password + bulk import endpoints -->
<!-- Updated: Validation Session 2 - Cascade deactivation, no DELETE endpoint, CSV format confirmed -->
<!-- Updated: Validation Session 3 - Reset password auto-generates, bulk import skips invalid rows with summary -->

## Todo List

- [ ] Create `serializers/user.py` — 5+ serializers (include bulk import)
- [ ] Create `views/user.py` — 2+ view classes
- [ ] Add reset password endpoint: `POST /api/instances/users/<id>/reset-password/`
- [ ] Add bulk import endpoint: `POST /api/instances/users/bulk-import/` (CSV upload → parse → create users)
- [ ] Register in `serializers/__init__.py`
- [ ] Register in `views/__init__.py`
- [ ] Add 5 URL routes in `urls.py` (3 original + reset-password + bulk-import)
- [ ] Verify pagination method availability
- [ ] Test: list, create, detail, update, add to workspace, reset password, bulk import

## Success Criteria

- `GET /api/instances/users/` returns paginated user list
- `POST /api/instances/users/` creates user with hashed password
- `GET /api/instances/users/<id>/` returns user with workspace memberships
- `PATCH /api/instances/users/<id>/` updates user fields
- `POST /api/instances/users/<id>/workspaces/` adds user to workspace
- `POST /api/instances/users/<id>/reset-password/` — no request body, backend auto-generates random password, returns `{ password: "xxx" }`, sets `is_password_autoset=True`
- `POST /api/instances/users/bulk-import/` accepts CSV (first_name, last_name, email, password), skips invalid rows, returns `{ created: [...], skipped: [{ row_number, email, reason }], total_created, total_skipped }`
- `PATCH /api/instances/users/<id>/` with `is_active=false` → cascade deactivate all workspace memberships
- No DELETE endpoint — admin only toggles active/inactive
- Duplicate email → 400 error
- Non-admin → 403

## Risk Assessment

- **Pagination pattern**: may differ from workspace endpoint — check `BaseAPIView` vs `BasePaginator`
- **User model fields**: verify `display_name` is a model field (could be property)
- **WorkspaceMember creation**: ensure `company_role` or other required fields aren't missed

## Security Considerations

- All endpoints require `InstanceAdminPermission`
- Password stored hashed via `user.set_password()` (Django's PBKDF2)
- Email validated and lowercased
- Role validation: only 5, 15, 20 accepted

## Next Steps

- Phase B2: Admin UI — User List & Create
