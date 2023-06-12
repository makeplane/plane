# Django import
from django.utils import timezone
from django.db.models import Q, Count, OuterRef, Func, F

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from .base import BaseViewSet
from plane.api.permissions import ProjectBasePermission
from plane.db.models import (
    Project,
    Inbox,
    InboxIssue,
    Issue,
    State,
    IssueLink,
    IssueAttachment,
)
from plane.api.serializers import (
    InboxSerializer,
    InboxIssueSerializer,
    IssueCreateSerializer,
    IssueStateSerializer
)
from plane.utils.issue_filters import issue_filters


class InboxViewSet(BaseViewSet):
    permission_classes = [
        ProjectBasePermission,
    ]

    serializer_class = InboxSerializer
    model = Inbox

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
            )
            .annotate(
                pending_issue_count=Count(
                    "issue_inbox",
                    filter=Q(issue_inbox__status=-2),
                )
            )
            .select_related("workspace", "project")
        )

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def destroy(self, request, slug, project_id, pk):
        try:
            inbox = Inbox.objects.get(
                workspace__slug=slug, project_id=project_id, pk=pk
            )

            if inbox.is_default:
                return Response(
                    {"error": "You cannot delete the default inbox"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            inbox.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wronf please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class InboxIssueViewSet(BaseViewSet):
    permission_classes = [
        ProjectBasePermission,
    ]
    serializer_class = InboxIssueSerializer
    model = InboxIssue

    filterset_fields = [
        "status",
    ]

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(
                Q(snoozed_till__gte=timezone.now()) | Q(snoozed_till__isnull=True),
                workspace__slug=self.kwargs.get("slug"),
                project_id=self.kwargs.get("project_id"),
                inbox_id=self.kwargs.get("inbox_id"),
            )
            .select_related("issue", "workspace", "project")
        )

    def list(self, request, slug, project_id, inbox_id):
        try:
            order_by = request.GET.get("order_by", "created_at")
            group_by = request.GET.get("group_by", False)
            filters = issue_filters(request.query_params, "GET")
            issues = (
                Issue.objects.filter(
                    issue_inbox__inbox_id=inbox_id,
                    workspace__slug=slug,
                    project_id=project_id,
                )
                .annotate(
                    sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .annotate(bridge_id=F("issue_cycle__id"))
                .filter(project_id=project_id)
                .filter(workspace__slug=slug)
                .select_related("project")
                .select_related("workspace")
                .select_related("state")
                .select_related("parent")
                .prefetch_related("assignees")
                .prefetch_related("labels")
                .order_by(order_by)
                .filter(**filters)
                .annotate(
                    link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .annotate(
                    attachment_count=IssueAttachment.objects.filter(
                        issue=OuterRef("id")
                    )
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
            )
            issues_data = IssueStateSerializer(issues, many=True).data
            return Response(
                issues_data,
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, slug, project_id, inbox_id):
        try:
            project = Project.objects.get(workspace__slug=slug, pk=project_id)
            issue_serializer = IssueCreateSerializer(
                data=request.data.get("issue"), context={"project": project}
            )

            if issue_serializer.is_valid():
                issue_serializer.save()
                inbox_issue = InboxIssue.objects.create(
                    issue_id=issue_serializer.data["id"],
                    inbox_id=inbox_id,
                    project_id=project_id,
                )
                inbox_serializer = InboxIssueSerializer(inbox_issue)

                return Response(
                    {
                        "issue": issue_serializer.data,
                        "inbox_issue": inbox_serializer.data,
                    },
                    status=status.HTTP_201_CREATED,
                )
            return Response(issue_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def partial_update(self, request, slug, project_id, inbox_id, pk):
        try:
            inbox_issue = InboxIssue.objects.get(
                pk=pk, workspace__slug=slug, project_id=project_id, inbox_id=inbox_id
            )
            serializer = InboxIssueSerializer(
                inbox_issue, data=request.data, partial=True
            )

            if serializer.is_valid():
                serializer.save()
                # Update the issue state if the issue is rejected or marked as duplicate
                if serializer.data["status"] in [-1, 2]:
                    issue = Issue.objects.get(
                        pk=inbox_issue.issue_id,
                        workspace__slug=slug,
                        project_id=project_id,
                    )
                    state = State.objects.filter(group="cancelled").first()
                    if state is not None:
                        issue.state = state
                        issue.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except InboxIssue.DoesNotExist:
            return Response(
                {"error": "Inbox Issue does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
