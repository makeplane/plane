# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.utils import timezone

# Module Imports
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import Notification


@strawberry.type
class NotificationMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def read_notification(
        self, info: Info, slug: str, notification: strawberry.ID
    ) -> bool:
        notification = await sync_to_async(Notification.objects.get)(
            receiver=info.context.user, workspace__slug=slug, pk=notification
        )
        notification.read_at = timezone.now()
        await sync_to_async(notification.save)()
        return True

    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def mark_all_read_notification(self, info: Info, slug: str) -> bool:
        # Fetch all notifications for the user in the specified workspace
        notifications = await sync_to_async(list)(
            Notification.objects.filter(
                receiver=info.context.user, workspace__slug=slug
            )
        )

        # Update the 'read_at' field for each notification
        for notification in notifications:
            notification.read_at = timezone.now()

        # Perform a bulk update to save the changes in the database
        await sync_to_async(Notification.objects.bulk_update)(
            notifications, ["read_at"], batch_size=100
        )

        return True
