# Django imports
from django.db.models import Exists, OuterRef, Q, Case, When, BooleanField
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

from plane.app.serializers import (
    NotificationSerializer,
    UserNotificationPreferenceSerializer,
)
from plane.db.models import (
    Issue,
    IssueAssignee,
    IssueSubscriber,
    Notification,
    UserNotificationPreference,
    WorkspaceMember,
)
from plane.utils.paginator import BasePaginator
from plane.app.permissions import allow_permission, ROLE

# Module imports
from ..base import BaseAPIView, BaseViewSet


class NotificationViewSet(BaseViewSet, BasePaginator):
    model = Notification
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                receiver_id=self.request.user.id,
            )
            .select_related("workspace", "project", "triggered_by", "receiver")
        )

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def list(self, request, slug):
        # Get query parameters
        snoozed = request.GET.get("snoozed", "false")
        archived = request.GET.get("archived", "false")
        read = request.GET.get("read", None)
        type = request.GET.get("type", "all")
        mentioned = request.GET.get("mentioned", False)
        q_filters = Q()

        intake_issue = Issue.objects.filter(
            pk=OuterRef("entity_identifier"),
            issue_intake__status__in=[0, 2, -2],
            workspace__slug=self.kwargs.get("slug"),
        )

        notifications = (
            Notification.objects.filter(
                workspace__slug=slug, receiver_id=request.user.id
            )
            .filter(entity_name="issue")
            .annotate(is_inbox_issue=Exists(intake_issue))
            .annotate(is_intake_issue=Exists(intake_issue))
            .annotate(
                is_mentioned_notification=Case(
                    When(sender__icontains="mentioned", then=True),
                    default=False,
                    output_field=BooleanField(),
                )
            )
            .select_related("workspace", "project", "triggered_by", "receiver")
            .order_by("snoozed_till", "-created_at")
        )

        # Filters based on query parameters
        snoozed_filters = {
            "true": Q(snoozed_till__lt=timezone.now()) | Q(snoozed_till__isnull=False),
            "false": Q(snoozed_till__gte=timezone.now()) | Q(snoozed_till__isnull=True),
        }

        notifications = notifications.filter(snoozed_filters[snoozed])

        archived_filters = {
            "true": Q(archived_at__isnull=False),
            "false": Q(archived_at__isnull=True),
        }

        notifications = notifications.filter(archived_filters[archived])

        if read == "false":
            notifications = notifications.filter(read_at__isnull=True)

        if read == "true":
            notifications = notifications.filter(read_at__isnull=False)

        if mentioned:
            notifications = notifications.filter(sender__icontains="mentioned")
        else:
            notifications = notifications.exclude(sender__icontains="mentioned")

        type = type.split(",")
        # Subscribed issues
        if "subscribed" in type:
            issue_ids = (
                IssueSubscriber.objects.filter(
                    workspace__slug=slug, subscriber_id=request.user.id
                )
                .annotate(
                    created=Exists(
                        Issue.objects.filter(
                            created_by=request.user, pk=OuterRef("issue_id")
                        )
                    )
                )
                .annotate(
                    assigned=Exists(
                        IssueAssignee.objects.filter(
                            pk=OuterRef("issue_id"), assignee=request.user
                        )
                    )
                )
                .filter(created=False, assigned=False)
                .values_list("issue_id", flat=True)
            )
            q_filters |= Q(entity_identifier__in=issue_ids)

        # Assigned Issues
        if "assigned" in type:
            issue_ids = IssueAssignee.objects.filter(
                workspace__slug=slug, assignee_id=request.user.id
            ).values_list("issue_id", flat=True)
            q_filters |= Q(entity_identifier__in=issue_ids)

        # Created issues
        if "created" in type:
            if WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, role__lt=15, is_active=True
            ).exists():
                notifications = notifications.none()
            else:
                issue_ids = Issue.objects.filter(
                    workspace__slug=slug, created_by=request.user
                ).values_list("pk", flat=True)
                q_filters |= Q(entity_identifier__in=issue_ids)

        # Apply the combined Q object filters
        notifications = notifications.filter(q_filters)

        # Pagination
        if request.GET.get("per_page", False) and request.GET.get("cursor", False):
            return self.paginate(
                order_by=request.GET.get("order_by", "-created_at"),
                request=request,
                queryset=(notifications),
                on_results=lambda notifications: NotificationSerializer(
                    notifications, many=True
                ).data,
            )

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def partial_update(self, request, slug, pk):
        notification = Notification.objects.get(
            workspace__slug=slug, pk=pk, receiver=request.user
        )
        # Only read_at and snoozed_till can be updated
        notification_data = {"snoozed_till": request.data.get("snoozed_till", None)}
        serializer = NotificationSerializer(
            notification, data=notification_data, partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def mark_read(self, request, slug, pk):
        notification = Notification.objects.get(
            receiver=request.user, workspace__slug=slug, pk=pk
        )
        notification.read_at = timezone.now()
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def mark_unread(self, request, slug, pk):
        notification = Notification.objects.get(
            receiver=request.user, workspace__slug=slug, pk=pk
        )
        notification.read_at = None
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def archive(self, request, slug, pk):
        notification = Notification.objects.get(
            receiver=request.user, workspace__slug=slug, pk=pk
        )
        notification.archived_at = timezone.now()
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def unarchive(self, request, slug, pk):
        notification = Notification.objects.get(
            receiver=request.user, workspace__slug=slug, pk=pk
        )
        notification.archived_at = None
        notification.save()
        serializer = NotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_200_OK)


