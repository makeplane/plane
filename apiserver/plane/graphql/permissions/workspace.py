# python imports
from typing import Any, Optional

# Third-Party Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.permission import BasePermission
from strawberry.types import Info

# Local Imports
from plane.db.models import WorkspaceMember, Page
from plane.ee.models import PageUser
from plane.graphql.utils.error_codes import ERROR_CODES
from plane.graphql.utils.roles import Roles
from plane.graphql.helpers import is_shared_page_feature_flagged_async

# Permission Mappings
Admin = 20
Member = 15
Viewer = 10
Guest = 5


class IsAuthenticated(BasePermission):
    message = "User is not authenticated"
    error_extensions = {
        "code": "UNAUTHENTICATED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHENTICATED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        if info.context.user is None:
            return False
        self.user = info.context.user
        return self.user.is_authenticated


class WorkspaceBasePermission(IsAuthenticated):
    message = "User does not have permission to access this workspace"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
            return False

        return await sync_to_async(
            WorkspaceMember.objects.filter(
                workspace__slug=kwargs.get("slug"), member=self.user, is_active=True
            ).exists,
            thread_sensitive=True,
        )()


class WorkspaceMemberPermission(IsAuthenticated):
    message = "Workspace admins or members can perform this action"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
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
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        # First, check if the user is authenticated by calling the parent class's method
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
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


# Workspace Member permission
class WorkspacePermission(IsAuthenticated):
    message = "User does not have permission to perform this action"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    roles = [Roles.ADMIN, Roles.MEMBER, Roles.GUEST]

    def __init__(self, roles: Optional[list[str]] = None):
        if roles:
            self.roles = roles

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
            return False

        allowed_roles = [role.value for role in self.roles]

        user = info.context.user
        user_id = str(user.id)
        workspace_slug = kwargs.get("slug")

        return await sync_to_async(
            WorkspaceMember.objects.filter(
                member=user_id,
                workspace__slug=workspace_slug,
                is_active=True,
                role__in=allowed_roles,
            ).exists,
            thread_sensitive=True,
        )()


# Workspace Shared Page permission
class WorkspaceSharedPagePermission(IsAuthenticated):
    message = "User does not have permission to perform this action"
    error_extensions = {
        "code": "UNAUTHORIZED",
        "statusCode": ERROR_CODES["USER_NOT_AUTHORIZED"],
    }

    async def has_permission(self, source: Any, info: Info, **kwargs) -> bool:
        if not await super().has_permission(source, info, **kwargs):
            self.message = IsAuthenticated.message
            self.error_extensions = IsAuthenticated.error_extensions
            return False

        user = info.context.user
        user_id = str(user.id)
        workspace_slug = kwargs.get("slug")
        page_id = kwargs.get("page")

        page = await sync_to_async(
            Page.objects.filter(
                workspace__slug=workspace_slug,
                id=page_id,
                
            ).first,
            thread_sensitive=True,
        )()

        # check if page exists
        if not page:
            return False

        page_access = page.access
        page_owned_by_id = str(page.owned_by_id)

        # check if page is public
        if page_access == 0:
            return True

        # check if page is private and owned by user
        if page_access == 1 and page_owned_by_id == user_id:
            return True

        # check if shared pages feature flag is enabled
        is_feature_flagged = await is_shared_page_feature_flagged_async(
            user_id=user_id,
            workspace_slug=workspace_slug,
            raise_exception=False,
        )

        if not is_feature_flagged:
            return False

        # check if page is shared with user
        page_can_be_accessed = await sync_to_async(
            PageUser.objects.filter(
                workspace__slug=workspace_slug,
                page_id=page_id,
                user_id=user_id,
            ).exists,
            thread_sensitive=True,
        )()

        return page_can_be_accessed
