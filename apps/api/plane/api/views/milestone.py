# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import uuid

# Django imports
from django.db.models import Count, Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# drf-spectacular imports
from drf_spectacular.utils import extend_schema, OpenApiRequest, OpenApiResponse

# Module imports
from plane.api.serializers import (
    MilestoneCreateSerializer,
    MilestoneIssueRequestSerializer,
    MilestoneIssueSerializer,
    MilestoneSerializer,
    MilestoneUpdateSerializer,
)
from plane.app.permissions import ProjectEntityPermission
from plane.db.models import Issue, Milestone, MilestoneIssue, Project
from plane.utils.openapi import (
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
    create_paginated_response,
)
from .base import BaseAPIView

MILESTONES_DISABLED_ERROR = "Milestones are not enabled for this project."
MISSING_WORK_ITEMS_ERROR = "issues must be a non empty list of work item ids"
INVALID_WORK_ITEMS_ERROR = "Some work items were not found in this project."


def _milestones_enabled(slug, project_id):
    return Project.objects.filter(pk=project_id, workspace__slug=slug, is_milestone_enabled=True).exists()


def _parse_issue_ids(request):
    """Validate the ``issues`` payload — a non-empty list of UUIDs — and deduplicate it.

    Returns ``(issue_ids, error_message)``.
    """
    # A non-dict JSON body (top-level array/scalar) would make ``.get`` raise
    # AttributeError -> HTTP 500; reject it cleanly as a 400 instead.
    if not isinstance(request.data, dict):
        return None, MISSING_WORK_ITEMS_ERROR
    issues = request.data.get("issues", [])
    if not issues or not isinstance(issues, list):
        return None, MISSING_WORK_ITEMS_ERROR
    try:
        issue_ids = list({uuid.UUID(str(issue)) for issue in issues})
    except (TypeError, ValueError, AttributeError):
        return None, MISSING_WORK_ITEMS_ERROR
    return issue_ids, None


