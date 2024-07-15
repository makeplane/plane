# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Django Imports
from django.db.models import Exists, OuterRef
from django.utils import timezone

# Module Imports
from plane.graphql.types.notification import NotificationType
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.db.models import (
    Issue,
    Notification,
    IssueAssignee,
    IssueSubscriber,
    WorkspaceMember,
)

# Typing Imports
from typing import Optional


@strawberry.type
class NotificationQuery:

    @strawberry.field(
        extensions=[
            PermissionExtension(permissions=[WorkspaceBasePermission()])
        ]
    )
    async def notifications(
        self,
        info: Info,
        slug: str,
        type: Optional[str] = "all",
        snoozed: Optional[bool] = None,
        archived: Optional[bool] = None,
        read: Optional[str] = None,
    ) -> list[NotificationType]:

        notifications = await sync_to_async(list)(
            Notification.objects.filter(
                workspace__slug=slug,
                project__project_projectmember__member=info.context.user,
                project__project_projectmember__is_active=True,
                receiver_id=info.context.user.id,
            )
            .select_related("workspace", "project", "triggered_by", "receiver")
            .order_by("snoozed_till", "-created_at")
        )

        if snoozed is not None:
            now = timezone.now()
            if snoozed:
                notifications = [
                    n
                    for n in notifications
                    if n.snoozed_till
                    and n.snoozed_till < now
                    or n.snoozed_till is not None
                ]
            else:
                notifications = [
                    n
                    for n in notifications
                    if n.snoozed_till
                    and n.snoozed_till >= now
                    or n.snoozed_till is None
                ]

        if archived is not None:
            if archived:
                notifications = [
                    n for n in notifications if n.archived_at is not None
                ]
            else:
                notifications = [
                    n for n in notifications if n.archived_at is None
                ]

        if read is not None:
            if read == "true":
                notifications = [
                    n for n in notifications if n.read_at is not None
                ]
            elif read == "false":
                notifications = [n for n in notifications if n.read_at is None]

        # Subscribed issues
        if type == "watching":
            issue_ids = await sync_to_async(list)(
                IssueSubscriber.objects.filter(
                    workspace__slug=slug, subscriber_id=info.context.user.id
                )
                .annotate(
                    created=Exists(
                        Issue.objects.filter(
                            created_by=info.context.user,
                            pk=OuterRef("issue_id"),
                        )
                    )
                )
                .annotate(
                    assigned=Exists(
                        IssueAssignee.objects.filter(
                            pk=OuterRef("issue_id"), assignee=info.context.user
                        )
                    )
                )
                .filter(created=False, assigned=False)
                .values_list("issue_id", flat=True)
            )
            notifications = [
                notification
                for notification in notifications
                if notification.entity_identifier in issue_ids
            ]

        # Assigned Issues
        if type == "assigned":
            issue_ids = await sync_to_async(list)(
                IssueAssignee.objects.filter(
                    workspace__slug=slug, assignee_id=info.context.user.id
                ).values_list("issue_id", flat=True)
            )
            notifications = [
                notification
                for notification in notifications
                if notification.entity_identifier in issue_ids
            ]

        # Created issues
        if type == "created":
            has_permission = await sync_to_async(
                WorkspaceMember.objects.filter(
                    workspace__slug=slug,
                    member=info.context.user,
                    role__lt=15,
                    is_active=True,
                ).exists
            )()

            if has_permission:
                notifications = []
            else:
                issue_ids = await sync_to_async(list)(
                    Issue.objects.filter(
                        workspace__slug=slug, created_by=info.context.user
                    ).values_list("pk", flat=True)
                )
                notifications = [
                    notification
                    for notification in notifications
                    if notification.entity_identifier in issue_ids
                ]
        return notifications
