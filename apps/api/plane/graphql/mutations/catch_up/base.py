# Third-Party Imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.utils import timezone

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.types import Info

# Module Imports
from plane.db.models import Notification
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.catch_up import CatchUpTypeEnum


def mark_as_read_async(notification_ids: list[str]) -> bool:
    try:
        Notification.objects.filter(id__in=notification_ids).update(
            read_at=timezone.now()
        )
        return True
    except Exception:
        return False


def get_notification_ids(
    workspace_slug: str, user_id: str, type_id: Optional[str] = None
) -> Optional[list[str]]:
    # Teamspace Filter
    project_teamspace_filter = project_member_filter_via_teamspaces(
        user_id=user_id, workspace_slug=workspace_slug
    )

    notification_query = (
        Notification.objects.filter(project_teamspace_filter.query)
        .filter(workspace__slug=workspace_slug)
        .filter(receiver_id=user_id)
        .filter(read_at__isnull=True)
    )

    if type_id is not None:
        notification_query = notification_query.filter(entity_identifier=type_id)

    notification_ids = notification_query.values_list("id", flat=True)

    return notification_ids if len(notification_ids) > 0 else None


@sync_to_async
def mark_notification_ids_async(
    workspace_slug: str,
    user_id: str,
    type_id: Optional[str] = None,
    type: Optional[CatchUpTypeEnum] = None,
) -> bool:
    try:
        if type is None:
            notification_ids = get_notification_ids(
                workspace_slug=workspace_slug,
                user_id=user_id,
                type_id=type_id,
            )

            if notification_ids is None:
                return False

            is_marked = mark_as_read_async(notification_ids=notification_ids)

            return is_marked

        if type in [
            CatchUpTypeEnum.WORK_ITEM,
            CatchUpTypeEnum.EPIC,
            CatchUpTypeEnum.INTAKE,
        ]:
            notification_ids = get_notification_ids(
                workspace_slug=workspace_slug,
                user_id=user_id,
                type_id=type_id,
            )

            if notification_ids is None:
                return False

            is_marked = mark_as_read_async(notification_ids=notification_ids)

            return is_marked

    except Exception:
        return False


@strawberry.type
class CatchUpMarkAsReadMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def catch_up_mark_as_read(
        self,
        info: Info,
        slug: str,
        type_id: str,
        type: Optional[CatchUpTypeEnum] = CatchUpTypeEnum.WORK_ITEM,
    ) -> bool:
        user = info.context.user
        user_id = str(user.id)

        is_marked = await mark_notification_ids_async(
            workspace_slug=slug, user_id=user_id, type_id=type_id, type=type
        )

        return is_marked

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def catch_up_mark_all_as_read(self, info: Info, slug: str) -> bool:
        user = info.context.user
        user_id = str(user.id)

        is_marked = await mark_notification_ids_async(
            workspace_slug=slug, user_id=user_id
        )

        return is_marked
