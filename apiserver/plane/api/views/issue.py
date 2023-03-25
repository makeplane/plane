# Python imports
import json
import random
from itertools import groupby, chain

# Django imports
from django.db.models import Prefetch, OuterRef, Func, F, Q
from django.core.serializers.json import DjangoJSONEncoder


# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    IssueCreateSerializer,
    IssueActivitySerializer,
    IssueCommentSerializer,
    TimeLineIssueSerializer,
    IssuePropertySerializer,
    LabelSerializer,
    IssueSerializer,
    LabelSerializer,
    IssueFlatSerializer,
    IssueLinkSerializer,
    IssueLiteSerializer,
)
from plane.api.permissions import (
    ProjectEntityPermission,
    WorkSpaceAdminPermission,
    ProjectMemberPermission,
)
from plane.db.models import (
    Project,
    Issue,
    IssueActivity,
    IssueComment,
    TimelineIssue,
    IssueProperty,
    Label,
    IssueBlocker,
    CycleIssue,
    ModuleIssue,
    IssueLink,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.utils.grouper import group_results
from plane.utils.issue_filters import issue_filters


class IssueViewSet(BaseViewSet):
    def get_serializer_class(self):
        return (
            IssueCreateSerializer
            if self.action in ["create", "update", "partial_update"]
            else IssueSerializer
        )

    model = Issue
    permission_classes = [
        ProjectEntityPermission,
    ]

    search_fields = [
        "name",
    ]

    filterset_fields = [
        "state__name",
        "assignees__id",
        "workspace__id",
    ]

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_id"))

    def perform_update(self, serializer):
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                {
                    "type": "issue.activity.updated",
                    "requested_data": requested_data,
                    "actor_id": str(self.request.user.id),
                    "issue_id": str(self.kwargs.get("pk", None)),
                    "project_id": str(self.kwargs.get("project_id", None)),
                    "current_instance": json.dumps(
                        IssueSerializer(current_instance).data, cls=DjangoJSONEncoder
                    ),
                },
            )

        return super().perform_update(serializer)

    def perform_destroy(self, instance):
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                {
                    "type": "issue.activity.deleted",
                    "requested_data": json.dumps(
                        {"issue_id": str(self.kwargs.get("pk", None))}
                    ),
                    "actor_id": str(self.request.user.id),
                    "issue_id": str(self.kwargs.get("pk", None)),
                    "project_id": str(self.kwargs.get("project_id", None)),
                    "current_instance": json.dumps(
                        IssueSerializer(current_instance).data, cls=DjangoJSONEncoder
                    ),
                },
            )
        return super().perform_destroy(instance)

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .annotate(
                sub_issues_count=Issue.objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("project")
            .select_related("workspace")
            .select_related("state")
            .select_related("parent")
            .prefetch_related("assignees")
            .prefetch_related("labels")
        )

    def list(self, request, slug, project_id):
        try:
            filters = issue_filters(request.query_params, "GET")
            show_sub_issues = request.GET.get("show_sub_issues", "true")

            issue_queryset = (
                self.get_queryset()
                .order_by(request.GET.get("order_by", "created_at"))
                .filter(**filters)
            )

            issue_queryset = (
                issue_queryset
                if show_sub_issues == "true"
                else issue_queryset.filter(parent__isnull=True)
            )

            issues = IssueLiteSerializer(issue_queryset, many=True).data

            ## Grouping the results
            group_by = request.GET.get("group_by", False)
            if group_by:
                return Response(
                    group_results(issues, group_by), status=status.HTTP_200_OK
                )

            return Response(issues, status=status.HTTP_200_OK)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def create(self, request, slug, project_id):
        try:
            project = Project.objects.get(workspace__slug=slug, pk=project_id)
            serializer = IssueCreateSerializer(
                data=request.data, context={"project": project}
            )

            if serializer.is_valid():
                serializer.save()

                # Track the issue
                issue_activity.delay(
                    {
                        "type": "issue.activity.created",
                        "requested_data": json.dumps(
                            self.request.data, cls=DjangoJSONEncoder
                        ),
                        "actor_id": str(request.user.id),
                        "issue_id": str(serializer.data.get("id", None)),
                        "project_id": str(project_id),
                        "current_instance": None,
                    },
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Project.DoesNotExist:
            return Response(
                {"error": "Project was not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def retrieve(self, request, slug, project_id, pk=None):
        try:
            issue = Issue.objects.get(
                workspace__slug=slug, project_id=project_id, pk=pk
            )
            return Response(IssueSerializer(issue).data, status=status.HTTP_200_OK)
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue Does not exist"}, status=status.HTTP_404_NOT_FOUND
            )


class UserWorkSpaceIssues(BaseAPIView):
    def get(self, request, slug):
        try:
            issues = (
                Issue.objects.filter(assignees__in=[request.user], workspace__slug=slug)
                .annotate(
                    sub_issues_count=Issue.objects.filter(parent=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
                .select_related("project")
                .select_related("workspace")
                .select_related("state")
                .select_related("parent")
                .prefetch_related("assignees")
                .prefetch_related("labels")
                .order_by("-created_at")
            )
            serializer = IssueLiteSerializer(issues, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WorkSpaceIssuesEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    def get(self, request, slug):
        try:
            issues = (
                Issue.objects.filter(workspace__slug=slug)
                .filter(project__project_projectmember__member=self.request.user)
                .order_by("-created_at")
            )
            serializer = IssueSerializer(issues, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssueActivityEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id, issue_id):
        try:
            issue_activities = (
                IssueActivity.objects.filter(issue_id=issue_id)
                .filter(
                    ~Q(field="comment"),
                    project__project_projectmember__member=self.request.user,
                )
                .select_related("actor")
            ).order_by("created_at")
            issue_comments = (
                IssueComment.objects.filter(issue_id=issue_id)
                .filter(project__project_projectmember__member=self.request.user)
                .order_by("created_at")
            )
            issue_activities = IssueActivitySerializer(issue_activities, many=True).data
            issue_comments = IssueCommentSerializer(issue_comments, many=True).data

            result_list = sorted(
                chain(issue_activities, issue_comments),
                key=lambda instance: instance["created_at"],
            )

            return Response(result_list, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssueCommentViewSet(BaseViewSet):
    serializer_class = IssueCommentSerializer
    model = IssueComment
    permission_classes = [
        ProjectEntityPermission,
    ]

    filterset_fields = [
        "issue__id",
        "workspace__id",
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
            actor=self.request.user if self.request.user is not None else None,
        )
        issue_activity.delay(
            {
                "type": "comment.activity.created",
                "requested_data": json.dumps(serializer.data, cls=DjangoJSONEncoder),
                "actor_id": str(self.request.user.id),
                "issue_id": str(self.kwargs.get("issue_id")),
                "project_id": str(self.kwargs.get("project_id")),
                "current_instance": None,
            },
        )

    def perform_update(self, serializer):
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                {
                    "type": "comment.activity.updated",
                    "requested_data": requested_data,
                    "actor_id": str(self.request.user.id),
                    "issue_id": str(self.kwargs.get("issue_id", None)),
                    "project_id": str(self.kwargs.get("project_id", None)),
                    "current_instance": json.dumps(
                        IssueCommentSerializer(current_instance).data,
                        cls=DjangoJSONEncoder,
                    ),
                },
            )

        return super().perform_update(serializer)

    def perform_destroy(self, instance):
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                {
                    "type": "comment.activity.deleted",
                    "requested_data": json.dumps(
                        {"comment_id": str(self.kwargs.get("pk", None))}
                    ),
                    "actor_id": str(self.request.user.id),
                    "issue_id": str(self.kwargs.get("issue_id", None)),
                    "project_id": str(self.kwargs.get("project_id", None)),
                    "current_instance": json.dumps(
                        IssueCommentSerializer(current_instance).data,
                        cls=DjangoJSONEncoder,
                    ),
                },
            )
        return super().perform_destroy(instance)

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .distinct()
        )


class TimeLineIssueViewSet(BaseViewSet):
    serializer_class = TimeLineIssueSerializer
    model = TimelineIssue
    permission_classes = [
        ProjectEntityPermission,
    ]

    filterset_fields = [
        "issue__id",
        "workspace__id",
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("issue")
            .distinct()
        )


class IssuePropertyViewSet(BaseViewSet):
    serializer_class = IssuePropertySerializer
    model = IssueProperty
    permission_classes = [
        ProjectEntityPermission,
    ]

    filterset_fields = []

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"), user=self.request.user
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(user=self.request.user)
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
        )

    def list(self, request, slug, project_id):
        queryset = self.get_queryset()
        serializer = IssuePropertySerializer(queryset, many=True)
        return Response(
            serializer.data[0] if len(serializer.data) > 0 else [],
            status=status.HTTP_200_OK,
        )

    def create(self, request, slug, project_id):
        try:
            issue_property, created = IssueProperty.objects.get_or_create(
                user=request.user,
                project_id=project_id,
            )

            if not created:
                issue_property.properties = request.data.get("properties", {})
                issue_property.save()

                serializer = IssuePropertySerializer(issue_property)
                return Response(serializer.data, status=status.HTTP_200_OK)

            issue_property.properties = request.data.get("properties", {})
            issue_property.save()
            serializer = IssuePropertySerializer(issue_property)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class LabelViewSet(BaseViewSet):
    serializer_class = LabelSerializer
    model = Label
    permission_classes = [
        ProjectMemberPermission,
    ]

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
        )

    def get_queryset(self):
        return self.filter_queryset(
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .select_related("project")
            .select_related("workspace")
            .select_related("parent")
            .order_by("name")
            .distinct()
        )


class BulkDeleteIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def delete(self, request, slug, project_id):
        try:
            issue_ids = request.data.get("issue_ids", [])

            if not len(issue_ids):
                return Response(
                    {"error": "Issue IDs are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            issues = Issue.objects.filter(
                workspace__slug=slug, project_id=project_id, pk__in=issue_ids
            )

            total_issues = len(issues)

            issues.delete()

            return Response(
                {"message": f"{total_issues} issues were deleted"},
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class SubIssuesEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id, issue_id):
        try:
            sub_issues = (
                Issue.objects.filter(
                    parent_id=issue_id, workspace__slug=slug, project_id=project_id
                )
                .select_related("project")
                .select_related("workspace")
                .select_related("state")
                .select_related("parent")
                .prefetch_related("assignees")
                .prefetch_related("labels")
            )

            serializer = IssueLiteSerializer(sub_issues, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Assign multiple sub issues
    def post(self, request, slug, project_id, issue_id):
        try:
            parent_issue = Issue.objects.get(pk=issue_id)
            sub_issue_ids = request.data.get("sub_issue_ids", [])

            if not len(sub_issue_ids):
                return Response(
                    {"error": "Sub Issue IDs are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            sub_issues = Issue.objects.filter(id__in=sub_issue_ids)

            for sub_issue in sub_issues:
                sub_issue.parent = parent_issue

            _ = Issue.objects.bulk_update(sub_issues, ["parent"], batch_size=10)

            updated_sub_issues = Issue.objects.filter(id__in=sub_issue_ids)

            return Response(
                IssueFlatSerializer(updated_sub_issues, many=True).data,
                status=status.HTTP_200_OK,
            )
        except Issue.DoesNotExist:
            return Response(
                {"Parent Issue does not exists"}, status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssueLinkViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]

    model = IssueLink
    serializer_class = IssueLinkSerializer

    def perform_create(self, serializer):
        serializer.save(
            project_id=self.kwargs.get("project_id"),
            issue_id=self.kwargs.get("issue_id"),
        )

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .order_by("-created_at")
            .distinct()
        )


class BulkCreateIssueLabelsEndpoint(BaseAPIView):
    def post(self, request, slug, project_id):
        try:
            label_data = request.data.get("label_data", [])
            project = Project.objects.get(pk=project_id)

            labels = Label.objects.bulk_create(
                [
                    Label(
                        name=label.get("name", "Migrated"),
                        description=label.get("description", "Migrated Issue"),
                        color="#" + "%06x" % random.randint(0, 0xFFFFFF),
                        project_id=project_id,
                        workspace_id=project.workspace_id,
                        created_by=request.user,
                        updated_by=request.user,
                    )
                    for label in label_data
                ],
                batch_size=50,
                ignore_conflicts=True,
            )

            return Response(
                {"labels": LabelSerializer(labels, many=True).data},
                status=status.HTTP_201_CREATED,
            )
        except Project.DoesNotExist:
            return Response(
                {"error": "Project Does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
