# Python imports
import json
import uuid
import re

# Django imports
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponseRedirect
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
    Subquery,
)
from django.utils import timezone
from django.conf import settings

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.api.serializers import (
    IssueAttachmentSerializer,
    IssueActivitySerializer,
    IssueCommentSerializer,
    IssueLinkSerializer,
    IssueSerializer,
    LabelSerializer,
    IssueAttachmentUploadSerializer,
    IssueSearchSerializer,
    IssueCommentCreateSerializer,
    IssueLinkCreateSerializer,
    IssueLinkUpdateSerializer,
    LabelCreateUpdateSerializer,
)
from plane.app.permissions import (
    ProjectEntityPermission,
    ProjectLitePermission,
    ProjectMemberPermission,
)
from plane.bgtasks.issue_activities_task import issue_activity
from plane.db.models import (
    Issue,
    IssueActivity,
    FileAsset,
    IssueComment,
    IssueLink,
    Label,
    Project,
    ProjectMember,
    CycleIssue,
    Workspace,
)
from plane.settings.storage import S3Storage
from plane.bgtasks.storage_metadata_task import get_asset_object_metadata
from .base import BaseAPIView
from plane.utils.host import base_host
from plane.bgtasks.webhook_task import model_activity

from plane.utils.openapi import (
    work_item_docs,
    label_docs,
    issue_link_docs,
    issue_comment_docs,
    issue_activity_docs,
    issue_attachment_docs,
)

