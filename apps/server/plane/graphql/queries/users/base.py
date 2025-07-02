# Python Standard Library Imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import UserFavorite, UserRecentVisit
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import IsAuthenticated, WorkspaceBasePermission
from plane.graphql.types.users import UserFavoriteType, UserRecentVisitType, UserType
from plane.graphql.utils.timezone.user import user_timezone_converter


@strawberry.type
class UserQuery:
    @strawberry.field(extensions=[PermissionExtension(permissions=[IsAuthenticated()])])
    async def user(self, info: Info) -> UserType:
        return info.context.user


# user favorite
@strawberry.type
class UserFavoritesQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def userFavorites(
        self, info: Info, slug: str, limit: Optional[int] = None
    ) -> list[UserFavoriteType]:
        user = info.context.user
        user_id = str(user.id)

        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id,
            workspace_slug=slug,
        )
        favorites = await sync_to_async(list)(
            UserFavorite.objects.filter(user=user, workspace__slug=slug)
            .filter(
                Q(parent__isnull=True),
                Q(project__isnull=True)
                | (Q(project__isnull=False) & Q(project_teamspace_filter.query)),
                ~Q(entity_type="view"),
            )
            .order_by("-created_at")
            .distinct()
        )

        if limit:
            favorites = favorites[:limit]

        return favorites


# user recent visits
@strawberry.type
class UserRecentVisitQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def userRecentVisit(
        self, info: Info, slug: str, limit: Optional[int] = None
    ) -> list[UserRecentVisitType]:
        user = info.context.user
        user_id = str(user.id)

        recent_visits = await sync_to_async(
            lambda: list(
                UserRecentVisit.objects.filter(workspace__slug=slug, user_id=user_id)
                .exclude(entity_name__in=["view", "workspace_page"])
                .order_by("-visited_at")
            )
        )()

        recent_visits = [
            UserRecentVisitType(
                id=visit.id,
                entity_identifier=visit.entity_identifier
                if visit.entity_identifier
                else None,
                entity_name=visit.entity_name if visit.entity_name else None,
                user=visit.user_id if visit.user_id else None,
                visited_at=await user_timezone_converter(
                    user, visit.visited_at if visit.visited_at else None
                ),
                workspace=visit.workspace_id if visit.workspace_id else None,
                project=visit.project_id if visit.project_id else None,
                created_by=visit.created_by_id if visit.created_by_id else None,
                updated_by=visit.updated_by_id if visit.updated_by_id else None,
                created_at=await user_timezone_converter(
                    user, visit.created_at if visit.created_at else None
                ),
                updated_at=await user_timezone_converter(
                    user, visit.updated_at if visit.updated_at else None
                ),
                deleted_at=await user_timezone_converter(
                    user, visit.deleted_at if visit.deleted_at else None
                ),
            )
            for visit in recent_visits
        ]

        recent_visits = [
            visit for visit in recent_visits if visit.entity_data is not None
        ]

        return recent_visits[:limit] if limit else recent_visits
