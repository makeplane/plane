# Python imports
import json

from django.core.serializers.json import DjangoJSONEncoder

# Django imports
from django.db import IntegrityError
from django.db.models import (
    Case,
    CharField,
    Exists,
    F,
    Func,
    Max,
    OuterRef,
    Q,
    Value,
    When,
)
from django.utils import timezone

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import (
    IssueActivitySerializer,
    IssueCommentSerializer,
    IssueLinkSerializer,
    IssueSerializer,
    LabelSerializer,
)
from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
    ProjectMemberPermission,
)
from plane.bgtasks.issue_activites_task import issue_activity
from plane.db.models import (
    Issue,
    IssueActivity,
    IssueAttachment,
    IssueComment,
    IssueLink,
    Label,
    Project,
    ProjectMember,
)

from .base import BaseAPIView


class WorkspaceIssueAPIEndpoint(BaseAPIView):
    """
    This viewset provides `retrieveByIssueId` on workspace level

    """

    model = Issue
    webhook_event = "issue"
    permission_classes = [ProjectEntityPermission]
    serializer_class = IssueSerializer

    @property
    def project__identifier(self):
        return self.kwargs.get("project__identifier", None)

    def get_queryset(self):
        return (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__identifier=self.kwargs.get("project__identifier"))
            .select_related("project")
            .select_related("workspace")
            .select_related("state")
            .select_related("parent")
            .prefetch_related("assignees")
            .prefetch_related("labels")
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    def get(
        self, request, slug, project__identifier=None, issue__identifier=None
    ):
        if issue__identifier and project__identifier:
            issue = Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            ).get(
                workspace__slug=slug,
                project__identifier=project__identifier,
                sequence_id=issue__identifier,
            )
            return Response(
                IssueSerializer(
                    issue,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
                status=status.HTTP_200_OK,
            )


class IssueAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to issue.

    """

    model = Issue
    webhook_event = "issue"
    permission_classes = [
        ProjectEntityPermission,
    ]
    serializer_class = IssueSerializer

    def get_queryset(self):
        return (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
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
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    def get(self, request, slug, project_id, pk=None):
        if pk:
            issue = Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(
                    parent=OuterRef("id")
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            ).get(workspace__slug=slug, project_id=project_id, pk=pk)
            return Response(
                IssueSerializer(
                    issue,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
                status=status.HTTP_200_OK,
            )

        # Custom ordering for priority and state
        priority_order = ["urgent", "high", "medium", "low", "none"]
        state_order = [
            "backlog",
            "unstarted",
            "started",
            "completed",
            "cancelled",
        ]

        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = (
            self.get_queryset()
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
                "-max_values"
                if order_by_param.startswith("-")
                else "max_values"
            )
        else:
            issue_queryset = issue_queryset.order_by(order_by_param)

        return self.paginate(
            request=request,
            queryset=(issue_queryset),
            on_results=lambda issues: IssueSerializer(
                issues,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )

    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)

        serializer = IssueSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "default_assignee_id": project.default_assignee_id,
            },
        )

        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and request.data.get("external_source")
                and Issue.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                issue = Issue.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    external_id=request.data.get("external_id"),
                    external_source=request.data.get("external_source"),
                ).first()
                return Response(
                    {
                        "error": "Issue with the same external id and external source already exists",
                        "id": str(issue.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            serializer.save()

            # Track the issue
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(
                    self.request.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data.get("id", None)),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, project_id, pk=None):
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        project = Project.objects.get(pk=project_id)
        current_instance = json.dumps(
            IssueSerializer(issue).data, cls=DjangoJSONEncoder
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        serializer = IssueSerializer(
            issue,
            data=request.data,
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
            },
            partial=True,
        )
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and (issue.external_id != str(request.data.get("external_id")))
                and Issue.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get(
                        "external_source", issue.external_source
                    ),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Issue with the same external id and external source already exists",
                        "id": str(issue.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            serializer.save()
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(pk),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, pk=None):
        issue = Issue.objects.get(
            workspace__slug=slug, project_id=project_id, pk=pk
        )
        current_instance = json.dumps(
            IssueSerializer(issue).data, cls=DjangoJSONEncoder
        )
        issue.delete()
        issue_activity.delay(
            type="issue.activity.deleted",
            requested_data=json.dumps({"issue_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(pk),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class LabelAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to the labels.

    """

    serializer_class = LabelSerializer
    model = Label
    permission_classes = [
        ProjectMemberPermission,
    ]

    def get_queryset(self):
        return (
            Label.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("project")
            .select_related("workspace")
            .select_related("parent")
            .distinct()
            .order_by(self.kwargs.get("order_by", "-created_at"))
        )

    def post(self, request, slug, project_id):
        try:
            serializer = LabelSerializer(data=request.data)
            if serializer.is_valid():
                if (
                    request.data.get("external_id")
                    and request.data.get("external_source")
                    and Label.objects.filter(
                        project_id=project_id,
                        workspace__slug=slug,
                        external_source=request.data.get("external_source"),
                        external_id=request.data.get("external_id"),
                    ).exists()
                ):
                    label = Label.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        external_id=request.data.get("external_id"),
                        external_source=request.data.get("external_source"),
                    ).first()
                    return Response(
                        {
                            "error": "Label with the same external id and external source already exists",
                            "id": str(label.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                serializer.save(project_id=project_id)
                return Response(
                    serializer.data, status=status.HTTP_201_CREATED
                )
            return Response(
                serializer.errors, status=status.HTTP_400_BAD_REQUEST
            )
        except IntegrityError:
            label = Label.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                name=request.data.get("name"),
            ).first()
            return Response(
                {
                    "error": "Label with the same name already exists in the project",
                    "id": str(label.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

    def get(self, request, slug, project_id, pk=None):
        if pk is None:
            return self.paginate(
                request=request,
                queryset=(self.get_queryset()),
                on_results=lambda labels: LabelSerializer(
                    labels,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
            )
        label = self.get_queryset().get(pk=pk)
        serializer = LabelSerializer(
            label,
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, slug, project_id, pk=None):
        label = self.get_queryset().get(pk=pk)
        serializer = LabelSerializer(label, data=request.data, partial=True)
        if serializer.is_valid():
            if (
                str(request.data.get("external_id"))
                and (label.external_id != str(request.data.get("external_id")))
                and Issue.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get(
                        "external_source", label.external_source
                    ),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Label with the same external id and external source already exists",
                        "id": str(label.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, pk=None):
        label = self.get_queryset().get(pk=pk)
        label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueLinkAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to the links of the particular issue.

    """

    permission_classes = [
        ProjectEntityPermission,
    ]

    model = IssueLink
    serializer_class = IssueLinkSerializer

    def get_queryset(self):
        return (
            IssueLink.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id, issue_id, pk=None):
        if pk is None:
            issue_links = self.get_queryset()
            serializer = IssueLinkSerializer(
                issue_links,
                fields=self.fields,
                expand=self.expand,
            )
            return self.paginate(
                request=request,
                queryset=(self.get_queryset()),
                on_results=lambda issue_links: IssueLinkSerializer(
                    issue_links,
                    many=True,
                    fields=self.fields,
                    expand=self.expand,
                ).data,
            )
        issue_link = self.get_queryset().get(pk=pk)
        serializer = IssueLinkSerializer(
            issue_link,
            fields=self.fields,
            expand=self.expand,
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, slug, project_id, issue_id):
        serializer = IssueLinkSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
            )
            issue_activity.delay(
                type="link.activity.created",
                requested_data=json.dumps(
                    serializer.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id")),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, project_id, issue_id, pk):
        issue_link = IssueLink.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            IssueLinkSerializer(issue_link).data,
            cls=DjangoJSONEncoder,
        )
        serializer = IssueLinkSerializer(
            issue_link, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="link.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, issue_id, pk):
        issue_link = IssueLink.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        current_instance = json.dumps(
            IssueLinkSerializer(issue_link).data,
            cls=DjangoJSONEncoder,
        )
        issue_activity.delay(
            type="link.activity.deleted",
            requested_data=json.dumps({"link_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )
        issue_link.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueCommentAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to comments of the particular issue.

    """

    serializer_class = IssueCommentSerializer
    model = IssueComment
    webhook_event = "issue_comment"
    permission_classes = [
        ProjectLitePermission,
    ]

    def get_queryset(self):
        return (
            IssueComment.objects.filter(
                workspace__slug=self.kwargs.get("slug")
            )
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(issue_id=self.kwargs.get("issue_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("workspace", "project", "issue", "actor")
            .annotate(
                is_member=Exists(
                    ProjectMember.objects.filter(
                        workspace__slug=self.kwargs.get("slug"),
                        project_id=self.kwargs.get("project_id"),
                        member_id=self.request.user.id,
                        is_active=True,
                    )
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    def get(self, request, slug, project_id, issue_id, pk=None):
        if pk:
            issue_comment = self.get_queryset().get(pk=pk)
            serializer = IssueCommentSerializer(
                issue_comment,
                fields=self.fields,
                expand=self.expand,
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda issue_comment: IssueCommentSerializer(
                issue_comment,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )

    def post(self, request, slug, project_id, issue_id):
        # Validation check if the issue already exists
        if (
            request.data.get("external_id")
            and request.data.get("external_source")
            and IssueComment.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                external_source=request.data.get("external_source"),
                external_id=request.data.get("external_id"),
            ).exists()
        ):
            issue_comment = IssueComment.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                external_id=request.data.get("external_id"),
                external_source=request.data.get("external_source"),
            ).first()
            return Response(
                {
                    "error": "Issue Comment with the same external id and external source already exists",
                    "id": str(issue_comment.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = IssueCommentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id,
                issue_id=issue_id,
                actor=request.user,
            )
            issue_activity.delay(
                type="comment.activity.created",
                requested_data=json.dumps(
                    serializer.data, cls=DjangoJSONEncoder
                ),
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id")),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, slug, project_id, issue_id, pk):
        issue_comment = IssueComment.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            IssueCommentSerializer(issue_comment).data,
            cls=DjangoJSONEncoder,
        )

        # Validation check if the issue already exists
        if (
            request.data.get("external_id")
            and (
                issue_comment.external_id
                != str(request.data.get("external_id"))
            )
            and IssueComment.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                external_source=request.data.get(
                    "external_source", issue_comment.external_source
                ),
                external_id=request.data.get("external_id"),
            ).exists()
        ):
            return Response(
                {
                    "error": "Issue Comment with the same external id and external source already exists",
                    "id": str(issue_comment.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = IssueCommentSerializer(
            issue_comment, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            issue_activity.delay(
                type="comment.activity.updated",
                requested_data=requested_data,
                actor_id=str(request.user.id),
                issue_id=str(issue_id),
                project_id=str(project_id),
                current_instance=current_instance,
                epoch=int(timezone.now().timestamp()),
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug, project_id, issue_id, pk):
        issue_comment = IssueComment.objects.get(
            workspace__slug=slug,
            project_id=project_id,
            issue_id=issue_id,
            pk=pk,
        )
        current_instance = json.dumps(
            IssueCommentSerializer(issue_comment).data,
            cls=DjangoJSONEncoder,
        )
        issue_comment.delete()
        issue_activity.delay(
            type="comment.activity.deleted",
            requested_data=json.dumps({"comment_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=current_instance,
            epoch=int(timezone.now().timestamp()),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueActivityAPIEndpoint(BaseAPIView):
    permission_classes = [
        ProjectEntityPermission,
    ]

    def get(self, request, slug, project_id, issue_id, pk=None):
        issue_activities = (
            IssueActivity.objects.filter(
                issue_id=issue_id, workspace__slug=slug, project_id=project_id
            )
            .filter(
                ~Q(field__in=["comment", "vote", "reaction", "draft"]),
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("actor", "workspace", "issue", "project")
        ).order_by(request.GET.get("order_by", "created_at"))

        if pk:
            issue_activities = issue_activities.get(pk=pk)
            serializer = IssueActivitySerializer(issue_activities)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return self.paginate(
            request=request,
            queryset=(issue_activities),
            on_results=lambda issue_activity: IssueActivitySerializer(
                issue_activity,
                many=True,
                fields=self.fields,
                expand=self.expand,
            ).data,
        )
