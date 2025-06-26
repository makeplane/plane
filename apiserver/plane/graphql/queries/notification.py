# Python Imports
from typing import Optional

# Third-Party Imports
import strawberry
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Exists, OuterRef, Q
from django.utils import timezone

# Strawberry Imports
from strawberry.permission import PermissionExtension
from strawberry.scalars import JSON
from strawberry.types import Info

# Module Imports
from plane.db.models import (
    Issue,
    IssueAssignee,
    IssueSubscriber,
    Notification,
    WorkspaceMember,
)
from plane.graphql.helpers.teamspace import project_member_filter_via_teamspaces_async
from plane.graphql.permissions.workspace import WorkspaceBasePermission
from plane.graphql.types.notification import NotificationType
from plane.graphql.types.paginator import PaginatorResponse
from plane.graphql.utils.paginator import paginate


@strawberry.type
class NotificationQuery:
    @strawberry.field(
        extensions=[PermissionExtension(permissions=[WorkspaceBasePermission()])]
    )
    async def notifications(
        self,
        info: Info,
        slug: str,
        type: Optional[JSON] = "all",
        snoozed: Optional[bool] = None,
        archived: Optional[bool] = None,
        read: Optional[str] = None,
        mentioned: Optional[bool] = False,
        cursor: Optional[str] = None,
    ) -> PaginatorResponse[NotificationType]:
        user = info.context.user
        user_id = str(user.id)

        type_list = type.split(",")
        q_filters = Q()

        filters = Q(workspace__slug=slug, receiver_id=user_id)

        # Base QuerySet
        project_teamspace_filter = await project_member_filter_via_teamspaces_async(
            user_id=user_id, workspace_slug=slug
        )
        queryset = (
            Notification.objects.filter(filters)
            .filter(project_teamspace_filter.query)
            .distinct()
            .select_related("workspace", "project", "triggered_by", "receiver")
            .order_by("snoozed_till", "-created_at")
        )

        now = timezone.now()

        # Apply snoozed filter
        if snoozed is not None:
            if snoozed:
                queryset = queryset.filter(
                    Q(snoozed_till__lt=now) | Q(snoozed_till__isnull=False)
                )
            else:
                queryset = queryset.filter(
                    Q(snoozed_till__gte=now) | Q(snoozed_till__isnull=True)
                )

        # Apply archived filter
        if archived is not None:
            if archived:
                queryset = queryset.filter(archived_at__isnull=False)
            else:
                queryset = queryset.filter(archived_at__isnull=True)

        # Apply read filter
        if read is not None:
            if read == "true":
                queryset = queryset.filter(read_at__isnull=False)
            elif read == "false":
                queryset = queryset.filter(read_at__isnull=True)

        if mentioned:
            queryset = queryset.filter(sender__icontains="mentioned")
        else:
            queryset = queryset.exclude(sender__icontains="mentioned")

        # Subscribed issues
        if "subscribed" in type_list:
            issue_ids = await sync_to_async(list)(
                IssueSubscriber.objects.filter(
                    workspace__slug=slug, subscriber_id=user_id
                )
                .annotate(
                    created=Exists(
                        Issue.objects.filter(created_by=user, pk=OuterRef("issue_id"))
                    )
                )
                .annotate(
                    assigned=Exists(
                        IssueAssignee.objects.filter(
                            pk=OuterRef("issue_id"), assignee=user
                        )
                    )
                )
                .filter(created=False, assigned=False)
                .values_list("issue_id", flat=True)
            )
            q_filters = Q(entity_identifier__in=issue_ids)

        # Assigned Issues
        if "assigned" in type_list:
            issue_ids = await sync_to_async(list)(
                IssueAssignee.objects.filter(
                    workspace__slug=slug, assignee_id=user_id
                ).values_list("issue_id", flat=True)
            )
            q_filters |= Q(entity_identifier__in=issue_ids)

        # Created issues
        if "created" in type_list:
            has_permission = await sync_to_async(
                WorkspaceMember.objects.filter(
                    workspace__slug=slug,
                    member=user,
                    role__lt=15,
                    is_active=True,
                ).exists
            )()

            if has_permission:
                queryset = queryset.none()
            else:
                issue_ids = await sync_to_async(list)(
                    Issue.objects.filter(
                        workspace__slug=slug, created_by=user
                    ).values_list("pk", flat=True)
                )
                q_filters = Q(entity_identifier__in=issue_ids)

        queryset = queryset.filter(q_filters)
        notifications = await sync_to_async(list)(queryset)

        return paginate(results_object=notifications, cursor=cursor)
