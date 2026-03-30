# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

import json

from django.core.serializers.json import DjangoJSONEncoder
from django.db.models import Q
from django.utils import timezone

from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiExample, OpenApiRequest

from plane.api.views.base import BaseAPIView
from plane.api.serializers import EpicSerializer, EpicCreateSerializer, IssueSerializer
from plane.app.permissions import ProjectEntityPermission
from plane.bgtasks.issue_activities_task import issue_activity
from plane.bgtasks.issue_description_version_task import issue_description_version_task
from plane.db.models import Issue, IssueType, Project
from plane.ee.utils.workflow import WorkflowStateManager
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.issue_type_hierarchy import validate_type_hierarchy
from plane.utils.openapi.decorators import epic_docs
from plane.utils.openapi.parameters import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    FIELDS_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
)
from plane.utils.openapi.responses import (
    INVALID_REQUEST_RESPONSE,
    UNAUTHORIZED_RESPONSE,
    NOT_FOUND_RESPONSE,
    DELETED_RESPONSE,
    EXTERNAL_ID_EXISTS_RESPONSE,
    create_paginated_response,
)
from plane.utils.openapi.examples import SAMPLE_EPIC, EPIC_EXAMPLE, ISSUE_EXAMPLE
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    PROJECTS_EPICS_READ_SCOPE,
    PROJECTS_EPICS_WRITE_SCOPE,
    PROJECTS_WORK_ITEMS_READ_SCOPE,
)