# drf-spectacular imports
from drf_spectacular.utils import (
    extend_schema,
    OpenApiParameter,
    OpenApiResponse,
    OpenApiExample,
)
from drf_spectacular.types import OpenApiTypes


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
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
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

    @extend_schema(
        operation_id="get_workspace_work_item",
        summary="Retrieve work item by identifiers",
        tags=["Work Items"],
        parameters=[
            OpenApiParameter(
                name="slug",
                description="Workspace slug",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
            ),
            OpenApiParameter(
                name="project__identifier",
                description="Project identifier",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
            ),
            OpenApiParameter(
                name="issue__identifier",
                description="Issue sequence ID",
                required=True,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.PATH,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description="Work item details",
                response=IssueSerializer,
            ),
            404: OpenApiResponse(description="Work item not found"),
        },
    )
    def get(self, request, slug, project__identifier=None, issue__identifier=None):
        """Retrieve work item by identifiers

        Retrieve a specific work item using workspace slug, project identifier, and issue identifier.
        This endpoint provides workspace-level access to work items.
        """
        if issue__identifier and project__identifier:
            issue = Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            ).get(
                workspace__slug=slug,
                project__identifier=project__identifier,
                sequence_id=issue__identifier,
            )
            return Response(
                IssueSerializer(issue, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_200_OK,
            )


class IssueAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to issue.

    """

    model = Issue
    webhook_event = "issue"
    permission_classes = [ProjectEntityPermission]
    serializer_class = IssueSerializer

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
            .order_by(self.kwargs.get("order_by", "-created_at"))
        ).distinct()

    @work_item_docs(
        operation_id="get_work_item",
        summary="List or retrieve work items",
        responses={
            200: OpenApiResponse(
                description="List of issues or issue details",
                response=IssueSerializer,
            ),
            404: OpenApiResponse(description="Issue not found"),
        },
    )
    def get(self, request, slug, project_id, pk=None):
        """List or retrieve work items

        Retrieve a paginated list of all work items in a project, or get details of a specific work item.
        Supports filtering, ordering, and field selection through query parameters.
        """

        external_id = request.GET.get("external_id")
        external_source = request.GET.get("external_source")

        if external_id and external_source:
            issue = Issue.objects.get(
                external_id=external_id,
                external_source=external_source,
                workspace__slug=slug,
                project_id=project_id,
            )
            return Response(
                IssueSerializer(issue, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_200_OK,
            )

        if pk:
            issue = Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            ).get(workspace__slug=slug, project_id=project_id, pk=pk)
            return Response(
                IssueSerializer(issue, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_200_OK,
            )

        # Custom ordering for priority and state
        priority_order = ["urgent", "high", "medium", "low", "none"]
        state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]

        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = (
            self.get_queryset()
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(
                        issue=OuterRef("id"), deleted_at__isnull=True
                    ).values("cycle_id")[:1]
                )
            )
            .annotate(
                link_count=IssueLink.objects.filter(issue=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .annotate(
                attachment_count=FileAsset.objects.filter(
                    issue_id=OuterRef("id"),
                    entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
                )
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
        )

        # Priority Ordering
        if order_by_param == "priority" or order_by_param == "-priority":
            priority_order = (
                priority_order if order_by_param == "priority" else priority_order[::-1]
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

        return self.paginate(
            request=request,
            queryset=(issue_queryset),
            on_results=lambda issues: IssueSerializer(
                issues, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @work_item_docs(
        operation_id="create_work_item",
        summary="Create work item",
        request=IssueSerializer,
        responses={
            201: OpenApiResponse(
                description="Work Item created successfully", response=IssueSerializer
            ),
            400: OpenApiResponse(
                description="Invalid request data", response=IssueSerializer
            ),
            404: OpenApiResponse(description="Project not found"),
            409: OpenApiResponse(
                description="Issue with same external ID already exists"
            ),
        },
    )
    def post(self, request, slug, project_id):
        """Create work item

        Create a new work item in the specified project with the provided details.
        Supports external ID tracking for integration purposes.
        """
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
            # Refetch the issue
            issue = Issue.objects.filter(
                workspace__slug=slug, project_id=project_id, pk=serializer.data["id"]
            ).first()
            issue.created_at = request.data.get("created_at", timezone.now())
            issue.created_by_id = request.data.get("created_by", request.user.id)
            issue.save(update_fields=["created_at", "created_by"])

            # Track the issue
            issue_activity.delay(
                type="issue.activity.created",
                requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data.get("id", None)),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )

            # Send the model activity
            model_activity.delay(
                model_name="issue",
                model_id=str(serializer.data["id"]),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @work_item_docs(
        operation_id="update_work_item",
        summary="Update or create work item",
        request=IssueSerializer,
        responses={
            200: OpenApiResponse(
                description="Work Item updated successfully", response=IssueSerializer
            ),
            400: OpenApiResponse(
                description="Invalid request data", response=IssueSerializer
            ),
            404: OpenApiResponse(description="Work Item not found"),
        },
    )
    def put(self, request, slug, project_id):
        """Update or create work item

        Update an existing work item identified by external ID and source, or create a new one if it doesn't exist.
        Requires external_id and external_source parameters for identification.
        """
        # Get the entities required for putting the issue, external_id and
        # external_source are must to identify the issue here
        project = Project.objects.get(pk=project_id)
        external_id = request.data.get("external_id")
        external_source = request.data.get("external_source")

        # If the external_id and source are present, we need to find the exact
        # issue that needs to be updated with the provided external_id and
        # external_source
        if external_id and external_source:
            try:
                issue = Issue.objects.get(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_id=external_id,
                    external_source=external_source,
                )

                # Get the current instance of the issue in order to track
                # changes and dispatch the issue activity
                current_instance = json.dumps(
                    IssueSerializer(issue).data, cls=DjangoJSONEncoder
                )

                # Get the requested data, encode it as django object and pass it
                # to serializer to validation
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
                    # If the serializer is valid, save the issue and dispatch
                    # the update issue activity worker event.
                    serializer.save()
                    issue_activity.delay(
                        type="issue.activity.updated",
                        requested_data=requested_data,
                        actor_id=str(request.user.id),
                        issue_id=str(issue.id),
                        project_id=str(project_id),
                        current_instance=current_instance,
                        epoch=int(timezone.now().timestamp()),
                    )
                    return Response(serializer.data, status=status.HTTP_200_OK)
                return Response(
                    # If the serializer is not valid, respond with 400 bad
                    # request
                    serializer.errors,
                    status=status.HTTP_400_BAD_REQUEST,
                )
            except Issue.DoesNotExist:
                # If the issue does not exist, a new record needs to be created
                # for the requested data.
                # Serialize the data with the context of the project and
                # workspace
                serializer = IssueSerializer(
                    data=request.data,
                    context={
                        "project_id": project_id,
                        "workspace_id": project.workspace_id,
                        "default_assignee_id": project.default_assignee_id,
                    },
                )

                # If the serializer is valid, save the issue and dispatch the
                # issue activity worker event as created
                if serializer.is_valid():
                    serializer.save()
                    # Refetch the issue
                    issue = Issue.objects.filter(
                        workspace__slug=slug,
                        project_id=project_id,
                        pk=serializer.data["id"],
                    ).first()

                    # If any of the created_at or created_by is present, update
                    # the issue with the provided data, else return with the
                    # default states given.
                    issue.created_at = request.data.get("created_at", timezone.now())
                    issue.created_by_id = request.data.get(
                        "created_by", request.user.id
                    )
                    issue.save(update_fields=["created_at", "created_by"])

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
        else:
            return Response(
                {"error": "external_id and external_source are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @work_item_docs(
        operation_id="patch_work_item",
        summary="Partially update work item",
        request=IssueSerializer,
        responses={
            200: OpenApiResponse(
                description="Work Item patched successfully", response=IssueSerializer
            ),
            400: OpenApiResponse(
                description="Invalid request data", response=IssueSerializer
            ),
            404: OpenApiResponse(description="Work Item not found"),
            409: OpenApiResponse(
                description="Issue with same external ID already exists"
            ),
        },
    )
    def patch(self, request, slug, project_id, pk=None):
        """Update work item

        Partially update an existing work item with the provided fields.
        Supports external ID validation to prevent conflicts.
        """
        issue = Issue.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        project = Project.objects.get(pk=project_id)
        current_instance = json.dumps(
            IssueSerializer(issue).data, cls=DjangoJSONEncoder
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        serializer = IssueSerializer(
            issue,
            data=request.data,
            context={"project_id": project_id, "workspace_id": project.workspace_id},
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

    @work_item_docs(
        operation_id="delete_work_item",
        summary="Delete work item",
        responses={
            204: OpenApiResponse(description="Work Item deleted successfully"),
            403: OpenApiResponse(description="Only admin or creator can delete"),
            404: OpenApiResponse(description="Work Item not found"),
        },
    )
    def delete(self, request, slug, project_id, pk=None):
        """Delete work item

        Permanently delete an existing work item from the project.
        Only admins or the item creator can perform this action.
        """
        issue = Issue.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        if issue.created_by_id != request.user.id and (
            not ProjectMember.objects.filter(
                workspace__slug=slug,
                member=request.user,
                role=20,
                project_id=project_id,
                is_active=True,
            ).exists()
        ):
            return Response(
                {"error": "Only admin or creator can delete the work item"},
                status=status.HTTP_403_FORBIDDEN,
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
    permission_classes = [ProjectMemberPermission]

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

    @label_docs(
        operation_id="create_label",
        request=LabelCreateUpdateSerializer,
        responses={
            201: OpenApiResponse(
                description="Label created successfully", response=LabelSerializer
            ),
            400: OpenApiResponse(
                description="Invalid request data", response=LabelSerializer
            ),
            409: OpenApiResponse(
                description="Label with same name/external ID already exists"
            ),
        },
    )
    def post(self, request, slug, project_id):
        """Create label

        Create a new label in the specified project with name, color, and description.
        Supports external ID tracking for integration purposes.
        """
        try:
            serializer = LabelCreateUpdateSerializer(data=request.data)
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
                label = Label.objects.get(pk=serializer.instance.id)
                serializer = LabelSerializer(label)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
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

    @label_docs(
        operation_id="get_labels",
        responses={
            200: OpenApiResponse(
                description="Labels",
                response=LabelSerializer,
            ),
        },
    )
    def get(self, request, slug, project_id, pk=None):
        """List or retrieve labels

        Retrieve all labels in the project or get details of a specific label.
        Returns paginated results when listing all labels.
        """
        if pk is None:
            return self.paginate(
                request=request,
                queryset=(self.get_queryset()),
                on_results=lambda labels: LabelSerializer(
                    labels, many=True, fields=self.fields, expand=self.expand
                ).data,
            )
        label = self.get_queryset().get(pk=pk)
        serializer = LabelSerializer(label, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @label_docs(
        operation_id="update_label",
        request=LabelCreateUpdateSerializer,
        responses={
            200: OpenApiResponse(
                description="Label updated successfully", response=LabelSerializer
            ),
            400: OpenApiResponse(
                description="Invalid request data", response=LabelSerializer
            ),
            404: OpenApiResponse(description="Label not found"),
            409: OpenApiResponse(
                description="Label with same external ID already exists"
            ),
        },
    )
    def patch(self, request, slug, project_id, pk=None):
        """Update label

        Partially update an existing label's properties like name, color, or description.
        Validates external ID uniqueness if provided.
        """
        label = self.get_queryset().get(pk=pk)
        serializer = LabelCreateUpdateSerializer(label, data=request.data, partial=True)
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
            label = Label.objects.get(pk=serializer.instance.id)
            serializer = LabelSerializer(label)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @label_docs(
        operation_id="delete_label",
        responses={
            204: OpenApiResponse(description="Label deleted successfully"),
            404: OpenApiResponse(description="Label not found"),
        },
    )
    def delete(self, request, slug, project_id, pk=None):
        """Delete label

        Permanently remove a label from the project.
        This action cannot be undone.
        """
        label = self.get_queryset().get(pk=pk)
        label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueLinkAPIEndpoint(BaseAPIView):
    """
    This viewset automatically provides `list`, `create`, `retrieve`,
    `update` and `destroy` actions related to the links of the particular issue.

    """

    permission_classes = [ProjectEntityPermission]

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

    @issue_link_docs(
        operation_id="get_issue_links",
        responses={
            200: OpenApiResponse(
                description="Issue links",
                response=IssueLinkSerializer,
            ),
            404: OpenApiResponse(description="Issue not found"),
        },
    )
    def get(self, request, slug, project_id, issue_id, pk=None):
        """List or retrieve issue links

        Retrieve all links associated with an issue or get details of a specific link.
        Returns paginated results when listing all links.
        """
        if pk is None:
            issue_links = self.get_queryset()
            serializer = IssueLinkSerializer(
                issue_links, fields=self.fields, expand=self.expand
            )
            return self.paginate(
                request=request,
                queryset=(self.get_queryset()),
                on_results=lambda issue_links: IssueLinkSerializer(
                    issue_links, many=True, fields=self.fields, expand=self.expand
                ).data,
            )
        issue_link = self.get_queryset().get(pk=pk)
        serializer = IssueLinkSerializer(
            issue_link, fields=self.fields, expand=self.expand
        )
        return Response(serializer.data, status=status.HTTP_200_OK)

    @issue_link_docs(
        operation_id="create_issue_link",
        request=IssueLinkCreateSerializer,
        responses={
            201: OpenApiResponse(
                description="Issue link created successfully",
                response=IssueLinkSerializer,
            ),
            400: OpenApiResponse(description="Invalid request data"),
            404: OpenApiResponse(description="Issue not found"),
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Create issue link

        Add a new external link to an issue with URL, title, and metadata.
        Automatically tracks link creation activity.
        """
        serializer = IssueLinkCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=issue_id)

            link = IssueLink.objects.get(pk=serializer.instance.id)
            link.created_by_id = request.data.get("created_by", request.user.id)
            link.save(update_fields=["created_by"])
            issue_activity.delay(
                type="link.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                issue_id=str(self.kwargs.get("issue_id")),
                project_id=str(self.kwargs.get("project_id")),
                actor_id=str(link.created_by_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            serializer = IssueLinkSerializer(link)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_link_docs(
        operation_id="update_issue_link",
        request=IssueLinkUpdateSerializer,
        responses={
            200: OpenApiResponse(
                description="Issue link updated successfully",
                response=IssueLinkSerializer,
            ),
            400: OpenApiResponse(description="Invalid request data"),
            404: OpenApiResponse(description="Issue link not found"),
        },
    )
    def patch(self, request, slug, project_id, issue_id, pk):
        """Update issue link

        Modify the URL, title, or metadata of an existing issue link.
        Tracks all changes in issue activity logs.
        """
        issue_link = IssueLink.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk
        )
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            IssueLinkSerializer(issue_link).data, cls=DjangoJSONEncoder
        )
        serializer = IssueLinkSerializer(issue_link, data=request.data, partial=True)
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
            serializer = IssueLinkSerializer(issue_link)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_link_docs(
        operation_id="delete_issue_link",
        responses={
            204: OpenApiResponse(description="Issue link deleted successfully"),
            404: OpenApiResponse(description="Issue link not found"),
        },
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete issue link

        Permanently remove an external link from an issue.
        Records deletion activity for audit purposes.
        """
        issue_link = IssueLink.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk
        )
        current_instance = json.dumps(
            IssueLinkSerializer(issue_link).data, cls=DjangoJSONEncoder
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
    permission_classes = [ProjectLitePermission]

    def get_queryset(self):
        return (
            IssueComment.objects.filter(workspace__slug=self.kwargs.get("slug"))
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

    @issue_comment_docs(
        operation_id="get_issue_comments",
        responses={
            200: OpenApiResponse(
                description="Issue comments",
                response=IssueCommentSerializer,
            ),
            404: OpenApiResponse(description="Issue not found"),
        },
    )
    def get(self, request, slug, project_id, issue_id, pk=None):
        """List or retrieve issue comments

        Retrieve all comments for an issue or get details of a specific comment.
        Returns paginated results when listing all comments.
        """
        if pk:
            issue_comment = self.get_queryset().get(pk=pk)
            serializer = IssueCommentSerializer(
                issue_comment, fields=self.fields, expand=self.expand
            )
            return Response(serializer.data, status=status.HTTP_200_OK)
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda issue_comment: IssueCommentSerializer(
                issue_comment, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @issue_comment_docs(
        operation_id="create_issue_comment",
        request=IssueCommentCreateSerializer,
        responses={
            201: OpenApiResponse(
                description="Issue comment created successfully",
                response=IssueCommentSerializer,
            ),
            400: OpenApiResponse(description="Invalid request data"),
            404: OpenApiResponse(description="Issue not found"),
            409: OpenApiResponse(
                description="Comment with same external ID already exists"
            ),
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Create issue comment

        Add a new comment to an issue with HTML content.
        Supports external ID tracking for integration purposes.
        """
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

        serializer = IssueCommentCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                project_id=project_id, issue_id=issue_id, actor=request.user
            )
            issue_comment = IssueComment.objects.get(pk=serializer.instance.id)
            # Update the created_at and the created_by and save the comment
            issue_comment.created_at = request.data.get("created_at", timezone.now())
            issue_comment.created_by_id = request.data.get(
                "created_by", request.user.id
            )
            issue_comment.save(update_fields=["created_at", "created_by"])

            issue_activity.delay(
                type="comment.activity.created",
                requested_data=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                actor_id=str(issue_comment.created_by_id),
                issue_id=str(self.kwargs.get("issue_id")),
                project_id=str(self.kwargs.get("project_id")),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
            )
            issue_comment = IssueComment.objects.get(pk=serializer.instance.id)
            serializer = IssueCommentSerializer(issue_comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_comment_docs(
        operation_id="update_issue_comment",
        request=IssueCommentCreateSerializer,
        responses={
            200: OpenApiResponse(
                description="Issue comment updated successfully",
                response=IssueCommentSerializer,
            ),
            400: OpenApiResponse(description="Invalid request data"),
            404: OpenApiResponse(description="Issue comment not found"),
            409: OpenApiResponse(
                description="Comment with same external ID already exists"
            ),
        },
    )
    def patch(self, request, slug, project_id, issue_id, pk):
        """Update issue comment

        Modify the content of an existing comment on an issue.
        Validates external ID uniqueness if provided.
        """
        issue_comment = IssueComment.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk
        )
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(
            IssueCommentSerializer(issue_comment).data, cls=DjangoJSONEncoder
        )

        # Validation check if the issue already exists
        if (
            request.data.get("external_id")
            and (issue_comment.external_id != str(request.data.get("external_id")))
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

        serializer = IssueCommentCreateSerializer(
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
            issue_comment = IssueComment.objects.get(pk=serializer.instance.id)
            serializer = IssueCommentSerializer(issue_comment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_comment_docs(
        operation_id="delete_issue_comment",
        responses={
            204: OpenApiResponse(description="Issue comment deleted successfully"),
            404: OpenApiResponse(description="Issue comment not found"),
        },
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete issue comment

        Permanently remove a comment from an issue.
        Records deletion activity for audit purposes.
        """
        issue_comment = IssueComment.objects.get(
            workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk
        )
        current_instance = json.dumps(
            IssueCommentSerializer(issue_comment).data, cls=DjangoJSONEncoder
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
    permission_classes = [ProjectEntityPermission]

    @issue_activity_docs(
        operation_id="get_issue_activities",
        responses={
            200: OpenApiResponse(
                description="Issue activities",
                response=IssueActivitySerializer,
            ),
            404: OpenApiResponse(description="Issue not found"),
        },
    )
    def get(self, request, slug, project_id, issue_id, pk=None):
        """List or retrieve issue activities

        Retrieve chronological activity logs for an issue or get details of a specific activity.
        Excludes comment, vote, reaction, and draft activities.
        """
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
                issue_activity, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class IssueAttachmentEndpoint(BaseAPIView):
    serializer_class = IssueAttachmentSerializer
    permission_classes = [ProjectEntityPermission]
    model = FileAsset

    @issue_attachment_docs(
        operation_id="create_issue_attachment",
        request=IssueAttachmentUploadSerializer,
        responses={
            200: OpenApiResponse(
                description="Presigned download URL generated successfully",
                examples=[
                    OpenApiExample(
                        name="Issue Attachment Response",
                        value={
                            "upload_data": {
                                "url": "https://s3.amazonaws.com/bucket/file.pdf?signed-url",
                                "fields": {
                                    "key": "file.pdf",
                                    "AWSAccessKeyId": "AKIAIOSFODNN7EXAMPLE",
                                    "policy": "EXAMPLE",
                                    "signature": "EXAMPLE",
                                    "acl": "public-read",
                                    "Content-Type": "application/pdf",
                                },
                            },
                            "asset_id": "550e8400-e29b-41d4-a716-446655440000",
                            "asset_url": "https://s3.amazonaws.com/bucket/file.pdf?signed-url",
                            "attachment": {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "name": "file.pdf",
                                "type": "application/pdf",
                                "size": 1234567890,
                                "url": "https://s3.amazonaws.com/bucket/file.pdf?signed-url",
                            },
                        },
                    )
                ],
            ),
            400: OpenApiResponse(
                description="Validation error",
                examples=[
                    OpenApiExample(
                        name="Missing required fields",
                        value={
                            "error": "Name and size are required fields.",
                            "status": False,
                        },
                    ),
                    OpenApiExample(
                        name="Invalid file type",
                        value={"error": "Invalid file type.", "status": False},
                    ),
                ],
            ),
            404: OpenApiResponse(
                description="Issue or Project or Workspace not found",
                examples=[
                    OpenApiExample(
                        name="Workspace not found",
                        value={"error": "Workspace not found"},
                    ),
                    OpenApiExample(
                        name="Project not found", value={"error": "Project not found"}
                    ),
                    OpenApiExample(
                        name="Issue not found", value={"error": "Issue not found"}
                    ),
                ],
            ),
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Create issue attachment

        Generate presigned URL for uploading file attachments to an issue.
        Validates file type and size before creating the attachment record.
        """
        name = request.data.get("name")
        type = request.data.get("type", False)
        size = request.data.get("size")
        external_id = request.data.get("external_id")
        external_source = request.data.get("external_source")

        # Check if the request is valid
        if not name or not size:
            return Response(
                {"error": "Invalid request.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        size_limit = min(size, settings.FILE_SIZE_LIMIT)

        if not type or type not in settings.ATTACHMENT_MIME_TYPES:
            return Response(
                {"error": "Invalid file type.", "status": False},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Get the workspace
        workspace = Workspace.objects.get(slug=slug)

        # asset key
        asset_key = f"{workspace.id}/{uuid.uuid4().hex}-{name}"

        if (
            request.data.get("external_id")
            and request.data.get("external_source")
            and FileAsset.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                external_source=request.data.get("external_source"),
                external_id=request.data.get("external_id"),
                issue_id=issue_id,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            ).exists()
        ):
            asset = FileAsset.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                external_source=request.data.get("external_source"),
                external_id=request.data.get("external_id"),
                issue_id=issue_id,
                entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            ).first()
            return Response(
                {
                    "error": "Issue with the same external id and external source already exists",
                    "id": str(asset.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

        # Create a File Asset
        asset = FileAsset.objects.create(
            attributes={"name": name, "type": type, "size": size_limit},
            asset=asset_key,
            size=size_limit,
            workspace_id=workspace.id,
            created_by=request.user,
            issue_id=issue_id,
            project_id=project_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            external_id=external_id,
            external_source=external_source,
        )

        # Get the presigned URL
        storage = S3Storage(request=request)
        # Generate a presigned URL to share an S3 object
        presigned_url = storage.generate_presigned_post(
            object_name=asset_key, file_type=type, file_size=size_limit
        )
        # Return the presigned URL
        return Response(
            {
                "upload_data": presigned_url,
                "asset_id": str(asset.id),
                "attachment": IssueAttachmentSerializer(asset).data,
                "asset_url": asset.asset_url,
            },
            status=status.HTTP_200_OK,
        )

    @issue_attachment_docs(
        operation_id="delete_issue_attachment",
        responses={
            204: OpenApiResponse(description="Issue attachment deleted successfully"),
            404: OpenApiResponse(description="Issue attachment not found"),
        },
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete issue attachment

        Soft delete an attachment from an issue by marking it as deleted.
        Records deletion activity and triggers metadata cleanup.
        """
        issue_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )
        issue_attachment.is_deleted = True
        issue_attachment.deleted_at = timezone.now()
        issue_attachment.save()

        issue_activity.delay(
            type="attachment.activity.deleted",
            requested_data=None,
            actor_id=str(self.request.user.id),
            issue_id=str(issue_id),
            project_id=str(project_id),
            current_instance=None,
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=base_host(request=request, is_app=True),
        )

        # Get the storage metadata
        if not issue_attachment.storage_metadata:
            get_asset_object_metadata.delay(str(issue_attachment.id))
        issue_attachment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @issue_attachment_docs(
        operation_id="get_issue_attachment",
        responses={
            200: OpenApiResponse(
                description="Issue attachment",
                response=IssueAttachmentSerializer,
            ),
            404: OpenApiResponse(description="Issue attachment not found"),
        },
    )
    def get(self, request, slug, project_id, issue_id, pk=None):
        """List or download issue attachments

        List all attachments for an issue or generate download URL for a specific attachment.
        Returns presigned URL for secure file access.
        """
        if pk:
            # Get the asset
            asset = FileAsset.objects.get(
                id=pk, workspace__slug=slug, project_id=project_id
            )

            # Check if the asset is uploaded
            if not asset.is_uploaded:
                return Response(
                    {"error": "The asset is not uploaded.", "status": False},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            storage = S3Storage(request=request)
            presigned_url = storage.generate_presigned_url(
                object_name=asset.asset.name,
                disposition="attachment",
                filename=asset.attributes.get("name"),
            )
            return HttpResponseRedirect(presigned_url)

        # Get all the attachments
        issue_attachments = FileAsset.objects.filter(
            issue_id=issue_id,
            entity_type=FileAsset.EntityTypeContext.ISSUE_ATTACHMENT,
            workspace__slug=slug,
            project_id=project_id,
            is_uploaded=True,
        )
        # Serialize the attachments
        serializer = IssueAttachmentSerializer(issue_attachments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @issue_attachment_docs(
        operation_id="upload_issue_attachment",
        request={
            "application/json": {
                "type": "object",
                "properties": {"file": {"type": "string", "format": "binary"}},
            }
        },
        responses={
            200: OpenApiResponse(description="Issue attachment uploaded successfully"),
            404: OpenApiResponse(description="Issue attachment not found"),
        },
    )
    def patch(self, request, slug, project_id, issue_id, pk):
        """Confirm attachment upload

        Mark an attachment as uploaded after successful file transfer to storage.
        Triggers activity logging and metadata extraction.
        """
        issue_attachment = FileAsset.objects.get(
            pk=pk, workspace__slug=slug, project_id=project_id
        )
        serializer = IssueAttachmentSerializer(issue_attachment)

        # Send this activity only if the attachment is not uploaded before
        if not issue_attachment.is_uploaded:
            issue_activity.delay(
                type="attachment.activity.created",
                requested_data=None,
                actor_id=str(self.request.user.id),
                issue_id=str(self.kwargs.get("issue_id", None)),
                project_id=str(self.kwargs.get("project_id", None)),
                current_instance=json.dumps(serializer.data, cls=DjangoJSONEncoder),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=base_host(request=request, is_app=True),
            )

            # Update the attachment
            issue_attachment.is_uploaded = True
            issue_attachment.created_by = request.user

        # Get the storage metadata
        if not issue_attachment.storage_metadata:
            get_asset_object_metadata.delay(str(issue_attachment.id))
        issue_attachment.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueSearchEndpoint(BaseAPIView):
    """Endpoint to search across multiple fields in the issues"""

    @extend_schema(
        operation_id="search_issues",
        tags=["Work Items"],
        parameters=[
            OpenApiParameter(
                name="slug",
                description="Workspace slug",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH,
            ),
            OpenApiParameter(
                name="search",
                description="Search query",
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="limit",
                description="Limit",
                required=False,
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="workspace_search",
                description="Workspace search",
                required=False,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
            ),
            OpenApiParameter(
                name="project_id",
                description="Project ID",
                required=False,
                type=OpenApiTypes.UUID,
                location=OpenApiParameter.QUERY,
            ),
        ],
        responses={
            200: OpenApiResponse(
                description="Issue search results",
                response=IssueSearchSerializer,
            ),
        },
    )
    def get(self, request, slug):
        """Search issues

        Perform semantic search across issue names, sequence IDs, and project identifiers.
        Supports workspace-wide or project-specific search with configurable result limits.
        """
        query = request.query_params.get("search", False)
        limit = request.query_params.get("limit", 10)
        workspace_search = request.query_params.get("workspace_search", "false")
        project_id = request.query_params.get("project_id", False)

        if not query:
            return Response({"issues": []}, status=status.HTTP_200_OK)

        # Build search query
        fields = ["name", "sequence_id", "project__identifier"]
        q = Q()
        for field in fields:
            if field == "sequence_id":
                # Match whole integers only (exclude decimal numbers)
                sequences = re.findall(r"\b\d+\b", query)
                for sequence_id in sequences:
                    q |= Q(**{"sequence_id": sequence_id})
            else:
                q |= Q(**{f"{field}__icontains": query})

        # Filter issues
        issues = Issue.issue_objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            workspace__slug=slug,
        )

        # Apply project filter if not searching across workspace
        if workspace_search == "false" and project_id:
            issues = issues.filter(project_id=project_id)

        # Get results
        issue_results = issues.distinct().values(
            "name",
            "id",
            "sequence_id",
            "project__identifier",
            "project_id",
            "workspace__slug",
        )[: int(limit)]

        return Response({"issues": issue_results}, status=status.HTTP_200_OK)
