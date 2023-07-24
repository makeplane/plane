# Django imports
from django.db.models import Q
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception
from plane.utils.paginator import BasePaginator

# Module imports
from .base import BaseViewSet, BaseAPIView
from plane.db.models import Notification, IssueAssignee, IssueSubscriber, Issue
from plane.api.serializers import NotificationSerializer


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
            .select_related("workspace", "project," "triggered_by", "receiver")
        )

    def list(self, request, slug):
        try:
            snoozed = request.GET.get("snoozed", "false")
            archived = request.GET.get("archived", "false")
            read = request.GET.get("read", "true")

            # Filter type
            type = request.GET.get("type", "all")

            notifications = (
                Notification.objects.filter(
                    workspace__slug=slug, receiver_id=request.user.id
                )
                .select_related("workspace", "project," "triggered_by", "receiver")
                .order_by("snoozed_till", "-created_at")
            )

            # Filter for snoozed notifications
            if snoozed == "false":
                notifications = notifications.filter(
                    Q(snoozed_till__gte=timezone.now()) | Q(snoozed_till__isnull=True),
                )

            if snoozed == "true":
                notifications = notifications.filter(
                    Q(snoozed_till__lt=timezone.now()) | Q(snoozed_till__isnull=False)
                )

            if read == "false":
                notifications = notifications.filter(read_at__isnull=True)

            # Filter for archived or unarchive
            if archived == "false":
                notifications = notifications.filter(archived_at__isnull=True)

            if archived == "true":
                notifications = notifications.filter(archived_at__isnull=False)

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
                issue_ids = Issue.objects.filter(
                    workspace__slug=slug, created_by=request.user
                ).values_list("pk", flat=True)
                notifications = notifications.filter(entity_identifier__in=issue_ids)

            # Pagination
            if request.GET.get("per_page", False) and request.GET.get("cursor", False):
                return self.paginate(
                    request=request,
                    queryset=(notifications),
                    on_results=lambda notifications: NotificationSerializer(
                        notifications, many=True
                    ).data,
                )

            serializer = NotificationSerializer(notifications, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def partial_update(self, request, slug, pk):
        try:
            notification = Notification.objects.get(
                workspace__slug=slug, pk=pk, receiver=request.user
            )
            # Only read_at and snoozed_till can be updated
            notification_data = {
                "snoozed_till": request.data.get("snoozed_till", None),
            }
            serializer = NotificationSerializer(
                notification, data=notification_data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def mark_read(self, request, slug, pk):
        try:
            notification = Notification.objects.get(
                receiver=request.user, workspace__slug=slug, pk=pk
            )
            notification.read_at = timezone.now()
            notification.save()
            serializer = NotificationSerializer(notification)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def mark_unread(self, request, slug, pk):
        try:
            notification = Notification.objects.get(
                receiver=request.user, workspace__slug=slug, pk=pk
            )
            notification.read_at = None
            notification.save()
            serializer = NotificationSerializer(notification)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def archive(self, request, slug, pk):
        try:
            notification = Notification.objects.get(
                receiver=request.user, workspace__slug=slug, pk=pk
            )
            notification.archived_at = timezone.now()
            notification.save()
            serializer = NotificationSerializer(notification)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def unarchive(self, request, slug, pk):
        try:
            notification = Notification.objects.get(
                receiver=request.user, workspace__slug=slug, pk=pk
            )
            notification.archived_at = None
            notification.save()
            serializer = NotificationSerializer(notification)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Notification.DoesNotExist:
            return Response(
                {"error": "Notification does not exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class UnreadNotificationEndpoint(BaseAPIView):
    def get(self, request, slug):
        try:
            # Watching Issues Count
            watching_issues_count = Notification.objects.filter(
                workspace__slug=slug,
                receiver_id=request.user.id,
                read_at__isnull=True,
                archived_at__isnull=True,
                entity_identifier__in=IssueSubscriber.objects.filter(
                    workspace__slug=slug, subscriber_id=request.user.id
                ).values_list("issue_id", flat=True),
            ).count()

            # My Issues Count
            my_issues_count = Notification.objects.filter(
                workspace__slug=slug,
                receiver_id=request.user.id,
                read_at__isnull=True,
                archived_at__isnull=True,
                entity_identifier__in=IssueAssignee.objects.filter(
                    workspace__slug=slug, assignee_id=request.user.id
                ).values_list("issue_id", flat=True),
            ).count()

            # Created Issues Count
            created_issues_count = Notification.objects.filter(
                workspace__slug=slug,
                receiver_id=request.user.id,
                read_at__isnull=True,
                archived_at__isnull=True,
                entity_identifier__in=Issue.objects.filter(
                    workspace__slug=slug, created_by=request.user
                ).values_list("pk", flat=True),
            ).count()

            return Response(
                {
                    "watching_issues": watching_issues_count,
                    "my_issues": my_issues_count,
                    "created_issues": created_issues_count,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
