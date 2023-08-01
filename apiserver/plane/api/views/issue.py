# Python imports
import json
import random
from itertools import chain

# Django imports
from django.db.models import (
    Prefetch,
    OuterRef,
    Func,
    F,
    Q,
    Count,
    Case,
    Value,
    CharField,
    When,
    Exists,
    Max,
)
from django.core.serializers.json import DjangoJSONEncoder
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page
from django.db.models.functions import Coalesce
from django.conf import settings

# Third Party imports
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from sentry_sdk import capture_exception

# Module imports
from . import BaseViewSet, BaseAPIView
from plane.api.serializers import (
    IssueCreateSerializer,
    IssueActivitySerializer,
    IssueCommentSerializer,
    IssuePropertySerializer,
    LabelSerializer,
    IssueSerializer,
    LabelSerializer,
    IssueFlatSerializer,
    IssueLinkSerializer,
    IssueLiteSerializer,
    IssueAttachmentSerializer,
    IssueSubscriberSerializer,
    ProjectMemberLiteSerializer,
    IssueReactionSerializer,
    CommentReactionSerializer,
)
from plane.api.permissions import (
    WorkspaceEntityPermission,
    ProjectEntityPermission,
    WorkSpaceAdminPermission,
    ProjectMemberPermission,
    ProjectLitePermission,
)
from plane.db.models import (
    Project,
    Issue,
    IssueActivity,
    IssueComment,
    IssueProperty,
    Label,
    IssueLink,
    IssueAttachment,
    State,
    IssueSubscriber,
    ProjectMember,
    IssueReaction,
    CommentReaction,
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
                type="issue.activity.updated",
                requested_data=requested_data,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("pk", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    IssueSerializer(current_instance).data, cls=DjangoJSONEncoder
                ),
            )

        return super().perform_update(serializer)

    def perform_destroy(self, instance):
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                type="issue.activity.deleted",
                requested_data=json.dumps(
                    {"issue_id": str(self.kwargs.get("pk", None))}
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("pk", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    IssueSerializer(current_instance).data, cls=DjangoJSONEncoder
                ),
            )
        return super().perform_destroy(instance)

    def get_queryset(self):
        return (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
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
                    "issue_reactions",
                    queryset=IssueReaction.objects.select_related("actor"),
                )
            )
        )

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id):
        try:
            filters = issue_filters(request.query_params, "GET")
            print(filters)

            # Custom ordering for priority and state
            priority_order = ["urgent", "high", "medium", "low", None]
            state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]

            order_by_param = request.GET.get("order_by", "-created_at")

            issue_queryset = (
                self.get_queryset()
                .filter(**filters)
                .annotate(cycle_id=F("issue_cycle__cycle_id"))
                .annotate(module_id=F("issue_module__module_id"))
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

            # Priority Ordering
            if order_by_param == "priority" or order_by_param == "-priority":
                priority_order = (
                    priority_order
                    if order_by_param == "priority"
                    else priority_order[::-1]
                )
                issue_queryset = issue_queryset.annotate(
                    priority_order=Case(
                        *[
                            When(priority=p, then=Value(i))
                            for i, p in enumerate(priority_order)
                        ],
                        output_field=CharField(),
                    )
                ).order_by("priority_order")

            # State Ordering
            elif order_by_param in [
                "state__name",
                "state__group",
                "-state__name",
                "-state__group",
            ]:
                state_order = (
                    state_order
                    if order_by_param in ["state__name", "state__group"]
                    else state_order[::-1]
                )
                issue_queryset = issue_queryset.annotate(
                    state_order=Case(
                        *[
                            When(state__group=state_group, then=Value(i))
                            for i, state_group in enumerate(state_order)
                        ],
                        default=Value(len(state_order)),
                        output_field=CharField(),
                    )
                ).order_by("state_order")
            # assignee and label ordering
            elif order_by_param in [
                "labels__name",
                "-labels__name",
                "assignees__first_name",
                "-assignees__first_name",
            ]:
                issue_queryset = issue_queryset.annotate(
                    max_values=Max(
                        order_by_param[1::]
                        if order_by_param.startswith("-")
                        else order_by_param
                    )
                ).order_by(
                    "-max_values" if order_by_param.startswith("-") else "max_values"
                )
            else:
                issue_queryset = issue_queryset.order_by(order_by_param)

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
            project = Project.objects.get(pk=project_id)

            serializer = IssueCreateSerializer(
                data=request.data,
                context={
                    "project_id": project_id,
                    "workspace_id": project.workspace_id,
                    "default_assignee_id": project.default_assignee_id,
                },
            )

            if serializer.is_valid():
                serializer.save()

                # Track the issue
                issue_activity.delay(
                    type="issue.activity.created",
                    requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                    actor_id=str(request.user.id),
                    issue_id=str(serializer.data.get("id", None)),
                    project_id=str(project_id),
                    current_instance=None,
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Project.DoesNotExist:
            return Response(
                {"error": "Project was not found"}, status=status.HTTP_404_NOT_FOUND
            )

    def retrieve(self, request, slug, project_id, pk=None):
        try:
            issue = Issue.issue_objects.get(
                workspace__slug=slug, project_id=project_id, pk=pk
            )
            return Response(IssueSerializer(issue).data, status=status.HTTP_200_OK)
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue Does not exist"}, status=status.HTTP_404_NOT_FOUND
            )


class UserWorkSpaceIssues(BaseAPIView):
    @method_decorator(gzip_page)
    def get(self, request, slug):
        try:
            filters = issue_filters(request.query_params, "GET")
            # Custom ordering for priority and state
            priority_order = ["urgent", "high", "medium", "low", None]
            state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]

            order_by_param = request.GET.get("order_by", "-created_at")

            issue_queryset = (
                Issue.issue_objects.filter(
                    (Q(assignees__in=[request.user]) | Q(created_by=request.user)),
                    workspace__slug=slug,
                )
                .annotate(
                    sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
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
                .order_by(order_by_param)
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
                .filter(**filters)
            )

            # Priority Ordering
            if order_by_param == "priority" or order_by_param == "-priority":
                priority_order = (
                    priority_order
                    if order_by_param == "priority"
                    else priority_order[::-1]
                )
                issue_queryset = issue_queryset.annotate(
                    priority_order=Case(
                        *[
                            When(priority=p, then=Value(i))
                            for i, p in enumerate(priority_order)
                        ],
                        output_field=CharField(),
                    )
                ).order_by("priority_order")

            # State Ordering
            elif order_by_param in [
                "state__name",
                "state__group",
                "-state__name",
                "-state__group",
            ]:
                state_order = (
                    state_order
                    if order_by_param in ["state__name", "state__group"]
                    else state_order[::-1]
                )
                issue_queryset = issue_queryset.annotate(
                    state_order=Case(
                        *[
                            When(state__group=state_group, then=Value(i))
                            for i, state_group in enumerate(state_order)
                        ],
                        default=Value(len(state_order)),
                        output_field=CharField(),
                    )
                ).order_by("state_order")
            # assignee and label ordering
            elif order_by_param in [
                "labels__name",
                "-labels__name",
                "assignees__first_name",
                "-assignees__first_name",
            ]:
                issue_queryset = issue_queryset.annotate(
                    max_values=Max(
                        order_by_param[1::]
                        if order_by_param.startswith("-")
                        else order_by_param
                    )
                ).order_by(
                    "-max_values" if order_by_param.startswith("-") else "max_values"
                )
            else:
                issue_queryset = issue_queryset.order_by(order_by_param)

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


class WorkSpaceIssuesEndpoint(BaseAPIView):
    permission_classes = [
        WorkSpaceAdminPermission,
    ]

    @method_decorator(gzip_page)
    def get(self, request, slug):
        try:
            issues = (
                Issue.issue_objects.filter(workspace__slug=slug)
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

    @method_decorator(gzip_page)
    def get(self, request, slug, project_id, issue_id):
        try:
            issue_activities = (
                IssueActivity.objects.filter(issue_id=issue_id)
                .filter(
                    ~Q(field="comment"),
                    project__project_projectmember__member=self.request.user,
                )
                .select_related("actor", "workspace", "issue", "project")
            ).order_by("created_at")
            issue_comments = (
                IssueComment.objects.filter(issue_id=issue_id)
                .filter(project__project_projectmember__member=self.request.user)
                .order_by("created_at")
                .select_related("actor", "issue", "project", "workspace")
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
        ProjectLitePermission,
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
            type="comment.activity.created",
            requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id")),
            project_id=str(self.kwargs.get("project_id")),
            current_instance=None,
        )

    def perform_update(self, serializer):
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                type="comment.activity.updated",
                requested_data=requested_data,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    IssueCommentSerializer(current_instance).data,
                    cls=DjangoJSONEncoder,
                ),
            )

        return super().perform_update(serializer)

    def perform_destroy(self, instance):
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                type="comment.activity.deleted",
                requested_data=json.dumps(
                    {"comment_id": str(self.kwargs.get("pk", None))}
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    IssueCommentSerializer(current_instance).data,
                    cls=DjangoJSONEncoder,
                ),
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

            issues = Issue.issue_objects.filter(
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

    @method_decorator(gzip_page)
    def get(self, request, slug, project_id, issue_id):
        try:
            sub_issues = (
                Issue.issue_objects.filter(parent_id=issue_id, workspace__slug=slug)
                .select_related("project")
                .select_related("workspace")
                .select_related("state")
                .select_related("parent")
                .prefetch_related("assignees")
                .prefetch_related("labels")
                .annotate(
                    sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                    .order_by()
                    .annotate(count=Func(F("id"), function="Count"))
                    .values("count")
                )
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

            state_distribution = (
                State.objects.filter(~Q(name="Triage"), workspace__slug=slug)
                .annotate(
                    state_count=Count(
                        "state_issue",
                        filter=Q(state_issue__parent_id=issue_id),
                    )
                )
                .order_by("group")
                .values("group", "state_count")
            )

            result = {item["group"]: item["state_count"] for item in state_distribution}

            serializer = IssueLiteSerializer(
                sub_issues,
                many=True,
            )
            return Response(
                {
                    "sub_issues": serializer.data,
                    "state_distribution": result,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    # Assign multiple sub issues
    def post(self, request, slug, project_id, issue_id):
        try:
            parent_issue = Issue.issue_objects.get(pk=issue_id)
            sub_issue_ids = request.data.get("sub_issue_ids", [])

            if not len(sub_issue_ids):
                return Response(
                    {"error": "Sub Issue IDs are required"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            sub_issues = Issue.issue_objects.filter(id__in=sub_issue_ids)

            for sub_issue in sub_issues:
                sub_issue.parent = parent_issue

            _ = Issue.objects.bulk_update(sub_issues, ["parent"], batch_size=10)

            updated_sub_issues = Issue.issue_objects.filter(id__in=sub_issue_ids)

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
        issue_activity.delay(
            type="link.activity.created",
            requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
            actor_id=str(self.request.user.id),
            issue_id=str(self.kwargs.get("issue_id")),
            project_id=str(self.kwargs.get("project_id")),
            current_instance=None,
        )

    def perform_update(self, serializer):
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                type="link.activity.updated",
                requested_data=requested_data,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    IssueLinkSerializer(current_instance).data,
                    cls=DjangoJSONEncoder,
                ),
            )

        return super().perform_update(serializer)

    def perform_destroy(self, instance):
        current_instance = (
            self.get_queryset().filter(pk=self.kwargs.get("pk", None)).first()
        )
        if current_instance is not None:
            issue_activity.delay(
                type="link.activity.deleted",
                requested_data=json.dumps(
                    {"link_id": str(self.kwargs.get("pk", None))}
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(
                    IssueLinkSerializer(current_instance).data,
                    cls=DjangoJSONEncoder,
                ),
            )
        return super().perform_destroy(instance)

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


class IssueAttachmentEndpoint(BaseAPIView):
    serializer_class = IssueAttachmentSerializer
    permission_classes = [
        ProjectEntityPermission,
    ]
    model = IssueAttachment
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, slug, project_id, issue_id):
        try:
            serializer = IssueAttachmentSerializer(data=request.data)
            if serializer.is_valid():
                serializer.save(project_id=project_id, issue_id=issue_id)
                issue_activity.delay(
                    type="attachment.activity.created",
                    requested_data=None,
                    actor_id=str(self.request.user.id),
                    issue_id=str(self.kwargs.get("issue_id", None)),
                    project_id=str(self.kwargs.get("project_id", None)),
                    current_instance=json.dumps(
                        serializer.data,
                        cls=DjangoJSONEncoder,
                    ),
                )
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, slug, project_id, issue_id, pk):
        try:
            issue_attachment = IssueAttachment.objects.get(pk=pk)
            issue_attachment.asset.delete(save=False)
            issue_attachment.delete()
            issue_activity.delay(
                type="attachment.activity.deleted",
                requested_data=None,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=None,
            )

            return Response(status=status.HTTP_204_NO_CONTENT)
        except IssueAttachment.DoesNotExist:
            return Response(
                {"error": "Issue Attachment does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def get(self, request, slug, project_id, issue_id):
        try:
            issue_attachments = IssueAttachment.objects.filter(
                issue_id=issue_id, workspace__slug=slug, project_id=project_id
            )
            serilaizer = IssueAttachmentSerializer(issue_attachments, many=True)
            return Response(serilaizer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssueArchiveViewSet(BaseViewSet):
    permission_classes = [
        ProjectEntityPermission,
    ]
    serializer_class = IssueFlatSerializer
    model = Issue

    def get_queryset(self):
        return (
            Issue.objects.annotate(
                sub_issues_count=Issue.objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(archived_at__isnull=False)
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(workspace__slug=self.kwargs.get("slug"))
            .select_related("project")
            .select_related("workspace")
            .select_related("state")
            .select_related("parent")
            .prefetch_related("assignees")
            .prefetch_related("labels")
        )

    @method_decorator(gzip_page)
    def list(self, request, slug, project_id):
        try:
            filters = issue_filters(request.query_params, "GET")
            show_sub_issues = request.GET.get("show_sub_issues", "true")

            # Custom ordering for priority and state
            priority_order = ["urgent", "high", "medium", "low", None]
            state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]

            order_by_param = request.GET.get("order_by", "-created_at")

            issue_queryset = (
                self.get_queryset()
                .filter(**filters)
                .annotate(cycle_id=F("issue_cycle__cycle_id"))
                .annotate(module_id=F("issue_module__module_id"))
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

            # Priority Ordering
            if order_by_param == "priority" or order_by_param == "-priority":
                priority_order = (
                    priority_order
                    if order_by_param == "priority"
                    else priority_order[::-1]
                )
                issue_queryset = issue_queryset.annotate(
                    priority_order=Case(
                        *[
                            When(priority=p, then=Value(i))
                            for i, p in enumerate(priority_order)
                        ],
                        output_field=CharField(),
                    )
                ).order_by("priority_order")

            # State Ordering
            elif order_by_param in [
                "state__name",
                "state__group",
                "-state__name",
                "-state__group",
            ]:
                state_order = (
                    state_order
                    if order_by_param in ["state__name", "state__group"]
                    else state_order[::-1]
                )
                issue_queryset = issue_queryset.annotate(
                    state_order=Case(
                        *[
                            When(state__group=state_group, then=Value(i))
                            for i, state_group in enumerate(state_order)
                        ],
                        default=Value(len(state_order)),
                        output_field=CharField(),
                    )
                ).order_by("state_order")
            # assignee and label ordering
            elif order_by_param in [
                "labels__name",
                "-labels__name",
                "assignees__first_name",
                "-assignees__first_name",
            ]:
                issue_queryset = issue_queryset.annotate(
                    max_values=Max(
                        order_by_param[1::]
                        if order_by_param.startswith("-")
                        else order_by_param
                    )
                ).order_by(
                    "-max_values" if order_by_param.startswith("-") else "max_values"
                )
            else:
                issue_queryset = issue_queryset.order_by(order_by_param)

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

    def retrieve(self, request, slug, project_id, pk=None):
        try:
            issue = Issue.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                archived_at__isnull=False,
                pk=pk,
            )
            return Response(IssueSerializer(issue).data, status=status.HTTP_200_OK)
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue Does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def unarchive(self, request, slug, project_id, pk=None):
        try:
            issue = Issue.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                archived_at__isnull=False,
                pk=pk,
            )
            issue.archived_at = None
            issue.save()
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"archived_at": None}),
                actor_id=str(request.user.id),
                issue_id=str(issue.id),
                project_id=str(project_id),
                current_instance=None,
            )

            return Response(IssueSerializer(issue).data, status=status.HTTP_200_OK)
        except Issue.DoesNotExist:
            return Response(
                {"error": "Issue Does not exist"}, status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong, please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssueSubscriberViewSet(BaseViewSet):
    serializer_class = IssueSubscriberSerializer
    model = IssueSubscriber

    permission_classes = [
        ProjectEntityPermission,
    ]

    def get_permissions(self):
        if self.action in ["subscribe", "unsubscribe", "subscription_status"]:
            self.permission_classes = [
                ProjectLitePermission,
            ]
        else:
            self.permission_classes = [
                ProjectEntityPermission,
            ]

        return super(IssueSubscriberViewSet, self).get_permissions()

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

    def list(self, request, slug, project_id, issue_id):
        try:
            members = (
                ProjectMember.objects.filter(
                    workspace__slug=slug, project_id=project_id
                )
                .annotate(
                    is_subscribed=Exists(
                        IssueSubscriber.objects.filter(
                            workspace__slug=slug,
                            project_id=project_id,
                            issue_id=issue_id,
                            subscriber=OuterRef("member"),
                        )
                    )
                )
                .select_related("member")
            )
            serializer = ProjectMemberLiteSerializer(members, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": e},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, slug, project_id, issue_id, subscriber_id):
        try:
            issue_subscriber = IssueSubscriber.objects.get(
                project=project_id,
                subscriber=subscriber_id,
                workspace__slug=slug,
                issue=issue_id,
            )
            issue_subscriber.delete()
            return Response(
                status=status.HTTP_204_NO_CONTENT,
            )
        except IssueSubscriber.DoesNotExist:
            return Response(
                {"error": "User is not subscribed to this issue"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def subscribe(self, request, slug, project_id, issue_id):
        try:
            if IssueSubscriber.objects.filter(
                issue_id=issue_id,
                subscriber=request.user,
                workspace__slug=slug,
                project=project_id,
            ).exists():
                return Response(
                    {"message": "User already subscribed to the issue."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subscriber = IssueSubscriber.objects.create(
                issue_id=issue_id,
                subscriber_id=request.user.id,
                project_id=project_id,
            )
            serilaizer = IssueSubscriberSerializer(subscriber)
            return Response(serilaizer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong, please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def unsubscribe(self, request, slug, project_id, issue_id):
        try:
            issue_subscriber = IssueSubscriber.objects.get(
                project=project_id,
                subscriber=request.user,
                workspace__slug=slug,
                issue=issue_id,
            )
            issue_subscriber.delete()
            return Response(
                status=status.HTTP_204_NO_CONTENT,
            )
        except IssueSubscriber.DoesNotExist:
            return Response(
                {"error": "User subscribed to this issue"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def subscription_status(self, request, slug, project_id, issue_id):
        try:
            issue_subscriber = IssueSubscriber.objects.filter(
                issue=issue_id,
                subscriber=request.user,
                workspace__slug=slug,
                project=project_id,
            ).exists()
            return Response({"subscribed": issue_subscriber}, status=status.HTTP_200_OK)
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong, please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class IssueReactionViewSet(BaseViewSet):
    serializer_class = IssueReactionSerializer
    model = IssueReaction
    permission_classes = [
        ProjectLitePermission,
    ]

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

    def perform_create(self, serializer):
        serializer.save(
            issue_id=self.kwargs.get("issue_id"),
            project_id=self.kwargs.get("project_id"),
            actor=self.request.user,
        )

    def destroy(self, request, slug, project_id, issue_id, reaction_code):
        try:
            issue_reaction = IssueReaction.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                issue_id=issue_id,
                reaction=reaction_code,
                actor=request.user,
            )
            issue_reaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except IssueReaction.DoesNotExist:
            return Response(
                {"error": "Issue reaction does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CommentReactionViewSet(BaseViewSet):
    serializer_class = CommentReactionSerializer
    model = CommentReaction
    permission_classes = [
        ProjectLitePermission,
    ]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(comment_id=self.kwargs.get("comment_id"))
            .filter(project__project_projectmember__member=self.request.user)
            .order_by("-created_at")
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(
            actor=self.request.user,
            comment_id=self.kwargs.get("comment_id"),
            project_id=self.kwargs.get("project_id"),
        )

    def destroy(self, request, slug, project_id, comment_id, reaction_code):
        try:
            comment_reaction = CommentReaction.objects.get(
                workspace__slug=slug,
                project_id=project_id,
                comment_id=comment_id,
                reaction=reaction_code,
                actor=request.user,
            )
            comment_reaction.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except CommentReaction.DoesNotExist:
            return Response(
                {"error": "Comment reaction does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
