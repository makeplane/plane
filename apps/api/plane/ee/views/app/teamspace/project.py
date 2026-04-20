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
import uuid

# Third party imports
from rest_framework.request import Request
from rest_framework import status
from rest_framework.response import Response

# Django imports

# Module imports
from .base import TeamspaceBaseEndpoint
from plane.db.models import Workspace
from plane.ee.models import TeamspaceMember, TeamspaceProject
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.permissions import can, ProjectPermissions


class AddTeamspaceProjectEndpoint(TeamspaceBaseEndpoint):
    @check_feature_flag(FeatureFlag.TEAMSPACES)
    @can(ProjectPermissions.MANAGE, resource_param="project_id")
    def post(self, request: Request, slug: str, project_id: uuid.UUID) -> Response:
        teamspace_ids = request.data.get("teamspace_ids", [])
        if not teamspace_ids:
            return Response(
                {"error": "No team space IDs provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Filter out all teamspace ids that the user is part of
        teamspace_ids = TeamspaceMember.objects.filter(
            team_space_id__in=teamspace_ids, member_id=request.user
        ).values_list("team_space_id", flat=True)

        workspace = Workspace.objects.get(slug=slug)

        # Add this all teamspace ids to the project
        TeamspaceProject.objects.bulk_create(
            [
                TeamspaceProject(
                    project_id=project_id,
                    team_space_id=team_space_id,
                    workspace=workspace,
                    sort_order=random.randint(1, 65535),
                )
                for team_space_id in teamspace_ids
            ]
        )

        return Response(status=status.HTTP_204_NO_CONTENT)
