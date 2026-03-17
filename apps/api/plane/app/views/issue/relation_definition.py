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
from django.db.models import Q

# Rest Framework imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import WorkItemRelationDefinitionInputSerializer, WorkItemRelationDefinitionSerializer
from plane.db.models import DEFAULT_IMPLEMENTS_DEFINITION, WorkItemRelationDefinition, Workspace
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag, check_workspace_feature_flag

# Local imports
from .. import BaseViewSet


class WorkItemRelationDefinitionViewSet(BaseViewSet):
    DEFAULT_SORT_ORDER = 65535
    model = WorkItemRelationDefinition
    input_serializer_class = WorkItemRelationDefinitionInputSerializer
    serializer_class = WorkItemRelationDefinitionSerializer

    def _get_next_sort_order(self, workspace):
        last_sort_order = (
            WorkItemRelationDefinition.objects.filter(workspace=workspace)
            .order_by("-sort_order")
            .values_list("sort_order", flat=True)
            .first()
        )
        return (last_sort_order) + self.DEFAULT_SORT_ORDER if last_sort_order else self.DEFAULT_SORT_ORDER

    def get_queryset(self):
        # processing the query params
        workspace_slug = self.kwargs.get("slug")
        is_active = self.request.query_params.get("is_active", "true") == "true"
        is_default = self.request.query_params.get("is_default", "true") == "true"

        # getting the queryset
        q = super().get_queryset().filter(workspace__slug=workspace_slug).order_by("sort_order", "-created_at")

        # filtering the queryset based on the is_active query param
        if is_active:
            q = q.filter(is_active=True)

        # filtering the queryset based on the is_default query param
        if is_default:
            q = q.filter(is_default=True)

        # filtering the queryset based on the feature flag
        is_custom_relations_feature_flag_enabled = check_workspace_feature_flag(
            FeatureFlag.CUSTOM_RELATIONS, workspace_slug
        )
        if not is_custom_relations_feature_flag_enabled:
            q = q.filter(is_default=True)

        # filtering the queryset based on the timeline dependency feature flag
        is_timeline_dependency_feature_flag_enabled = check_workspace_feature_flag(
            FeatureFlag.TIMELINE_DEPENDENCY, workspace_slug
        )
        if not is_timeline_dependency_feature_flag_enabled:
            q = q.filter(
                ~Q(
                    Q(inward=DEFAULT_IMPLEMENTS_DEFINITION["inward"])
                    | Q(outward=DEFAULT_IMPLEMENTS_DEFINITION["outward"])
                )
            )

        # returning the queryset
        return q

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        return super().list(request, slug)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        return super().retrieve(request, slug, pk)

    @check_feature_flag(FeatureFlag.CUSTOM_RELATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        # validating the workspace
        workspace = Workspace.objects.get(slug=slug)
        workspace_id = workspace.id

        # requested data should be the same as the input serializer
        requested_data = request.data

        # validating the requested data
        serializer = self.input_serializer_class(data=requested_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # getting the next sort order
        next_sort_order = self._get_next_sort_order(workspace_id)

        # saving the relation definition
        relation_definition = serializer.save(workspace_id=workspace_id, sort_order=next_sort_order)
        relation_definition_serializer = self.serializer_class(relation_definition)
        response_data = relation_definition_serializer.data

        return Response(response_data, status=status.HTTP_201_CREATED)

    @check_feature_flag(FeatureFlag.CUSTOM_RELATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        # validating the relation definition
        relation_definition = WorkItemRelationDefinition.objects.get(workspace__slug=slug, pk=pk)

        # requested data should be the same as the input serializer
        requested_data = request.data

        # validating the requested data
        serializer = self.input_serializer_class(relation_definition, data=requested_data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # saving the relation definition and getting the updated instance
        relation_definition = serializer.save()

        # serializing the response data
        relation_definition_serializer = self.serializer_class(relation_definition)
        response_data = relation_definition_serializer.data

        return Response(response_data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.CUSTOM_RELATIONS)
    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        # validating the relation definition
        relation_definition = WorkItemRelationDefinition.objects.get(workspace__slug=slug, pk=pk)

        # deleting the relation definition
        relation_definition.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