class MilestoneListCreateAPIEndpoint(BaseAPIView):
    """Milestone List and Create Endpoint"""

    serializer_class = MilestoneSerializer
    model = Milestone
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Milestone.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("project")
            .select_related("workspace")
            .annotate(
                total_issues=Count(
                    "issue_milestone__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_milestone__issue__archived_at__isnull=True,
                        issue_milestone__issue__is_draft=False,
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_milestone__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_milestone__issue__state__group="completed",
                        issue_milestone__issue__archived_at__isnull=True,
                        issue_milestone__issue__is_draft=False,
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    @extend_schema(
        operation_id="list_milestones",
        summary="List milestones",
        description="Retrieve all milestones in a project.",
        tags=["Milestones"],
        parameters=[CURSOR_PARAMETER, PER_PAGE_PARAMETER],
        responses={
            200: create_paginated_response(
                MilestoneSerializer,
                "PaginatedMilestoneResponse",
                "Paginated list of milestones",
                "Paginated Milestones",
            ),
        },
    )
    def get(self, request, slug, project_id):
        """List milestones

        Retrieve all milestones in a project with work item counters.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda milestones: (
                MilestoneSerializer(milestones, many=True, fields=self.fields, expand=self.expand).data
            ),
        )

    @extend_schema(
        operation_id="create_milestone",
        summary="Create milestone",
        description="Create a new milestone with a title and an optional target date. Supports external ID tracking for integration purposes.",  # noqa: E501
        tags=["Milestones"],
        request=OpenApiRequest(request=MilestoneCreateSerializer),
        responses={
            201: OpenApiResponse(description="Milestone created", response=MilestoneSerializer),
        },
    )
    def post(self, request, slug, project_id):
        """Create milestone

        Create a new milestone with a title and an optional target date.
        """
        if not _milestones_enabled(slug, project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MilestoneCreateSerializer(data=request.data)
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and request.data.get("external_source")
                and Milestone.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                milestone = Milestone.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    external_source=request.data.get("external_source"),
                    external_id=request.data.get("external_id"),
                ).first()
                return Response(
                    {
                        "error": "Milestone with the same external id and external source already exists",
                        "id": str(milestone.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save(project_id=project_id)
            milestone = Milestone.objects.get(pk=serializer.instance.id)
            return Response(MilestoneSerializer(milestone).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MilestoneDetailAPIEndpoint(BaseAPIView):
    """Milestone Retrieve, Update and Destroy Endpoint"""

    serializer_class = MilestoneSerializer
    model = Milestone
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            Milestone.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .select_related("project")
            .select_related("workspace")
            .annotate(
                total_issues=Count(
                    "issue_milestone__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_milestone__issue__archived_at__isnull=True,
                        issue_milestone__issue__is_draft=False,
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .annotate(
                completed_issues=Count(
                    "issue_milestone__issue__id",
                    distinct=True,
                    filter=Q(
                        issue_milestone__issue__state__group="completed",
                        issue_milestone__issue__archived_at__isnull=True,
                        issue_milestone__issue__is_draft=False,
                        issue_milestone__deleted_at__isnull=True,
                        issue_milestone__issue__deleted_at__isnull=True,
                    ),
                )
            )
            .distinct()
        )

    @extend_schema(
        operation_id="retrieve_milestone",
        summary="Retrieve milestone",
        description="Retrieve details of a specific milestone by its ID.",
        tags=["Milestones"],
        responses={
            200: OpenApiResponse(description="Milestone", response=MilestoneSerializer),
        },
    )
    def get(self, request, slug, project_id, milestone_id):
        """Retrieve milestone

        Retrieve details of a specific milestone by its ID.
        """
        milestone = self.get_queryset().get(pk=milestone_id)
        return Response(
            MilestoneSerializer(milestone, fields=self.fields, expand=self.expand).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        operation_id="update_milestone",
        summary="Update milestone",
        description="Partially update an existing milestone's properties like title or target date.",
        tags=["Milestones"],
        request=OpenApiRequest(request=MilestoneUpdateSerializer),
        responses={
            200: OpenApiResponse(description="Milestone updated", response=MilestoneSerializer),
        },
    )
    def patch(self, request, slug, project_id, milestone_id):
        """Update milestone

        Partially update an existing milestone's properties like title or target date.
        """
        if not _milestones_enabled(slug, project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        milestone = Milestone.objects.get(workspace__slug=slug, project_id=project_id, pk=milestone_id)
        serializer = MilestoneUpdateSerializer(milestone, data=request.data, partial=True)
        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and (milestone.external_id != request.data.get("external_id"))
                and Milestone.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source", milestone.external_source),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Milestone with the same external id and external source already exists",
                        "id": str(milestone.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )
            serializer.save()
            milestone = Milestone.objects.get(pk=serializer.instance.id)
            return Response(MilestoneSerializer(milestone).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        operation_id="delete_milestone",
        summary="Delete milestone",
        description="Permanently remove a milestone and all its work item relationships.",
        tags=["Milestones"],
        responses={
            204: OpenApiResponse(description="Milestone deleted"),
        },
    )
    def delete(self, request, slug, project_id, milestone_id):
        """Delete milestone

        Permanently remove a milestone and all its work item relationships.
        """
        if not _milestones_enabled(slug, project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        milestone = Milestone.objects.get(workspace__slug=slug, project_id=project_id, pk=milestone_id)
        milestone.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MilestoneIssueAPIEndpoint(BaseAPIView):
    """Milestone Work Items List, Add and Remove Endpoint"""

    serializer_class = MilestoneIssueSerializer
    model = MilestoneIssue
    permission_classes = [ProjectEntityPermission]
    use_read_replica = True

    def get_queryset(self):
        return (
            MilestoneIssue.objects.filter(workspace__slug=self.kwargs.get("slug"))
            .filter(project_id=self.kwargs.get("project_id"))
            .filter(
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
            )
            .filter(milestone_id=self.kwargs.get("milestone_id"))
            .select_related("project")
            .select_related("workspace")
            .select_related("milestone")
            .select_related("issue")
            .order_by(self.kwargs.get("order_by", "-created_at"))
            .distinct()
        )

    @extend_schema(
        operation_id="list_milestone_work_items",
        summary="List milestone work items",
        description="Retrieve all work items attached to a milestone.",
        tags=["Milestones"],
        parameters=[CURSOR_PARAMETER, PER_PAGE_PARAMETER],
        responses={
            200: create_paginated_response(
                MilestoneIssueSerializer,
                "PaginatedMilestoneIssueResponse",
                "Paginated list of milestone work items",
                "Paginated Milestone Work Items",
            ),
        },
    )
    def get(self, request, slug, project_id, milestone_id):
        """List milestone work items

        Retrieve all work items attached to a milestone.
        """
        return self.paginate(
            request=request,
            queryset=(self.get_queryset()),
            on_results=lambda milestone_issues: (
                MilestoneIssueSerializer(milestone_issues, many=True, fields=self.fields, expand=self.expand).data
            ),
        )

    @extend_schema(
        operation_id="add_milestone_work_items",
        summary="Add work items to milestone",
        description="Attach multiple work items of the project to a milestone. Already attached work items are ignored.",  # noqa: E501
        tags=["Milestones"],
        request=OpenApiRequest(request=MilestoneIssueRequestSerializer),
        responses={
            201: OpenApiResponse(
                description="Milestone work items added",
                response=MilestoneIssueSerializer,
            ),
        },
    )
    def post(self, request, slug, project_id, milestone_id):
        """Add work items to milestone

        Attach multiple work items of the project to a milestone.
        Already attached work items are ignored.
        """
        if not _milestones_enabled(slug, project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        issue_ids, error = _parse_issue_ids(request)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        milestone = Milestone.objects.get(workspace__slug=slug, project_id=project_id, pk=milestone_id)

        # Every work item must belong to this project (cross-tenant isolation)
        project_issue_ids = set(
            Issue.issue_objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                pk__in=issue_ids,
            ).values_list("id", flat=True)
        )
        invalid_issue_ids = [str(issue_id) for issue_id in issue_ids if issue_id not in project_issue_ids]
        if invalid_issue_ids:
            return Response(
                {"error": INVALID_WORK_ITEMS_ERROR, "invalid_ids": invalid_issue_ids},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Ignore the work items already attached to the milestone
        existing_issue_ids = set(
            MilestoneIssue.objects.filter(milestone_id=milestone_id, issue_id__in=issue_ids).values_list(
                "issue_id", flat=True
            )
        )
        new_issue_ids = [issue_id for issue_id in issue_ids if issue_id not in existing_issue_ids]

        created_records = MilestoneIssue.objects.bulk_create(
            [
                MilestoneIssue(
                    project_id=project_id,
                    workspace_id=milestone.workspace_id,
                    milestone_id=milestone_id,
                    issue_id=issue_id,
                    created_by_id=request.user.id,
                    updated_by_id=request.user.id,
                )
                for issue_id in new_issue_ids
            ],
            ignore_conflicts=True,
            batch_size=10,
        )

        return Response(
            MilestoneIssueSerializer(created_records, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    @extend_schema(
        operation_id="remove_milestone_work_items",
        summary="Remove work items from milestone",
        description="Detach multiple work items from a milestone while keeping them in the project. Expects an `issues` list in the request body.",  # noqa: E501
        tags=["Milestones"],
        request=OpenApiRequest(request=MilestoneIssueRequestSerializer),
        responses={
            204: OpenApiResponse(description="Milestone work items removed"),
        },
    )
    def delete(self, request, slug, project_id, milestone_id):
        """Remove work items from milestone

        Detach multiple work items from a milestone while keeping them in the project.
        """
        if not _milestones_enabled(slug, project_id):
            return Response({"error": MILESTONES_DISABLED_ERROR}, status=status.HTTP_400_BAD_REQUEST)

        # DRF parses the JSON body of DELETE requests through request.data
        issue_ids, error = _parse_issue_ids(request)
        if error:
            return Response({"error": error}, status=status.HTTP_400_BAD_REQUEST)

        MilestoneIssue.objects.filter(
            workspace__slug=slug,
            project_id=project_id,
            milestone_id=milestone_id,
            issue_id__in=issue_ids,
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
