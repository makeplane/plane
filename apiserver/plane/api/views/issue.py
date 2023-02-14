# Python imports
import json
from itertools import groupby, chain

# Django imports
from django.db.models import Prefetch, OuterRef, Func, F
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
)
from plane.bgtasks.issue_activites_task import issue_activity


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
                    "type": "issue.activity",
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
            .prefetch_related(
                Prefetch(
                    "blocked_issues",
                    queryset=IssueBlocker.objects.select_related("blocked_by", "block"),
                )
            )
            .prefetch_related(
                Prefetch(
                    "blocker_issues",
                    queryset=IssueBlocker.objects.select_related("block", "blocked_by"),
                )
            )
            .prefetch_related(
                Prefetch(
                    "issue_cycle",
                    queryset=CycleIssue.objects.select_related("cycle", "issue"),
                ),
            )
            .prefetch_related(
                Prefetch(
                    "issue_module",
                    queryset=ModuleIssue.objects.select_related(
                        "module", "issue"
                    ).prefetch_related("module__members"),
                ),
            )
        )

    def grouper(self, issue, group_by):
        group_by = issue.get(group_by, "")

        if isinstance(group_by, list):
            if len(group_by):
                return group_by[0]
            else:
                return ""

        else:
            return group_by

    def list(self, request, slug, project_id):
        try:
            issue_queryset = self.get_queryset()

            ## Grouping the results
            group_by = request.GET.get("group_by", False)
            # TODO: Move this group by from ittertools to ORM for better performance - nk
            if group_by:
                issue_dict = dict()

                issues = IssueSerializer(issue_queryset, many=True).data

                for key, value in groupby(
                    issues, lambda issue: self.grouper(issue, group_by)
                ):
                    issue_dict[str(key)] = list(value)

                return Response(issue_dict, status=status.HTTP_200_OK)

            return Response(
                {
                    "next_cursor": str(0),
                    "prev_cursor": str(0),
                    "next_page_results": False,
                    "prev_page_results": False,
                    "count": issue_queryset.count(),
                    "total_pages": 1,
                    "extra_stats": {},
                    "results": IssueSerializer(issue_queryset, many=True).data,
                },
                status=status.HTTP_200_OK,
            )

        except Exception as e:
            print(e)
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
                IssueActivity.objects.create(
                    issue_id=serializer.data["id"],
                    project_id=project_id,
                    workspace_id=serializer["workspace"],
                    comment=f"{request.user.email} created the issue",
                    verb="created",
                    actor=request.user,
                )

                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Project.DoesNotExist:
            return Response(
                {"error": "Project was not found"}, status=status.HTTP_404_NOT_FOUND
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
                .prefetch_related(
                    Prefetch(
                        "blocked_issues",
                        queryset=IssueBlocker.objects.select_related(
                            "blocked_by", "block"
                        ),
                    )
                )
                .prefetch_related(
                    Prefetch(
                        "blocker_issues",
                        queryset=IssueBlocker.objects.select_related(
                            "block", "blocked_by"
                        ),
                    )
                )
                .prefetch_related(
                    Prefetch(
                        "issue_cycle",
                        queryset=CycleIssue.objects.select_related("cycle", "issue"),
                    ),
                )
                .prefetch_related(
                    Prefetch(
                        "issue_module",
                        queryset=ModuleIssue.objects.select_related("module", "issue"),
                    ),
                )
            )
            serializer = IssueSerializer(issues, many=True)
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
            issues = Issue.objects.filter(workspace__slug=slug).filter(
                project__project_projectmember__member=self.request.user
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
                .filter(project__project_projectmember__member=self.request.user)
                .select_related("actor")
            ).order_by("created_by")
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
                .prefetch_related(
                    Prefetch(
                        "blocked_issues",
                        queryset=IssueBlocker.objects.select_related(
                            "blocked_by", "block"
                        ),
                    )
                )
                .prefetch_related(
                    Prefetch(
                        "blocker_issues",
                        queryset=IssueBlocker.objects.select_related(
                            "block", "blocked_by"
                        ),
                    )
                )
                .prefetch_related(
                    Prefetch(
                        "issue_cycle",
                        queryset=CycleIssue.objects.select_related("cycle", "issue"),
                    ),
                )
                .prefetch_related(
                    Prefetch(
                        "issue_module",
                        queryset=ModuleIssue.objects.select_related("module", "issue"),
                    ),
                )
            )

            serializer = IssueSerializer(sub_issues, many=True)
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

            if len(sub_issue_ids):
                return Response(
                    {"error": "Sub Issue IDs are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            sub_issues = Issue.objects.filter(id__in=sub_issue_ids)

            for sub_issue in sub_issues:
                sub_issue.parent = parent_issue

            updated_sub_issues = Issue.objects.bulk_update(
                sub_issues, ["parent"], batch_size=10
            )

            return Response(
                IssueSerializer(updated_sub_issues, many=True).data,
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
