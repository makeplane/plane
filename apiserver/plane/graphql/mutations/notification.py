# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.utils import timezone

# Module Imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import (
    Notification,
)


@strawberry.type
class NotificationMutation:
    @strawberry.mutation(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def read_notification(
        self,
        info: Info,
        slug: str,
        notification: strawberry.ID,
    ) -> bool:
        notification = await sync_to_async(Notification.objects.get)(
            receiver=info.context.user, workspace__slug=slug, pk=notification
        )
        notification.read_at = timezone.now()
        await sync_to_async(notification.save)()
        return True
