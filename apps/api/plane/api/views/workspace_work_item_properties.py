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

# Django imports
from django.db import IntegrityError

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiExample

# Module imports
from plane.api.views.base import ScopedBaseAPIView
from plane.permissions import can, WorkspaceCustomPropertyPermissions
from plane.db.models import Workspace
from plane.ee.models import IssueProperty, PropertyTypeEnum, RelationTypeEnum, IssuePropertyValue
from plane.api.serializers import (
    IssuePropertyAPISerializer,
)
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.utils.workspace_feature import check_workspace_feature, WorkspaceFeatureContext
from plane.utils.openapi.decorators import workspace_work_item_property_docs
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    WORKSPACES_WORK_ITEM_PROPERTIES_READ_SCOPE,
    WORKSPACES_WORK_ITEM_PROPERTIES_WRITE_SCOPE,
)


class WorkspaceWorkItemPropertyListCreateAPIEndpoint(ScopedBaseAPIView):
    model = IssueProperty
    serializer_class = IssuePropertyAPISerializer
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTIES_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTIES_WRITE_SCOPE]],
    }

    type_logo_props = {
        PropertyTypeEnum.TEXT: {
            "in_use": "icon",
            "icon": {"name": "AlignLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DECIMAL: {
            "in_use": "icon",
            "icon": {"name": "Hash", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.OPTION: {
            "in_use": "icon",
            "icon": {"name": "CircleChevronDown", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.BOOLEAN: {
            "in_use": "icon",
            "icon": {"name": "ToggleLeft", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.DATETIME: {
            "in_use": "icon",
            "icon": {"name": "Calendar", "color": "#6d7b8a"},
        },
        f"{PropertyTypeEnum.RELATION}_{RelationTypeEnum.USER}": {
            "in_use": "icon",
            "icon": {"name": "UsersRound", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.URL: {
            "in_use": "icon",
            "icon": {"name": "Link", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.EMAIL: {
            "in_use": "icon",
            "icon": {"name": "Envelope", "color": "#6d7b8a"},
        },
        PropertyTypeEnum.FILE: {
            "in_use": "icon",
            "icon": {"name": "File", "color": "#6d7b8a"},
        },
    }

    def get_logo_props(self, property_type, relation_type=None):
        if property_type == PropertyTypeEnum.RELATION:
            return self.type_logo_props.get(f"{PropertyTypeEnum.RELATION}_{relation_type}")
        return self.type_logo_props.get(property_type)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_docs(
        operation_id="list_workspace_work_item_properties",
        summary="List workspace work item properties",
        description="List all workspace-level work item properties",
        responses={
            200: OpenApiResponse(
                description="Workspace work item properties",
                response=IssuePropertyAPISerializer(many=True),
            ),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug):
        issue_properties = self.model.objects.filter(
            workspace__slug=slug,
            project__isnull=True,
        )
        serializer = self.serializer_class(issue_properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_docs(
        operation_id="create_workspace_work_item_property",
        summary="Create a workspace work item property",
        description="Create a new workspace-level work item property",
        request=OpenApiRequest(
            request=IssuePropertyAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyAPISerializer",
                    value={"display_name": "Priority", "property_type": "OPTION"},
                    description="Example request for creating a workspace work item property",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Workspace work item property created",
                response=IssuePropertyAPISerializer,
            ),
            400: OpenApiResponse(description="Custom property with this name already exists"),
            409: OpenApiResponse(description="Property with the same external id and source already exists"),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")
    def post(self, request, slug):
        try:
            workspace = Workspace.objects.get(slug=slug)

            if not check_workspace_feature(slug, WorkspaceFeatureContext.IS_WORK_ITEM_TYPES_ENABLED):
                return Response(
                    {"error": "Workspace work item types are not enabled"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # check for duplicate display_name
            existing_names = self.model.objects.filter(
                workspace=workspace,
                project__isnull=True,
            ).values_list("display_name", flat=True)
            if request.data.get("display_name") in existing_names:
                return Response(
                    {"error": "Custom property with this name already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # default is_active to False if not provided
            if not request.data.get("is_active"):
                request.data["is_active"] = False

            # validate is_multi / default_value
            if not request.data.get("is_multi") and len(request.data.get("default_value", [])) > 1:
                return Response(
                    {"error": "Default value must be a single value for non-multi properties"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # clear default_value when property is required
            if request.data.get("is_required") is True:
                request.data["default_value"] = []

            # check for external_id dedup
            external_id = request.data.get("external_id")
            external_source = request.data.get("external_source")
            if external_id and external_source:
                existing = self.model.objects.filter(
                    workspace=workspace,
                    project__isnull=True,
                    external_id=external_id,
                    external_source=external_source,
                ).first()
                if existing:
                    return Response(
                        {
                            "error": "Issue Property with the same external id and external source already exists",
                            "id": str(existing.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

            data = request.data
            serializer = self.serializer_class(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save(
                workspace=workspace,
                project=None,
                logo_props=self.get_logo_props(data.get("property_type"), data.get("relation_type")),
            )

            # re-fetch
            issue_property = self.model.objects.get(pk=serializer.data["id"])
            return Response(self.serializer_class(issue_property).data, status=status.HTTP_201_CREATED)
        except IntegrityError:
            return Response(
                {"error": "A property with the same name already exists in this workspace"},
                status=status.HTTP_409_CONFLICT,
            )


class WorkspaceWorkItemPropertyDetailAPIEndpoint(ScopedBaseAPIView):
    model = IssueProperty
    serializer_class = IssuePropertyAPISerializer
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTIES_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTIES_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTIES_WRITE_SCOPE]],
    }

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_docs(
        operation_id="retrieve_workspace_work_item_property",
        summary="Get a workspace work item property",
        description="Get a workspace-level work item property by ID",
        responses={
            200: OpenApiResponse(
                description="Workspace work item property",
                response=IssuePropertyAPISerializer,
            ),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug, property_id):
        issue_property = self.model.objects.get(
            workspace__slug=slug,
            project__isnull=True,
            pk=property_id,
        )
        serializer = self.serializer_class(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_docs(
        operation_id="update_workspace_work_item_property",
        summary="Update a workspace work item property",
        description="Update a workspace-level work item property",
        request=OpenApiRequest(
            request=IssuePropertyAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyAPISerializer",
                    value={"display_name": "Priority", "is_required": True},
                    description="Example request for updating a workspace work item property",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Workspace work item property updated",
                response=IssuePropertyAPISerializer,
            ),
            400: OpenApiResponse(description="Default value must be a single value for non-multi properties"),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")
    def patch(self, request, slug, property_id):
        issue_property = self.model.objects.get(
            workspace__slug=slug,
            project__isnull=True,
            pk=property_id,
        )

        # validate is_multi / default_value
        if not request.data.get("is_multi", issue_property.is_multi) and len(request.data.get("default_value", [])) > 1:
            return Response(
                {"error": "Default value must be a single value for non-multi properties"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # clear default_value when marking property as required
        if request.data.get("is_required", issue_property.is_required) is True:
            request.data["default_value"] = []

        # reset related fields when property_type changes
        if request.data.get("property_type") and request.data.get("property_type") != issue_property.property_type:
            defaults = {
                "relation_type": None,
                "default_value": [],
                "settings": {},
                "is_multi": False,
                "validation_rules": {},
            }
            for field, default_value in defaults.items():
                request.data.setdefault(field, default_value)

        serializer = self.serializer_class(issue_property, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_docs(
        operation_id="delete_workspace_work_item_property",
        summary="Delete a workspace work item property",
        description="Delete a workspace-level work item property",
        responses={
            204: OpenApiResponse(description="Workspace work item property deleted"),
            400: OpenApiResponse(description="Cannot delete property with associated work items"),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.DELETE, resource_param="workspace_id", scope_param_type="workspace")
    def delete(self, request, slug, property_id):
        issue_property = self.model.objects.get(
            workspace__slug=slug,
            project__isnull=True,
            pk=property_id,
        )

        # check any work item using this property
        if IssuePropertyValue.objects.filter(workspace__slug=slug, property_id=property_id).exists():
            return Response(
                {"error": "Cannot delete property with associated work items"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_property.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
