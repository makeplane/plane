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
from django.db import models

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from drf_spectacular.utils import OpenApiResponse, OpenApiRequest, OpenApiExample

# Module imports
from plane.db.models import Workspace
from plane.ee.models import IssueProperty, IssuePropertyOption
from plane.api.serializers import IssuePropertyOptionAPISerializer
from plane.api.views.base import ScopedBaseAPIView
from plane.permissions import can, WorkspaceCustomPropertyPermissions
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.utils.workspace_feature import check_workspace_feature, WorkspaceFeatureContext
from plane.utils.openapi.decorators import workspace_work_item_property_option_docs
from plane.utils.oauth import (
    READ_SCOPE,
    WRITE_SCOPE,
    WORKSPACES_WORK_ITEM_PROPERTY_OPTIONS_READ_SCOPE,
    WORKSPACES_WORK_ITEM_PROPERTY_OPTIONS_WRITE_SCOPE,
)


class WorkspaceWorkItemPropertyOptionListCreateAPIEndpoint(ScopedBaseAPIView):
    """
    This viewset automatically provides `list` and `create` actions related to issue property options.
    """

    model = IssuePropertyOption
    serializer_class = IssuePropertyOptionAPISerializer
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTY_OPTIONS_READ_SCOPE]],
        "POST": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTY_OPTIONS_WRITE_SCOPE]],
    }
    webhook_event = "issue_property_option"

    # list issue property options and get issue property option by id
    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_option_docs(
        operation_id="list_workspace_work_item_property_options",
        summary="List workspace work item property options",
        description="List workspace work item property options",
        responses={
            200: OpenApiResponse(
                description="Workspace work item property options",
                response=IssuePropertyOptionAPISerializer(many=True),
            ),
            404: OpenApiResponse(description="Issue property not found"),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug, property_id):
        # list of issue properties
        issue_properties = self.model.objects.filter(
            workspace__slug=slug,
            property_id=property_id,
        )
        serializer = self.serializer_class(issue_properties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # create issue property option
    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_option_docs(
        operation_id="create_workspace_work_item_property_option",
        summary="Create a new workspace work item property option",
        description="Create a new workspace work item property option",
        request=OpenApiRequest(
            request=IssuePropertyOptionAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyOptionAPISerializer",
                    value={
                        "name": "High",
                        "description": "The highest priority",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for creating an issue property option",
                ),
            ],
        ),
        responses={
            201: OpenApiResponse(
                description="Workspace work item property option created",
                response=IssuePropertyOptionAPISerializer,
            ),
            400: OpenApiResponse(
                description="Workspace work item property type is not OPTION",
            ),
            409: OpenApiResponse(
                description="Workspace work item property with the same external id and external source already exists",
            ),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.CREATE, resource_param="workspace_id", scope_param_type="workspace")
    def post(self, request, slug, property_id):
        workspace = Workspace.objects.get(slug=slug)

        if not check_workspace_feature(slug, WorkspaceFeatureContext.IS_WORK_ITEM_TYPES_ENABLED):
            return Response(
                {"error": "Workspace work item types are not enabled"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        issue_property = IssueProperty.objects.get(pk=property_id, workspace=workspace, project__isnull=True)

        # crating the issue property options if the property type is OPTION
        if issue_property.property_type == "OPTION":
            # check if external id and external source is provided
            external_id = request.data.get("external_id")
            external_source = request.data.get("external_source")
            if external_id and external_source:
                existing_option = self.model.objects.filter(
                    workspace__slug=slug,
                    property_id=property_id,
                    external_source=external_source,
                    external_id=external_id,
                ).first()
                if existing_option:
                    return Response(
                        {
                            "error": "Issue Property with the same external id and external source already exists",
                            "id": str(existing_option.id),
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

            # validate if ant default property option is already available
            default_option_exists = self.model.objects.filter(
                workspace__slug=slug,
                property_id=property_id,
                is_default=True,
            )
            if default_option_exists.exists() and "is_default" in request.data and request.data["is_default"]:
                return Response(
                    {"error": "Default option already exists"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # getting the last sort order from the database
            last_sort_order = self.model.objects.filter(
                workspace__slug=slug,
                property=issue_property,
            ).aggregate(largest=models.Max("sort_order"))["largest"]

            # Set the sort order for the new option
            if last_sort_order is not None:
                sort_order = last_sort_order + 10000
            else:
                sort_order = 10000

            data = request.data
            property_option_serializer = self.serializer_class(data=data)
            property_option_serializer.is_valid(raise_exception=True)
            property_option_serializer.save(
                workspace=workspace,
                property=issue_property,
                sort_order=sort_order,
            )
            # getting the issue property
            property_option = self.model.objects.get(
                workspace__slug=slug,
                property_id=property_id,
                pk=property_option_serializer.data["id"],
            )
            serializer = self.serializer_class(property_option)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {"error": "Issue Property type is not OPTION"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class WorkspaceWorkItemPropertyOptionDetailAPIEndpoint(ScopedBaseAPIView):
    """
    This viewset automatically provides `retrieve`, `update` and `destroy` actions
    related to workspace work item property options.
    """

    model = IssuePropertyOption
    serializer_class = IssuePropertyOptionAPISerializer
    required_alternate_scopes = {
        "GET": [[READ_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTY_OPTIONS_READ_SCOPE]],
        "PATCH": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTY_OPTIONS_WRITE_SCOPE]],
        "DELETE": [[WRITE_SCOPE], [WORKSPACES_WORK_ITEM_PROPERTY_OPTIONS_WRITE_SCOPE]],
    }
    webhook_event = "issue_property_option"

    # list issue property options and get issue property option by id
    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_option_docs(
        operation_id="retrieve_workspace_work_item_property_option",
        summary="Get workspace work item property option by id",
        description="Get workspace work item property option by id",
        responses={
            200: OpenApiResponse(
                description="Issue property options",
                response=IssuePropertyOptionAPISerializer,
            ),
            404: OpenApiResponse(description="Issue property not found"),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.VIEW, resource_param="workspace_id", scope_param_type="workspace")
    def get(self, request, slug, property_id, option_id):
        # getting issue property by id
        issue_property = self.model.objects.get(
            workspace__slug=slug,
            property_id=property_id,
            pk=option_id,
        )
        serializer = self.serializer_class(issue_property)
        return Response(serializer.data, status=status.HTTP_200_OK)

    # update issue property option by id
    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_option_docs(
        operation_id="update_workspace_work_item_property_option",
        summary="Update a workspace work item property option",
        description="Update a workspace work item property option",
        request=OpenApiRequest(
            request=IssuePropertyOptionAPISerializer,
            examples=[
                OpenApiExample(
                    "IssuePropertyOptionAPISerializer",
                    value={
                        "name": "High",
                        "description": "The highest priority",
                        "external_id": "1234567890",
                        "external_source": "github",
                    },
                    description="Example request for updating an issue property option",
                ),
            ],
        ),
        responses={
            200: OpenApiResponse(
                description="Workspace work item property option updated",
                response=IssuePropertyOptionAPISerializer,
            ),
            400: OpenApiResponse(
                description="Default option already exists",
            ),
            404: OpenApiResponse(description="Workspace work item property option not found"),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.EDIT, resource_param="workspace_id", scope_param_type="workspace")
    def patch(self, request, slug, property_id, option_id):
        # validate if ant default property option is already available
        default_option_exists = self.model.objects.filter(
            workspace__slug=slug,
            property_id=property_id,
            is_default=True,
        )
        if default_option_exists.exists() and "is_default" in request.data and request.data["is_default"]:
            return Response(
                {"error": "Default option already exists"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        property_option = self.model.objects.get(
            workspace__slug=slug,
            property_id=property_id,
            pk=option_id,
        )

        data = request.data
        property_option_serializer = self.serializer_class(property_option, data=data, partial=True)
        property_option_serializer.is_valid(raise_exception=True)
        property_option_serializer.save()

        return Response(property_option_serializer.data, status=status.HTTP_200_OK)

    # delete issue property option by id
    @check_feature_flag(FeatureFlag.WORKSPACE_WORK_ITEM_TYPES)
    @workspace_work_item_property_option_docs(
        operation_id="delete_workspace_work_item_property_option",
        summary="Delete a workspace work item property option",
        description="Delete a workspace work item property option",
        responses={
            204: OpenApiResponse(description="Workspace work item property option deleted"),
            404: OpenApiResponse(description="Workspace work item property option not found"),
        },
    )
    @can(WorkspaceCustomPropertyPermissions.DELETE, resource_param="workspace_id", scope_param_type="workspace")
    def delete(self, request, slug, property_id, option_id):
        property_option = self.model.objects.get(
            workspace__slug=slug,
            property_id=property_id,
            pk=option_id,
        )
        property_option.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
