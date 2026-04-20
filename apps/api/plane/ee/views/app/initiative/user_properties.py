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

from rest_framework.response import Response
from rest_framework import status

# Module imports
from plane.ee.views.base import BaseAPIView
from plane.db.models import Workspace
from plane.ee.models import InitiativeUserProperty
from plane.permissions import can, InitiativePermissions
from plane.ee.serializers.app.initiative import InitiativeUserPropertySerializer
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag


class InitiativeUserPropertiesEndpoint(BaseAPIView):
    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.VIEW, resource_param="workspace_id")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        initiative_user_properties, _ = InitiativeUserProperty.objects.get_or_create(
            user=request.user, workspace=workspace
        )
        serializer = InitiativeUserPropertySerializer(initiative_user_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @check_feature_flag(FeatureFlag.INITIATIVES)
    @can(InitiativePermissions.VIEW, resource_param="workspace_id")
    def patch(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        initiative_user_properties = InitiativeUserProperty.objects.get(user=request.user, workspace=workspace)
        initiative_user_properties.filters = request.data.get("filters", initiative_user_properties.filters)

        initiative_user_properties.display_filters = request.data.get(
            "display_filters", initiative_user_properties.display_filters
        )
        initiative_user_properties.display_properties = request.data.get(
            "display_properties", initiative_user_properties.display_properties
        )
        initiative_user_properties.rich_filters = request.data.get(
            "rich_filters", initiative_user_properties.rich_filters
        )
        initiative_user_properties.pql_filters = request.data.get("pql_filters", initiative_user_properties.pql_filters)
        initiative_user_properties.last_used_filter = request.data.get(
            "last_used_filter", initiative_user_properties.last_used_filter
        )
        initiative_user_properties.save()
        serializer = InitiativeUserPropertySerializer(initiative_user_properties)
        return Response(serializer.data, status=status.HTTP_200_OK)
