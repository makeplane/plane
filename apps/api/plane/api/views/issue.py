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

# drf-spectacular imports
from drf_spectacular.utils import (
    extend_schema,
    OpenApiResponse,
    OpenApiExample,
    OpenApiRequest,
)

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
from plane.app.permissions import ROLE
from plane.utils.openapi import (
    work_item_docs,
    label_docs,
    issue_link_docs,
    issue_comment_docs,
    issue_activity_docs,
    issue_attachment_docs,
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_IDENTIFIER_PARAMETER,
    ISSUE_IDENTIFIER_PARAMETER,
    PROJECT_ID_PARAMETER,
    ISSUE_ID_PARAMETER,
    LABEL_ID_PARAMETER,
    COMMENT_ID_PARAMETER,
    LINK_ID_PARAMETER,
    ATTACHMENT_ID_PARAMETER,
    ACTIVITY_ID_PARAMETER,
    PROJECT_ID_QUERY_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    EXTERNAL_ID_PARAMETER,
    EXTERNAL_SOURCE_PARAMETER,
    ORDER_BY_PARAMETER,
    SEARCH_PARAMETER_REQUIRED,
    LIMIT_PARAMETER,
    WORKSPACE_SEARCH_PARAMETER,
    FIELDS_PARAMETER,
    EXPAND_PARAMETER,
    create_paginated_response,
    # Request Examples
    ISSUE_CREATE_EXAMPLE,
    ISSUE_UPDATE_EXAMPLE,
    ISSUE_UPSERT_EXAMPLE,
    LABEL_CREATE_EXAMPLE,
    LABEL_UPDATE_EXAMPLE,
    ISSUE_LINK_CREATE_EXAMPLE,
    ISSUE_LINK_UPDATE_EXAMPLE,
    ISSUE_COMMENT_CREATE_EXAMPLE,
    ISSUE_COMMENT_UPDATE_EXAMPLE,
    ISSUE_ATTACHMENT_UPLOAD_EXAMPLE,
    ATTACHMENT_UPLOAD_CONFIRM_EXAMPLE,
    # Response Examples
    ISSUE_EXAMPLE,
    LABEL_EXAMPLE,
    ISSUE_LINK_EXAMPLE,
    ISSUE_COMMENT_EXAMPLE,
    ISSUE_ATTACHMENT_EXAMPLE,
    ISSUE_ATTACHMENT_NOT_UPLOADED_EXAMPLE,
    ISSUE_SEARCH_EXAMPLE,
    WORK_ITEM_NOT_FOUND_RESPONSE,
    ISSUE_NOT_FOUND_RESPONSE,
    PROJECT_NOT_FOUND_RESPONSE,
    EXTERNAL_ID_EXISTS_RESPONSE,
    DELETED_RESPONSE,
    ADMIN_ONLY_RESPONSE,
    LABEL_NOT_FOUND_RESPONSE,
    LABEL_NAME_EXISTS_RESPONSE,
    INVALID_REQUEST_RESPONSE,
    LINK_NOT_FOUND_RESPONSE,
    COMMENT_NOT_FOUND_RESPONSE,
    ATTACHMENT_NOT_FOUND_RESPONSE,
    BAD_SEARCH_REQUEST_RESPONSE,
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
    WORKSPACE_NOT_FOUND_RESPONSE,
)
from plane.bgtasks.work_item_link_task import crawl_work_item_link_title


def user_has_issue_permission(user_id, project_id, issue=None, allowed_roles=None, allow_creator=True):
    if allow_creator and issue is not None and user_id == issue.created_by_id:
        return True

    qs = ProjectMember.objects.filter(
        project_id=project_id,
        member_id=user_id,
        is_active=True,
    )
    if allowed_roles is not None:
        qs = qs.filter(role__in=allowed_roles)

    return qs.exists()