class EpicListCreateAPIEndpoint(BaseAPIView):
    """
    This viewset provides `list` and `create` on epic level
    """

    use_read_replica = True

    model = Issue
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_EPICS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_EPICS_WRITE_SCOPE]],
    }
    serializer_class = EpicSerializer

    def get_queryset(self):
        return Issue.objects.filter(
            workspace__slug=self.kwargs["slug"],
            project_id=self.kwargs["project_id"],
        ).filter(Q(type__isnull=False) & Q(type__is_epic=True))

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="list_epics",
        summary="List epics",
        description="List epics",
        parameters=[
            CURSOR_PARAMETER,
            PER_PAGE_PARAMETER,
        ],
        responses={
            200: create_paginated_response(
                EpicSerializer,
                "PaginatedEpicResponse",
                "Paginated list of epics",
                "Paginated Epics",
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
        },
    )
    def get(self, request, slug, project_id):
        epic_queryset = self.get_queryset()
        return self.paginate(
            request=request,
            queryset=epic_queryset,
            on_results=lambda x: EpicSerializer(x, many=True).data,
        )

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="create_epic",
        summary="Create epic",
        description="Create a new epic in the specified project with the provided details.",
        request=OpenApiRequest(
            request=EpicCreateSerializer,
        ),
        responses={
            201: OpenApiResponse(
                description="Epic created successfully",
                response=EpicSerializer,
                examples=[EPIC_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def post(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id)
        epic = IssueType.objects.filter(
            workspace__slug=slug,
            project_issue_types__project_id=project_id,
            is_epic=True,
            level=1,
            is_active=True,
        ).first()

        # EE start
        workflow_state_manager = WorkflowStateManager(project_id=project_id, slug=slug)
        if workflow_state_manager.validate_issue_creation(
            state_id=request.data.get("state_id"),
            user_id=request.user.id,
            type_id=request.data.get("type_id", None),
        ):
            return Response(
                {"error": "You cannot create a epic in this state"},
                status=status.HTTP_403_FORBIDDEN,
            )
        # EE end

        if not epic:
            return Response(
                {"error": "Epic is not enabled for this project"},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = EpicCreateSerializer(
            data=request.data,
            context={
                "project_id": project_id,
                "workspace_id": project.workspace_id,
                "type_id": epic.id,
                "slug": slug,
                "user_id": request.user.id,
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
                    type_id=epic.id,
                ).exists()
            ):
                existing_epic = Issue.objects.filter(
                    workspace__slug=slug,
                    project_id=project_id,
                    external_id=request.data.get("external_id"),
                    external_source=request.data.get("external_source"),
                    type_id=epic.id,
                ).first()
                return Response(
                    {
                        "error": "Epic with the same external id and external source already exists",
                        "id": str(existing_epic.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

            serializer.save()

            # Track the epic activity
            issue_activity.delay(
                type="epic.activity.created",
                requested_data=json.dumps(self.request.data, cls=DjangoJSONEncoder),
                actor_id=str(request.user.id),
                issue_id=str(serializer.data.get("id", None)),
                project_id=str(project_id),
                current_instance=None,
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            issue_description_version_task.delay(
                updated_issue=json.dumps(request.data, cls=DjangoJSONEncoder),
                issue_id=str(serializer.data["id"]),
                user_id=request.user.id,
                is_creating=True,
            )

            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EpicDetailAPIEndpoint(BaseAPIView):
    """
    This viewset provides `retrieve` on epic level
    """

    use_read_replica = True

    model = Issue
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_EPICS_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [PROJECTS_EPICS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [PROJECTS_EPICS_WRITE_SCOPE]],
    }
    serializer_class = EpicSerializer

    def get_queryset(self):
        return Issue.objects.filter(
            workspace__slug=self.kwargs["slug"],
            project_id=self.kwargs["project_id"],
        ).filter(Q(type__isnull=False) & Q(type__is_epic=True))

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="retrieve_epic",
        summary="Retrieve an epic",
        description="Retrieve an epic by id",
        parameters=[
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            FIELDS_PARAMETER,
        ],
        responses={
            200: OpenApiResponse(
                description="Epic", response=EpicSerializer, examples=[OpenApiExample(name="Epic", value=SAMPLE_EPIC)]
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, pk):
        epic = self.get_queryset().get(id=pk)
        return Response(EpicSerializer(epic).data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="update_epic",
        summary="Partially update epic",
        description=(
            "Partially update an existing epic with the provided fields."
            "Supports external ID validation to prevent conflicts."
        ),
        request=OpenApiRequest(
            request=EpicCreateSerializer,
        ),
        responses={
            200: OpenApiResponse(
                description="Epic updated successfully",
                response=EpicSerializer,
                examples=[EPIC_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
            409: EXTERNAL_ID_EXISTS_RESPONSE,
        },
    )
    def patch(self, request, slug, project_id, pk):
        epic = self.get_queryset().filter(pk=pk).first()

        if not epic:
            return Response({"error": "Epic not found"}, status=status.HTTP_404_NOT_FOUND)

        # EE start
        workflow_state_manager = WorkflowStateManager(project_id=project_id, slug=slug)
        if request.data.get("state_id") and not workflow_state_manager.validate_state_transition(
            issue=epic,
            new_state_id=request.data.get("state_id"),
            user_id=request.user.id,
        ):
            return Response(
                {"error": "State transition is not allowed"},
                status=status.HTTP_403_FORBIDDEN,
            )
        # EE end

        current_instance = json.dumps(EpicSerializer(epic).data, cls=DjangoJSONEncoder)
        requested_data = json.dumps(request.data, cls=DjangoJSONEncoder)

        serializer = EpicCreateSerializer(
            epic,
            data=request.data,
            partial=True,
            context={
                "slug": slug,
                "user_id": request.user.id,
                "project_id": project_id,
                "workspace_id": epic.workspace_id,
                "type_id": epic.type_id,
            },
        )

        if serializer.is_valid():
            if (
                request.data.get("external_id")
                and (epic.external_id != str(request.data.get("external_id")))
                and Issue.objects.filter(
                    project_id=project_id,
                    workspace__slug=slug,
                    external_source=request.data.get("external_source", epic.external_source),
                    external_id=request.data.get("external_id"),
                ).exists()
            ):
                return Response(
                    {
                        "error": "Epic with the same external id and external source already exists",
                        "id": str(epic.id),
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
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            issue_description_version_task.delay(
                updated_issue=current_instance,
                issue_id=str(serializer.data.get("id", None)),
                user_id=request.user.id,
            )

            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="delete_epic",
        summary="Delete epic",
        description="Permanently delete an existing epic from the project.",
        responses={
            204: DELETED_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def delete(self, request, slug, project_id, pk):
        epic = Issue.objects.get(workspace__slug=slug, project_id=project_id, pk=pk, type__is_epic=True)

        Issue.objects.filter(parent_id=pk).update(parent_id=None)
        epic.delete()

        issue_activity.delay(
            type="issue.activity.deleted",
            requested_data=json.dumps({"issue_id": str(pk)}),
            actor_id=str(request.user.id),
            issue_id=str(pk),
            project_id=str(project_id),
            current_instance={},
            epoch=int(timezone.now().timestamp()),
            notification=True,
            origin=request.META.get("HTTP_ORIGIN"),
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class EpicIssuesAPIEndpoint(BaseAPIView):
    """
    This viewset provides `list` and `create` on epic issues level
    """

    model = Issue
    permission_classes = [ProjectEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [PROJECTS_EPICS_READ_SCOPE, PROJECTS_WORK_ITEMS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [PROJECTS_EPICS_WRITE_SCOPE]],
    }
    serializer_class = IssueSerializer

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="list_epic_issues",
        summary="List epic issues",
        description="Retrieve all work items under an epic, with state distribution.",
        responses={
            200: create_paginated_response(
                IssueSerializer,
                "PaginatedEpicIssueResponse",
                "Paginated list of epic issues",
                "Paginated Epic Issues",
            ),
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def get(self, request, slug, project_id, epic_id):
        epic_issues = (
            Issue.issue_objects.filter(parent_id=epic_id, workspace__slug=slug)
            .select_related("state")
            .order_by("-created_at")
        )

        return self.paginate(
            request=request,
            queryset=epic_issues,
            on_results=lambda x: IssueSerializer(x, many=True).data,
        )

    @check_feature_flag(FeatureFlag.EPICS)
    @epic_docs(
        operation_id="add_epic_issues",
        summary="Add work items to epic",
        description="Add multiple work items as sub-issues under an epic.",
        responses={
            200: OpenApiResponse(
                description="Work items added to epic",
                response=IssueSerializer(many=True),
                examples=[ISSUE_EXAMPLE],
            ),
            400: INVALID_REQUEST_RESPONSE,
            401: UNAUTHORIZED_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    )
    def post(self, request, slug, project_id, epic_id):
        parent_issue = Issue.objects.get(pk=epic_id)
        sub_work_item_ids = request.data.get("work_item_ids", [])

        if not len(sub_work_item_ids):
            return Response(
                {"error": "Work Item IDs are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        work_items = Issue.issue_objects.filter(id__in=sub_work_item_ids, workspace__slug=slug).select_related("type")

        parent_level = parent_issue.type.level if parent_issue.type else None
        for work_item in work_items:
            child_level = work_item.type.level if work_item.type else None
            is_valid, error_message = validate_type_hierarchy(parent_level, child_level)
            if not is_valid:
                return Response(
                    {"error": error_message},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            work_item.parent = parent_issue

        Issue.objects.bulk_update(work_items, ["parent"], batch_size=10)

        updated_work_items = (
            Issue.issue_objects.filter(id__in=sub_work_item_ids)
            .select_related("state")
            .order_by("-created_at")
        )

        _ = [
            issue_activity.delay(
                type="issue.activity.updated",
                requested_data=json.dumps({"parent_id": str(epic_id)}),
                actor_id=str(request.user.id),
                issue_id=str(work_item.id),
                project_id=str(project_id),
                current_instance=json.dumps({"parent_id": str(work_item.id)}),
                epoch=int(timezone.now().timestamp()),
                notification=True,
                origin=request.META.get("HTTP_ORIGIN"),
            )
            for work_item in work_items
        ]

        serializer = IssueSerializer(updated_work_items, many=True)
        sub_work_item_data = serializer.data

        return Response(
            sub_work_item_data,
            status=status.HTTP_200_OK,
        )
