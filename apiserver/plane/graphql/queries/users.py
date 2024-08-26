# Third-Party Imports
import strawberry

# Python Standard Library Imports
from asgiref.sync import sync_to_async
from typing import Optional

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Module Imports
from plane.db.models import Profile, UserFavorite, UserRecentVisit
from plane.graphql.types.users import (
    UserType,
    ProfileType,
    UserFavoriteType,
    UserRecentVisitType,
)
from plane.graphql.permissions.workspace import (
    IsAuthenticated,
    WorkspaceBasePermission,
)


@strawberry.type
class UserQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def user(self, info: Info) -> UserType:
        return info.context.user


@strawberry.type
class ProfileQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def profile(self, info: Info) -> ProfileType:
        profile = await sync_to_async(Profile.objects.get)(
            user=info.context.user
        )
        return profile


# user favorite
@strawberry.type
class UserFavoritesQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def userFavorites(
        self,
        info: Info,
        slug: str,
        limit: Optional[int] = None,
    ) -> list[UserFavoriteType]:
        favorites = await sync_to_async(list)(
            UserFavorite.objects.filter(
                user=info.context.user,
                workspace__slug=slug,
            )
            .filter(
                Q(parent__isnull=True),
                Q(project__isnull=True)
                | (
                    Q(project__isnull=False)
                    & Q(
                        project__project_projectmember__member=info.context.user
                    )
                    & Q(project__project_projectmember__is_active=True)
                ),
            )
            .order_by("-created_at")
        )

        if limit:
            favorites = favorites[:limit]

        return favorites


# user recent visits
@strawberry.type
class UserRecentVisitQuery:
    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def userRecentVisit(
        self,
        info: Info,
        slug: str,
        limit: Optional[int] = None,
    ) -> list[UserRecentVisitType]:
        recent_visits = await sync_to_async(list)(
            UserRecentVisit.objects.filter(
                workspace__slug=slug, user=info.context.user
            ).order_by("-created_at")
        )

        if limit:
            recent_visits = recent_visits[:limit]

        return recent_visits