class UnreadNotificationEndpoint(BaseAPIView):
    use_read_replica = True

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def get(self, request, slug):
        # Watching Issues Count
        unread_notifications_count = (
            Notification.objects.filter(
                workspace__slug=slug,
                receiver_id=request.user.id,
                read_at__isnull=True,
                archived_at__isnull=True,
                snoozed_till__isnull=True,
            )
            .exclude(sender__icontains="mentioned")
            .count()
        )

        mention_notifications_count = Notification.objects.filter(
            workspace__slug=slug,
            receiver_id=request.user.id,
            read_at__isnull=True,
            archived_at__isnull=True,
            snoozed_till__isnull=True,
            sender__icontains="mentioned",
        ).count()

        return Response(
            {
                "total_unread_notifications_count": int(unread_notifications_count),
                "mention_unread_notifications_count": int(mention_notifications_count),
            },
            status=status.HTTP_200_OK,
        )


class MarkAllReadNotificationViewSet(BaseViewSet):
    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE"
    )
    def create(self, request, slug):
        snoozed = request.data.get("snoozed", False)
        archived = request.data.get("archived", False)
        type = request.data.get("type", "all")

        notifications = (
            Notification.objects.filter(
                workspace__slug=slug, receiver_id=request.user.id, read_at__isnull=True
            )
            .select_related("workspace", "project", "triggered_by", "receiver")
            .order_by("snoozed_till", "-created_at")
        )

        # Filter for snoozed notifications
        if snoozed:
            notifications = notifications.filter(
                Q(snoozed_till__lt=timezone.now()) | Q(snoozed_till__isnull=False)
            )
        else:
            notifications = notifications.filter(
                Q(snoozed_till__gte=timezone.now()) | Q(snoozed_till__isnull=True)
            )

        # Filter for archived or unarchive
        if archived:
            notifications = notifications.filter(archived_at__isnull=False)
        else:
            notifications = notifications.filter(archived_at__isnull=True)

        # Subscribed issues
        if type == "watching":
            issue_ids = IssueSubscriber.objects.filter(
                workspace__slug=slug, subscriber_id=request.user.id
            ).values_list("issue_id", flat=True)
            notifications = notifications.filter(entity_identifier__in=issue_ids)

        # Assigned Issues
        if type == "assigned":
            issue_ids = IssueAssignee.objects.filter(
                workspace__slug=slug, assignee_id=request.user.id
            ).values_list("issue_id", flat=True)
            notifications = notifications.filter(entity_identifier__in=issue_ids)

        # Created issues
        if type == "created":
            if WorkspaceMember.objects.filter(
                workspace__slug=slug, member=request.user, role__lt=15, is_active=True
            ).exists():
                notifications = Notification.objects.none()
            else:
                issue_ids = Issue.objects.filter(
                    workspace__slug=slug, created_by=request.user
                ).values_list("pk", flat=True)
                notifications = notifications.filter(entity_identifier__in=issue_ids)

        updated_notifications = []
        for notification in notifications:
            notification.read_at = timezone.now()
            updated_notifications.append(notification)
        Notification.objects.bulk_update(
            updated_notifications, ["read_at"], batch_size=100
        )
        return Response({"message": "Successful"}, status=status.HTTP_200_OK)


class UserNotificationPreferenceEndpoint(BaseAPIView):
    model = UserNotificationPreference
    serializer_class = UserNotificationPreferenceSerializer

    # request the object
    def get(self, request):
        user_notification_preference = UserNotificationPreference.objects.get(
            user=request.user
        )
        serializer = UserNotificationPreferenceSerializer(user_notification_preference)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # update the object
    def patch(self, request):
        user_notification_preference = UserNotificationPreference.objects.get(
            user=request.user
        )
        serializer = UserNotificationPreferenceSerializer(
            user_notification_preference, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