class WorkspaceIssueAPIEndpoint(BaseAPIView):
    """
    This viewset provides `retrieveByIssueId` on workspace level

    """

    model = Issue
    webhook_event = "issue"
    permission_classes = [ProjectEntityPermission]
    serializer_class = IssueSerializer
    use_read_replica = True

    @property
    def project_identifier(self):
        return self.kwargs.get("project_identifier", None)

    def get_queryset(self):
        return (
            Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            )
            .filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project__identifier=self.kwargs.get("project_identifier"))
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
        description="Retrieve a specific work item using workspace slug, project identifier, and issue identifier.",
        tags=["Work Items"],
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_IDENTIFIER_PARAMETER,
            ISSUE_IDENTIFIER_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Work item details",
                response=IssueSerializer,
                examples=[ISSUE_EXAMPLE],
            ),
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_identifier=None, issue_identifier=None):
        """Retrieve work item by identifiers

        Retrieve a specific work item using workspace slug, project identifier, and issue identifier.
        This endpoint provides workspace-level access to work items.
        """
        if issue_identifier and project_identifier:
            issue = Issue.issue_objects.annotate(
                sub_issues_count=Issue.issue_objects.filter(parent=OuterRef("id"))
                .order_by()
                .annotate(count=Func(F("id"), function="Count"))
                .values("count")
            ).get(
                workspace__slug=slug,
                project__identifier=project_identifier,
                sequence_id=issue_identifier,
            )
            return Response(
                IssueSerializer(issue, fields=self.fields, expand=self.expand).data,
                status=status.HTTP_200_OK,
            )


