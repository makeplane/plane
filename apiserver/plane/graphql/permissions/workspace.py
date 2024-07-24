# python imports
from typing import Any

# Third-Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.contrib.auth import get_user

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import BasePermission

# Local Imports
from plane.db.models import WorkspaceMember

# Permission Mappings
Admin = 20
Member = 15
Viewer = 10
Guest = 5


class IsAuthenticated(BasePermission):
    message = "User is not authenticated"

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        self.user = await sync_to_async(get_user, thread_sensitive=True)(
            info.context.request
        )
        return self.user.is_authenticated


class WorkspaceBasePermission(IsAuthenticated):
    message = "User does not have permission to access this workspace"

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            return False

        return await sync_to_async(
            WorkspaceMember.objects.filter(
                workspace__slug=kwargs.get("slug"),
                member=self.user,
                is_active=True,
            ).exists,
            thread_sensitive=True,
        )()


class WorkspaceMemberPermission(IsAuthenticated):

    message = "Workspace admins or members can perform this action"

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            return False

        return await sync_to_async(
            WorkspaceMember.objects.filter(
                workspace__slug=kwargs.get("slug"),
                member=self.user,
                role__in=[Admin, Member],
                is_active=True,
            ).exists,
            thread_sensitive=True,
        )()


class WorkspaceAdminPermission(IsAuthenticated):
    message = "Only workspace admins can perform this action"

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            return False

        return await sync_to_async(
            WorkspaceMember.objects.filter(
                workspace__slug=kwargs.get("slug"),
                member=self.user,
                role=Admin,
                is_active=True,
            ).exists,
            thread_sensitive=True,
        )()
