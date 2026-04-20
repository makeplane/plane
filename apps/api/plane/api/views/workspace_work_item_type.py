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

# Python imports
import random

# Django imports
from django.db import models
from django.db.models import Q
from django.db.models.functions import Coalesce
from django.contrib.postgres.aggregates import ArrayAgg

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiExample

# Module imports
from plane.api.views.base import BaseAPIView
from plane.app.permissions import WorkspaceEntityPermission
from plane.db.models import Workspace, Project, IssueType, ProjectIssueType, Issue
from plane.ee.models import IssueProperty, IssueTypeProperty
from plane.api.serializers import (
    IssueTypeAPISerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.utils.helpers import get_boolean_value
from plane.ee.utils.workspace_feature import check_workspace_feature, WorkspaceFeatureContext
from plane.utils.openapi.decorators import workspace_work_item_type_docs
from plane.authentication.permissions.oauth import TokenHasScopeIfOAuth
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    WORKSPACES_WORK_ITEM_TYPES_READ_SCOPE,
    WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE,
)


class WorkspaceWorkItemTypeListCreateAPIEndpoint(BaseAPIView):
    model = IssueType
    serializer_class = IssueTypeAPISerializer
    permission_classes = [WorkspaceEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE]],
    }

    def generate_logo_prop(self):
        return {
            "in_use": "icon",
            "icon": {
                "name": random.choice(IssueType.LOGO_ICONS),
                "background_color": random.choice(IssueType.LOGO_BACKGROUNDS),
            },
        }

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="list_workspace_work_item_types",
        summary="List workspace work item types",
        description="List all work item types for a workspace",
        responses={
            200: OpenApiResponse(
                description="Workspace work item types",
                response=IssueTypeAPISerializer(many=True),
            ),
        },
    )
    def get(self, request, slug):
        # Get all issue types for the workspace
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                is_epic=False,
            ).annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(
                            project_issue_types__deleted_at__isnull=True,
                            project_issue_types__project_id__isnull=False,
                        ),
                    ),
                    [],
                )
            )
        ).order_by("created_at")
        serializer = self.serializer_class(issue_types, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="create_workspace_work_item_type",
        summary="Create a workspace work item type",
        description="Create a new work item type for a workspace",
        request=OpenApiRequest(
            request=IssueTypeAPISerializer,
            examples=[
                OpenApiExample(
                    "IssueTypeAPISerializer",
                    value={"name": "Bug", "description": "A bug report"},
                    description="Example request for creating a workspace work item type",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Workspace work item type created",
                response=IssueTypeAPISerializer,
            ),
            400: OpenApiResponse(description="Work item type with this name already exists"),
            409: OpenApiResponse(
                description="Work item type with the same external id and external source already exists"
            ),
        },
    )
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)

        # Check if the workspace has the feature flag enabled
        if not check_workspace_feature(slug, WorkspaceFeatureContext.IS_WORK_ITEM_TYPES_ENABLED):
            return Response(
                {"error": "Workspace work item type creation is not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check for duplicate name
        existing_names = self.model.objects.filter(
            workspace=workspace,
            is_epic=False,
        ).values_list("name", flat=True)
        if request.data.get("name") in existing_names:
            return Response(
                {
                    "error": "Work item type with this name already exists",
                    "code": "WORK_ITEM_TYPE_ALREADY_EXIST",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check for external_id dedup
        external_id = request.data.get("external_id")
        external_source = request.data.get("external_source")
        if external_id and external_source:
            existing = self.model.objects.filter(
                workspace=workspace,
                external_id=external_id,
                external_source=external_source,
            ).first()
            if existing:
                return Response(
                    {
                        "error": "Work item type with the same external id and external source already exists",
                        "id": str(existing.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(workspace=workspace, logo_props=self.generate_logo_prop())

        # re-fetch with annotation
        issue_types = (
            IssueType.objects.filter(
                workspace__slug=slug,
                is_epic=False,
                pk=serializer.data["id"],
            ).annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(
                            project_issue_types__deleted_at__isnull=True,
                            project_issue_types__project_id__isnull=False,
                        ),
                    ),
                    [],
                )
            )
        ).first()
        return Response(self.serializer_class(issue_types).data, status=status.HTTP_201_CREATED)


class WorkspaceWorkItemTypeDetailAPIEndpoint(BaseAPIView):
    model = IssueType
    serializer_class = IssueTypeAPISerializer
    permission_classes = [WorkspaceEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE]],
    }

    def get_queryset(self):
        return self.model.objects.filter(workspace__slug=self.kwargs.get("slug"), is_epic=False)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="retrieve_workspace_work_item_type",
        summary="Get a workspace work item type",
        description="Get a work item type by ID for a workspace",
        responses={
            200: OpenApiResponse(
                description="Workspace work item type",
                response=IssueTypeAPISerializer,
            ),
        },
    )
    def get(self, request, slug, type_id):
        issue_type = (
            self.get_queryset()
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(project_issue_types__deleted_at__isnull=True),
                    ),
                    [],
                )
            )
            .get(pk=type_id)
        )
        serializer = self.serializer_class(issue_type)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="update_workspace_work_item_type",
        summary="Update a workspace work item type",
        description="Update a work item type for a workspace",
        request=OpenApiRequest(
            request=IssueTypeAPISerializer,
            examples=[
                OpenApiExample(
                    "IssueTypeAPISerializer",
                    value={"name": "Bug", "description": "A bug report"},
                    description="Example request for updating a workspace work item type",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Workspace work item type updated",
                response=IssueTypeAPISerializer,
            ),
            400: OpenApiResponse(
                description="Work item type with this name already exists or default type cannot be inactive"
            ),
            409: OpenApiResponse(
                description="Work item type with the same external id and external source already exists"
            ),
        },
    )
    def patch(self, request, slug, type_id):
        issue_type = self.get_queryset().get(pk=type_id)

        # prevent disabling is_active on default types
        if issue_type.is_default and get_boolean_value(request.data.get("is_active")) is False:
            return Response(
                {"error": "Default work item type cannot be inactive"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # check for duplicate name
        if request.data.get("name"):
            duplicate_names = self.get_queryset().exclude(pk=type_id).values_list("name", flat=True)
            if request.data.get("name") in duplicate_names:
                return Response(
                    {
                        "error": "Work item type with this name already exists",
                        "code": "WORK_ITEM_TYPE_ALREADY_EXIST",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # check external_id conflict
        external_id = request.data.get("external_id")
        external_source = request.data.get("external_source")
        if external_id and external_source:
            existing = (
                self.get_queryset()
                .filter(external_id=external_id, external_source=external_source)
                .exclude(pk=type_id)
                .first()
            )
            if existing:
                return Response(
                    {
                        "error": "Work item type with the same external id and external source already exists",
                        "id": str(existing.id),
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        serializer = self.serializer_class(issue_type, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # re-fetch with annotation
        issue_type = (
            self.get_queryset()
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "project_issue_types__project_id",
                        distinct=True,
                        filter=Q(project_issue_types__deleted_at__isnull=True),
                    ),
                    [],
                )
            )
            .get(pk=type_id)
        )
        return Response(self.serializer_class(issue_type).data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="delete_workspace_work_item_type",
        summary="Delete a workspace work item type",
        description="Delete a work item type for a workspace",
        responses={
            204: OpenApiResponse(description="Workspace work item type deleted"),
            400: OpenApiResponse(description="Cannot delete default work item type or type with associated work items"),
        },
    )
    def delete(self, request, slug, type_id):
        issue_type = self.get_queryset().get(pk=type_id)

        # Check if the issue type is the default issue type
        if issue_type.is_default:
            return Response(
                {"error": "Cannot delete default work item type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if there are any issues using this issue type
        if Issue.objects.filter(workspace__slug=slug, type_id=type_id).exists():
            return Response(
                {"error": "Cannot delete work item type with associated work items."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_type.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WorkspaceWorkItemTypeImportAPIEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "POST": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE]],
    }

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="import_workspace_work_item_types",
        summary="Import workspace work item types into a project",
        description="Bulk associate workspace-level work item types with a specific project",
        request=OpenApiRequest(
            request=None,
            examples=[
                OpenApiExample(
                    "ImportWorkItemTypes",
                    value={"work_item_types": ["550e8400-e29b-41d4-a716-446655440000"]},
                    description="Example request for importing work item types into a project",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(description="Work item types imported successfully"),
            400: OpenApiResponse(description="Project does not exist in this workspace"),
        },
    )
    def post(self, request, slug, project_id):
        work_item_type_ids = request.data.get("work_item_types", [])
        workspace = Workspace.objects.get(slug=slug)

        # Validate that project_id belongs to this workspace
        if not Project.objects.filter(id=project_id, workspace__slug=slug).exists():
            return Response(
                {"error": "Project does not exist in this workspace"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not work_item_type_ids:
            return Response(status=status.HTTP_200_OK)

        # Fetch all work item types in a single query
        work_item_types = IssueType.objects.filter(
            id__in=work_item_type_ids,
            workspace__slug=slug,
            is_epic=False,
        )

        # Bulk create ProjectIssueType records
        project_issue_types = [
            ProjectIssueType(
                project_id=project_id,
                issue_type_id=wt.id,
                level=0,
                is_default=False,
                workspace_id=workspace.id,
                created_by_id=request.user.id,
                updated_by_id=request.user.id,
            )
            for wt in work_item_types
        ]
        ProjectIssueType.objects.bulk_create(
            project_issue_types,
            ignore_conflicts=True,
        )

        return Response(status=status.HTTP_200_OK)


class WorkspaceWorkItemTypePropertyListCreateAPIEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE]],
    }

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="list_workspace_work_item_type_properties",
        summary="List properties in a workspace work item type",
        description="List all property IDs associated with a workspace-level work item type",
        responses={
            200: OpenApiResponse(
                description="List of property IDs in the workspace work item type",
            ),
        },
    )
    def get(self, request, slug, work_item_type_id):
        property_ids = (
            IssueTypeProperty.objects.filter(
                workspace__slug=slug,
                project__isnull=True,
                issue_type_id=work_item_type_id,
                deleted_at__isnull=True,
            )
            .exclude(issue_type__is_epic=True)
            .values_list("property_id", flat=True)
        )

        return Response(list(property_ids), status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="add_properties_to_workspace_work_item_type",
        summary="Add properties to a workspace work item type",
        description="Associate one or more properties with a workspace-level work item type",
        request=OpenApiRequest(
            request=None,
            examples=[
                OpenApiExample(
                    "AddProperties",
                    value={"properties": ["550e8400-e29b-41d4-a716-446655440000"]},
                    description="List of property IDs to add to the work item type",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(description="Properties added to work item type"),
            400: OpenApiResponse(description="Expected a list of property_ids"),
        },
    )
    def post(self, request, slug, work_item_type_id):
        property_ids = request.data.get("properties", [])

        if not property_ids or not isinstance(property_ids, list):
            return Response(
                {"error": "Expected a list of property_ids"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        property_ids = list(set(property_ids))

        workspace = Workspace.objects.get(slug=slug)

        # check all the properties are valid for this workspace
        valid_count = IssueProperty.objects.filter(
            workspace__slug=slug, project__isnull=True, pk__in=property_ids
        ).count()
        if valid_count != len(property_ids):
            return Response(
                {"error": "One or more properties are invalid for this workspace work item type"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        last_sort_order = IssueTypeProperty.objects.filter(
            workspace__slug=slug,
            issue_type_id=work_item_type_id,
            deleted_at__isnull=True,
        ).aggregate(largest=models.Max("sort_order"))["largest"]
        sort_order = (last_sort_order if last_sort_order else 0) + 10000

        issue_type_properties = [
            IssueTypeProperty(
                workspace_id=workspace.id,
                issue_type_id=work_item_type_id,
                property_id=property_id,
                sort_order=sort_order + (i * 10000),
                created_by_id=request.user.id,
                updated_by_id=request.user.id,
            )
            for i, property_id in enumerate(property_ids)
        ]
        IssueTypeProperty.objects.bulk_create(issue_type_properties, ignore_conflicts=True)
        return Response(status=status.HTTP_201_CREATED)


class WorkspaceWorkItemTypePropertyDetailAPIEndpoint(BaseAPIView):
    permission_classes = [WorkspaceEntityPermission, TokenHasScopeIfOAuth]
    required_alternate_scopes = {
        "PATCH": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_TYPES_WRITE_SCOPE]],
    }

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="update_workspace_work_item_type_property",
        summary="Update property sort order in a workspace work item type",
        description="Update the sort order of a property within a workspace-level work item type",
        request=OpenApiRequest(
            request=None,
            examples=[
                OpenApiExample(
                    "UpdateSortOrder",
                    value={"sort_order": 20000},
                    description="New sort order for the property",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(description="Sort order updated"),
            400: OpenApiResponse(description="sort_order is required"),
        },
    )
    def patch(self, request, slug, work_item_type_id, work_item_property_id):
        sort_order = request.data.get("sort_order")
        if sort_order is None:
            return Response(
                {"error": "sort_order is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        issue_type_property = IssueTypeProperty.objects.get(
            workspace__slug=slug,
            issue_type_id=work_item_type_id,
            property_id=work_item_property_id,
        )
        issue_type_property.sort_order = sort_order
        issue_type_property.save()
        return Response(status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_type_docs(
        operation_id="remove_property_from_workspace_work_item_type",
        summary="Remove a property from a workspace work item type",
        description="Dissociate a property from a workspace-level work item type",
        responses={
            204: OpenApiResponse(description="Property removed from work item type"),
            400: OpenApiResponse(description="Issue type property does not exist"),
        },
    )
    def delete(self, request, slug, work_item_type_id, work_item_property_id):
        issue_type_property = IssueTypeProperty.objects.filter(
            workspace__slug=slug,
            issue_type_id=work_item_type_id,
            property_id=work_item_property_id,
        ).first()
        if not issue_type_property:
            return Response(
                {"error": "Issue type property does not exist"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        issue_type_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