class IssueListCreateAPIEndpoint(BaseAPIView):
    """
    This viewset provides `list` and `create` on issue level
    """

    model = Issue
    webhook_event = "issue"
    permission_classes = [ProjectEntityPermission]
    serializer_class = IssueSerializer
    use_read_replica = True

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
        operation_id="list_work_items",
        summary="List work items",
        description="Retrieve a paginated list of all work items in a project. Supports filtering, ordering, and field selection through query parameters.",  # noqa: E501
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            EXTERNAL_ID_PARAMETER,
            EXTERNAL_SOURCE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssueSerializer,
                "PaginatedWorkItemResponse",
                "Paginated list of work items",
                "Paginated Work Items",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        """List work items

        Retrieve a paginated list of all work items in a project.
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

        # Custom ordering for priority and state
        priority_order = ["urgent", "high", "medium", "low", "none"]
        state_order = ["backlog", "unstarted", "started", "completed", "cancelled"]

        order_by_param = request.GET.get("order_by", "-created_at")

        issue_queryset = (
            self.get_queryset()
            .annotate(
                cycle_id=Subquery(
                    CycleIssue.objects.filter(issue=OuterRef("id"), deleted_at__isnull=True).values("cycle_id")[:1]
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

        total_issue_queryset = Issue.issue_objects.filter(project_id=project_id, workspace__slug=slug)

        # Priority Ordering
        if order_by_param == "priority" or order_by_param == "-priority":
            priority_order = priority_order if order_by_param == "priority" else priority_order[::-1]
            issue_queryset = issue_queryset.annotate(
                priority_order=Case(
                    *[When(priority=p, then=Value(i)) for i, p in enumerate(priority_order)],
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
            state_order = state_order if order_by_param in ["state__name", "state__group"] else state_order[::-1]
            issue_queryset = issue_queryset.annotate(
                state_order=Case(
                    *[When(state__group=state_group, then=Value(i)) for i, state_group in enumerate(state_order)],
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
                max_values=Max(order_by_param[1::] if order_by_param.startswith("-") else order_by_param)
            ).order_by("-max_values" if order_by_param.startswith("-") else "max_values")
        else:
            issue_queryset = issue_queryset.order_by(order_by_param)

        return self.paginate(
            request=request,
            queryset=(issue_queryset),
            total_count_queryset=total_issue_queryset,
            on_results=lambda issues: IssueSerializer(issues, many=True, fields=self.fields, expand=self.expand).data,
        )

    @work_item_docs(
        operation_id="create_work_item",
        summary="Create work item",
        description="Create a new work item in the specified project with the provided details.",
        request=OpenApiRequest(
            request=IssueSerializer,
            examples=[ISSUE_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Work Item created successfully",
                response=IssueSerializer,
                examples=[ISSUE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
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
            issue = Issue.objects.filter(workspace__slug=slug, project_id=project_id, pk=serializer.data["id"]).first()
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


class IssueDetailAPIEndpoint(BaseAPIView):
    """Issue Detail Endpoint"""

    model = Issue
    webhook_event = "issue"
    permission_classes = [ProjectEntityPermission]
    serializer_class = IssueSerializer
    use_read_replica = True

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
        operation_id="retrieve_work_item",
        summary="Retrieve work item",
        description="Retrieve details of a specific work item.",
        parameters=[
            PROJECT_ID_PARAMETER,
            EXTERNAL_ID_PARAMETER,
            EXTERNAL_SOURCE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="List of issues or issue details",
                response=IssueSerializer,
                examples=[ISSUE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve work item

        Retrieve details of a specific work item.
        Supports filtering, ordering, and field selection through query parameters.
        """

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

    @work_item_docs(
        operation_id="put_work_item",
        summary="Update or create work item",
        description="Update an existing work item identified by external ID and source, or create a new one if it doesn't exist. Requires external_id and external_source parameters for identification.",  # noqa: E501
        request=OpenApiRequest(
            request=IssueSerializer,
            examples=[ISSUE_UPSERT_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Work Item updated successfully",
                response=IssueSerializer,
                examples=[ISSUE_EXAMPLE],
            ),
            201: OpenApiResponse(
                description="Work Item created successfully",
                response=IssueSerializer,
                examples=[ISSUE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
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
                current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)

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
                    issue.created_by_id = request.data.get("created_by", request.user.id)
                    issue.save(update_fields=["created_at", "created_by"])

                    issue_activity.delay(
                        type="issue.activity.created",
                        requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
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
        operation_id="update_work_item",
        summary="Partially update work item",
        description="Partially update an existing work item with the provided fields. Supports external ID validation to prevent conflicts.",  # noqa: E501
        parameters=[
            PROJECT_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IssueSerializer,
            examples=[ISSUE_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Work Item patched successfully",
                response=IssueSerializer,
                examples=[ISSUE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Update work item

        Partially update an existing work item with the provided fields.
        Supports external ID validation to prevent conflicts.
        """
        issue = Issue.objects.get(workspace__slug=slug, project_id=project_id, pk=pk)
        project = Project.objects.get(pk=project_id)
        current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)
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
                    external_source=request.data.get("external_source", issue.external_source),
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
        description="Permanently delete an existing work item from the project. Only admins or the item creator can perform this action.",  # noqa: E501
        parameters=[
            PROJECT_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            403: ADMIN_ONLY_RESPONSE,
            404: WORK_ITEM_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
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
        current_instance = json.dumps(IssueSerializer(issue).data, cls=DjangoJSONEncoder)
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


class LabelListCreateAPIEndpoint(BaseAPIView):
    """Label List and Create Endpoint"""

    serializer_class = LabelSerializer
    model = Label
    permission_classes = [ProjectMemberPermission]
    use_read_replica = True

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
        description="Create a new label in the specified project with name, color, and description.",
        request=OpenApiRequest(
            request=LabelCreateUpdateSerializer,
            examples=[LABEL_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Label created successfully",
                response=LabelSerializer,
                examples=[LABEL_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            409: LABEL_NAME_EXISTS_RESPONSE,
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
        operation_id="list_labels",
        description="Retrieve all labels in a project. Supports filtering by name and color.",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                LabelSerializer,
                "PaginatedLabelResponse",
                "Paginated list of labels",
                "Paginated Labels",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: PROJECT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        """List labels

        Retrieve all labels in the project.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda labels: LabelSerializer(labels, many=True, fields=self.fields, expand=self.expand).data,
        )


class LabelDetailAPIEndpoint(LabelListCreateAPIEndpoint):
    """Label Detail Endpoint"""

    serializer_class = LabelSerializer
    model = Label
    permission_classes = [ProjectMemberPermission]
    use_read_replica = True

    @label_docs(
        operation_id="get_labels",
        description="Retrieve details of a specific label.",
        parameters=[
            LABEL_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Labels",
                response=LabelSerializer,
                examples=[LABEL_EXAMPLE],
            ),
            404: LABEL_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, pk):
        """Retrieve label

        Retrieve details of a specific label.
        """
        label = self.get_queryset().get(pk=pk)
        serializer = LabelSerializer(label)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @label_docs(
        operation_id="update_label",
        description="Partially update an existing label's properties like name, color, or description.",
        parameters=[
            LABEL_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=LabelCreateUpdateSerializer,
            examples=[LABEL_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Label updated successfully",
                response=LabelSerializer,
                examples=[LABEL_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: LABEL_NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, pk):
        """Update label

        Partially update an existing label's properties like name, color, or description.
        Validates external ID uniqueness if provided.
        """
        label = self.get_queryset().get(pk=pk)
        serializer = LabelCreateUpdateSerializer(label, data=request.data, partial=True)
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and request.data.get("external_source")
                and Label.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                )
                .exclude(id=pk)
                .exists()
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
        description="Permanently remove a label from the project. This action cannot be undone.",
        parameters=[
            LABEL_ID_PARAMETER,
        ],
        responses={
            204: DELETED_RESPONSE,
            404: LABEL_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        """Delete label

        Permanently remove a label from the project.
        This action cannot be undone.
        """
        label = self.get_queryset().get(pk=pk)
        label.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class IssueLinkListCreateAPIEndpoint(BaseAPIView):
    """Work Item Link List and Create Endpoint"""

    serializer_class = IssueLinkSerializer
    model = IssueLink
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

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
        operation_id="list_work_item_links",
        description="Retrieve all links associated with a work item. Supports filtering by URL, title, and metadata.",
        parameters=[
            ISSUE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssueLinkSerializer,
                "PaginatedIssueLinkResponse",
                "Paginated list of work item links",
                "Paginated Work Item Links",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ISSUE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """List work item links

        Retrieve all links associated with a work item.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda issue_links: IssueLinkSerializer(
                issue_links, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @issue_link_docs(
        operation_id="create_work_item_link",
        description="Add a new external link to a work item with URL, title, and metadata.",
        parameters=[
            ISSUE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IssueLinkCreateSerializer,
            examples=[ISSUE_LINK_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Work item link created successfully",
                response=IssueLinkSerializer,
                examples=[ISSUE_LINK_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ISSUE_NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Create issue link

        Add a new external link to a work item with URL, title, and metadata.
        Automatically tracks link creation activity.
        """
        serializer = IssueLinkCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=issue_id)
            crawl_work_item_link_title.delay(serializer.instance.id, serializer.instance.url)
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


class IssueLinkDetailAPIEndpoint(BaseAPIView):
    """Issue Link Detail Endpoint"""

    permission_classes = [ProjectEntityPermission]

    model = IssueLink
    serializer_class = IssueLinkSerializer
    use_read_replica = True

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
        operation_id="retrieve_work_item_link",
        description="Retrieve details of a specific work item link.",
        parameters=[
            ISSUE_ID_PARAMETER,
            LINK_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssueLinkSerializer,
                "PaginatedIssueLinkDetailResponse",
                "Work item link details or paginated list",
                "Work Item Link Details",
            ),
            404: OpenApiResponse(description="Issue not found"),
        },
    )
    def get(self, request, slug, project_id, issue_id, pk):
        """Retrieve work item link

        Retrieve details of a specific work item link.
        """
        if pk is None:
            issue_links = self.get_queryset()
            serializer = IssueLinkSerializer(issue_links, fields=self.fields, expand=self.expand)
            return self.paginate(
                request=request,
                queryset=(self.get_queryset()),
                on_results=lambda issue_links: IssueLinkSerializer(
                    issue_links, many=True, fields=self.fields, expand=self.expand
                ).data,
            )
        issue_link = self.get_queryset().get(pk=pk)
        serializer = IssueLinkSerializer(issue_link, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @issue_link_docs(
        operation_id="update_issue_link",
        description="Modify the URL, title, or metadata of an existing issue link.",
        parameters=[
            ISSUE_ID_PARAMETER,
            LINK_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IssueLinkUpdateSerializer,
            examples=[ISSUE_LINK_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Issue link updated successfully",
                response=IssueLinkSerializer,
                examples=[ISSUE_LINK_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: LINK_NOT_FOUND_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, issue_id, pk):
        """Update issue link

        Modify the URL, title, or metadata of an existing issue link.
        Tracks all changes in issue activity logs.
        """
        issue_link = IssueLink.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(IssueLinkSerializer(issue_link).data, cls=DjangoJSONEncoder)
        serializer = IssueLinkSerializer(issue_link, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            crawl_work_item_link_title.delay(serializer.data.get("id"), serializer.data.get("url"))
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
        operation_id="delete_work_item_link",
        description="Permanently remove an external link from a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            LINK_ID_PARAMETER,
        ],
        responses={
            204: OpenApiResponse(description="Work item link deleted successfully"),
            404: OpenApiResponse(description="Work item link not found"),
        },
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete work item link

        Permanently remove an external link from a work item.
        Records deletion activity for audit purposes.
        """
        issue_link = IssueLink.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        current_instance = json.dumps(IssueLinkSerializer(issue_link).data, cls=DjangoJSONEncoder)
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


class IssueCommentListCreateAPIEndpoint(BaseAPIView):
    """Issue Comment List and Create Endpoint"""

    serializer_class = IssueCommentSerializer
    model = IssueComment
    webhook_event = "issue_comment"
    permission_classes = [ProjectLitePermission]
    use_read_replica = True

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
        operation_id="list_work_item_comments",
        description="Retrieve all comments for a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssueCommentSerializer,
                "PaginatedIssueCommentResponse",
                "Paginated list of work item comments",
                "Paginated Work Item Comments",
            ),
            404: OpenApiResponse(description="Issue not found"),
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """List work item comments

        Retrieve all comments for a work item.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda issue_comments: IssueCommentSerializer(
                issue_comments, many=True, fields=self.fields, expand=self.expand
            ).data,
        )

    @issue_comment_docs(
        operation_id="create_work_item_comment",
        description="Add a new comment to a work item with HTML content.",
        parameters=[
            ISSUE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IssueCommentCreateSerializer,
            examples=[ISSUE_COMMENT_CREATE_EXAMPLE],
        ),
        responses={
            201: OpenApiResponse(
                description="Work item comment created successfully",
                response=IssueCommentSerializer,
                examples=[ISSUE_COMMENT_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ISSUE_NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Create work item comment

        Add a new comment to a work item with HTML content.
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
                    "error": "Work item comment with the same external id and external source already exists",
                    "id": str(issue_comment.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = IssueCommentCreateSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(project_id=project_id, issue_id=issue_id, actor=request.user)
            issue_comment = IssueComment.objects.get(pk=serializer.instance.id)
            # Update the created_at and the created_by and save the comment
            issue_comment.created_at = request.data.get("created_at", timezone.now())
            issue_comment.created_by_id = request.data.get("created_by", request.user.id)
            issue_comment.actor_id = request.data.get("created_by", request.user.id)
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

            # Send the model activity
            model_activity.delay(
                model_name="issue_comment",
                model_id=str(serializer.instance.id),
                requested_data=request.data,
                current_instance=None,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            serializer = IssueCommentSerializer(issue_comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IssueCommentDetailAPIEndpoint(BaseAPIView):
    """Work Item Comment Detail Endpoint"""

    serializer_class = IssueCommentSerializer
    model = IssueComment
    webhook_event = "issue_comment"
    permission_classes = [ProjectLitePermission]
    use_read_replica = True

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
        operation_id="retrieve_work_item_comment",
        description="Retrieve details of a specific comment.",
        parameters=[
            ISSUE_ID_PARAMETER,
            COMMENT_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Work item comments",
                response=IssueCommentSerializer,
                examples=[ISSUE_COMMENT_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ISSUE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id, pk):
        """Retrieve issue comment

        Retrieve details of a specific comment.
        """
        issue_comment = self.get_queryset().get(pk=pk)
        serializer = IssueCommentSerializer(issue_comment, fields=self.fields, expand=self.expand)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @issue_comment_docs(
        operation_id="update_work_item_comment",
        description="Modify the content of an existing comment on a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
            COMMENT_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IssueCommentCreateSerializer,
            examples=[ISSUE_COMMENT_UPDATE_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Work item comment updated successfully",
                response=IssueCommentSerializer,
                examples=[ISSUE_COMMENT_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: COMMENT_NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, issue_id, pk):
        """Update work item comment

        Modify the content of an existing comment on a work item.
        Validates external ID uniqueness if provided.
        """
        issue_comment = IssueComment.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        requested_data = json.dumps(self.request.data, cls=DjangoJSONEncoder)
        current_instance = json.dumps(IssueCommentSerializer(issue_comment).data, cls=DjangoJSONEncoder)

        # Validation check if the issue already exists
        if (
            request.data.get("external_id")
            and (issue_comment.external_id != str(request.data.get("external_id")))
            and IssueComment.objects.filter(
                project_id=project_id,
                workspace__slug=slug,
                external_source=request.data.get("external_source", issue_comment.external_source),
                external_id=request.data.get("external_id"),
            ).exists()
        ):
            return Response(
                {
                    "error": "Work item comment with the same external id and external source already exists",
                    "id": str(issue_comment.id),
                },
                status=status.HTTP_409_CONFLICT,
            )

        serializer = IssueCommentCreateSerializer(issue_comment, data=request.data, partial=True)
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
            # Send the model activity
            model_activity.delay(
                model_name="issue_comment",
                model_id=str(pk),
                requested_data=request.data,
                current_instance=current_instance,
                actor_id=request.user.id,
                slug=slug,
                origin=base_host(request=request, is_app=True),
            )

            issue_comment = IssueComment.objects.get(pk=serializer.instance.id)
            serializer = IssueCommentSerializer(issue_comment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @issue_comment_docs(
        operation_id="delete_work_item_comment",
        description="Permanently remove a comment from a work item. Records deletion activity for audit purposes.",
        parameters=[
            ISSUE_ID_PARAMETER,
            COMMENT_ID_PARAMETER,
        ],
        responses={
            204: OpenApiResponse(description="Work item comment deleted successfully"),
            404: COMMENT_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete issue comment

        Permanently remove a comment from a work item.
        Records deletion activity for audit purposes.
        """
        issue_comment = IssueComment.objects.get(workspace__slug=slug, project_id=project_id, issue_id=issue_id, pk=pk)
        current_instance = json.dumps(IssueCommentSerializer(issue_comment).data, cls=DjangoJSONEncoder)
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


class IssueActivityListAPIEndpoint(BaseAPIView):
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    @issue_activity_docs(
        operation_id="list_work_item_activities",
        description="Retrieve all activities for a work item. Supports filtering by activity type and date range.",
        parameters=[
            ISSUE_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssueActivitySerializer,
                "PaginatedIssueActivityResponse",
                "Paginated list of issue activities",
                "Paginated Issue Activities",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ISSUE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """List issue activities

        Retrieve chronological activity logs for an issue.
        Excludes comment, vote, reaction, and draft activities.
        """
        issue_activities = (
            IssueActivity.objects.filter(issue_id=issue_id, workspace__slug=slug, project_id=project_id)
            .filter(
                ~Q(field__in=["comment", "vote", "reaction", "draft"]),
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(project__archived_at__isnull=True)
            .select_related("actor", "workspace", "issue", "project")
        ).order_by(request.GET.get("order_by", "created_at"))

        return self.paginate(
            request=request,
            queryset=(issue_activities),
            on_results=lambda issue_activity: IssueActivitySerializer(
                issue_activity, many=True, fields=self.fields, expand=self.expand
            ).data,
        )


class IssueActivityDetailAPIEndpoint(BaseAPIView):
    """Issue Activity Detail Endpoint"""

    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    @issue_activity_docs(
        operation_id="retrieve_work_item_activity",
        description="Retrieve details of a specific activity.",
        parameters=[
            ISSUE_ID_PARAMETER,
            ACTIVITY_ID_PARAMETER,
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
            ORDER_BY_PARAMETER,
            FIELDS_PARAMETER,
            EXPAND_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                IssueActivitySerializer,
                "PaginatedIssueActivityDetailResponse",
                "Paginated list of work item activities",
                "Work Item Activity Details",
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ISSUE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id, pk):
        """Retrieve issue activity

        Retrieve details of a specific activity.
        Excludes comment, vote, reaction, and draft activities.
        """
        issue_activity = (
            (
                IssueActivity.objects.filter(issue_id=issue_id, workspace__slug=slug, project_id=project_id, id=pk)
                .filter(
                    ~Q(field__in=["comment", "vote", "reaction", "draft"]),
                    project__project_projectmember__member=self.request.user,
                    project__project_projectmember__is_active=True,
                )
                .filter(project__archived_at__isnull=True)
                .select_related("actor", "workspace", "issue", "project")
            )
            .order_by(request.GET.get("order_by", "created_at"))
            .first()
        )

        if not issue_activity:
            return Response({"message": "Activity not found.", "code": "NOT_FOUND"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            IssueActivitySerializer(issue_activity, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )


class IssueAttachmentListCreateAPIEndpoint(BaseAPIView):
    """Issue Attachment List and Create Endpoint"""

    serializer_class = IssueAttachmentSerializer
    model = FileAsset
    use_read_replica = True

    @issue_attachment_docs(
        operation_id="create_work_item_attachment",
        description="Generate presigned URL for uploading file attachments to a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request=IssueAttachmentUploadSerializer,
            examples=[ISSUE_ATTACHMENT_UPLOAD_EXAMPLE],
        ),
        responses={
            200: OpenApiResponse(
                description="Presigned download URL generated successfully",
                examples=[
                    OpenApiExample(
                        name="Work Item Attachment Response",
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
                    OpenApiExample(name="Project not found", value={"error": "Project not found"}),
                    OpenApiExample(name="Issue not found", value={"error": "Issue not found"}),
                ],
            ),
        },
    )
    def post(self, request, slug, project_id, issue_id):
        """Create work item attachment

        Generate presigned URL for uploading file attachments to a work item.
        Validates file type and size before creating the attachment record.
        """
        issue = Issue.objects.get(pk=issue_id, workspace__slug=slug, project_id=project_id)
        # if the user is creator or admin,member then allow the upload
        if not user_has_issue_permission(
            request.user.id,
            project_id=project_id,
            issue=issue,
            allowed_roles=[ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value],
            allow_creator=True,
        ):
            return Response(
                {"error": "You are not allowed to upload this attachment"},
                status=status.HTTP_403_FORBIDDEN,
            )

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
        presigned_url = storage.generate_presigned_post(object_name=asset_key, file_type=type, file_size=size_limit)
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
        operation_id="list_work_item_attachments",
        description="Retrieve all attachments for a work item.",
        parameters=[
            ISSUE_ID_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Work item attachment",
                response=IssueAttachmentSerializer,
                examples=[ISSUE_ATTACHMENT_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            404: ATTACHMENT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id):
        """List issue attachments

        List all attachments for an issue.
        """
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


class IssueAttachmentDetailAPIEndpoint(BaseAPIView):
    """Issue Attachment Detail Endpoint"""

    serializer_class = IssueAttachmentSerializer
    model = FileAsset
    use_read_replica = True

    @issue_attachment_docs(
        operation_id="delete_work_item_attachment",
        description="Permanently remove an attachment from a work item. Records deletion activity for audit purposes.",
        parameters=[
            ATTACHMENT_ID_PARAMETER,
        ],
        responses={
            204: OpenApiResponse(description="Work item attachment deleted successfully"),
            404: ATTACHMENT_NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, issue_id, pk):
        """Delete work item attachment

        Soft delete an attachment from a work item by marking it as deleted.
        Records deletion activity and triggers metadata cleanup.
        """
        issue = Issue.objects.get(pk=issue_id, workspace__slug=slug, project_id=project_id)
        # if the request user is creator or admin then delete the attachment
        if not user_has_issue_permission(
            request.user.id,
            project_id=project_id,
            issue=issue,
            allowed_roles=[ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value],
            allow_creator=True,
        ):
            return Response(
                {"error": "You are not allowed to delete this attachment"},
                status=status.HTTP_403_FORBIDDEN,
            )

        issue_attachment = FileAsset.objects.get(pk=pk, workspace__slug=slug, project_id=project_id)
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
        operation_id="retrieve_work_item_attachment",
        description="Download attachment file. Returns a redirect to the presigned download URL.",
        parameters=[
            ATTACHMENT_ID_PARAMETER,
        ],
        responses={
            302: OpenApiResponse(
                description="Redirect to presigned download URL",
            ),
            400: OpenApiResponse(
                description="Asset not uploaded",
                response={
                    "type": "object",
                    "properties": {
                        "error": {
                            "type": "string",
                            "description": "Error message",
                            "example": "The asset is not uploaded.",
                        },
                        "status": {
                            "type": "boolean",
                            "description": "Request status",
                            "example": False,
                        },
                    },
                },
                examples=[ISSUE_ATTACHMENT_NOT_UPLOADED_EXAMPLE],
            ),
            404: ATTACHMENT_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, issue_id, pk):
        """Retrieve work item attachment

        Retrieve details of a specific attachment.
        """
        # if the user is part of the project then allow the download
        if not user_has_issue_permission(
            request.user.id,
            project_id=project_id,
            issue=None,
            allowed_roles=None,
            allow_creator=False,
        ):
            return Response(
                {"error": "You are not allowed to download this attachment"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get the asset
        asset = FileAsset.objects.get(id=pk, workspace__slug=slug, project_id=project_id)

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

    @issue_attachment_docs(
        operation_id="upload_work_item_attachment",
        description="Mark an attachment as uploaded after successful file transfer to storage.",
        parameters=[
            ATTACHMENT_ID_PARAMETER,
        ],
        request=OpenApiRequest(
            request={
                "application/json": {
                    "type": "object",
                    "properties": {
                        "is_uploaded": {
                            "type": "boolean",
                            "description": "Mark attachment as uploaded",
                        }
                    },
                }
            },
            examples=[ATTACHMENT_UPLOAD_CONFIRM_EXAMPLE],
        ),
        responses={
            204: OpenApiResponse(description="Work item attachment uploaded successfully"),
            400: INVALID_REQUEST_RESPONSE,
            404: ATTACHMENT_NOT_FOUND_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, issue_id, pk):
        """Confirm attachment upload

        Mark an attachment as uploaded after successful file transfer to storage.
        Triggers activity logging and metadata extraction.
        """

        issue = Issue.objects.get(pk=issue_id, workspace__slug=slug, project_id=project_id)
        # if the user is creator or admin then allow the upload
        if not user_has_issue_permission(
            request.user.id,
            project_id=project_id,
            issue=issue,
            allowed_roles=[ROLE.ADMIN.value, ROLE.MEMBER.value, ROLE.GUEST.value],
            allow_creator=True,
        ):
            return Response(
                {"error": "You are not allowed to upload this attachment"},
                status=status.HTTP_403_FORBIDDEN,
            )

        issue_attachment = FileAsset.objects.get(pk=pk, workspace__slug=slug, project_id=project_id)
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

    use_read_replica = True

    @extend_schema(
        operation_id="search_work_items",
        tags=["Work Items"],
        description="Perform semantic search across issue names, sequence IDs, and project identifiers.",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            SEARCH_PARAMETER_REQUIRED,
            LIMIT_PARAMETER,
            WORKSPACE_SEARCH_PARAMETER,
            PROJECT_ID_QUERY_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Work item search results",
                response=IssueSearchSerializer,
                examples=[ISSUE_SEARCH_EXAMPLE],
            ),
            400: BAD_SEARCH_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: WORKSPACE_NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug):
        """Search work items

        Perform semantic search across work item names, sequence IDs, and project identifiers.
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
