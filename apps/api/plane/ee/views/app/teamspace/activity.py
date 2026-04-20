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

# Django imports
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.gzip import gzip_page

# Third Party imports
from rest_framework.response import Response
from rest_framework import status

# Module imports
from .base import TeamspaceBaseEndpoint
from plane.ee.models import TeamspaceActivity
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.payment.flags.flag import FeatureFlag
from plane.ee.serializers import TeamspaceActivitySerializer
from plane.permissions import can, TeamspacePermissions


class TeamspaceActivityEndpoint(TeamspaceBaseEndpoint):
    use_read_replica = True

    model = TeamspaceActivity

    @method_decorator(gzip_page)
    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(TeamspacePermissions.VIEW, resource_param="team_space_id")
    def get(self, request, slug, team_space_id):
        filters = {}
        if request.GET.get("created_at__gt", None) is not None:
            filters = {"created_at__gt": request.GET.get("created_at__gt")}

        team_activities = (
            TeamspaceActivity.objects.filter(team_space_id=team_space_id)
            .filter(~Q(field__in=["comment", "reaction"]), workspace__slug=slug)
            .filter(**filters)
            .select_related("actor", "workspace", "team_space")
        ).order_by("created_at")

        team_activities = TeamspaceActivitySerializer(team_activities, many=True).data
        return Response(team_activities, status=status.HTTP_200_OK)
