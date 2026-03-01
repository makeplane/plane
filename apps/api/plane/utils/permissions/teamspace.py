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

# Third Party imports
from rest_framework.request import Request

# Module import
from plane.ee.models import TeamspaceProject, TeamspaceMember
from plane.payment.flags.flag_decorator import check_workspace_feature_flag
from plane.payment.flags.flag import FeatureFlag


def check_teamspace_membership(view, request: Request) -> bool:
    """
    Check if the user is a member of any teamspace associated with the project.

    Args:
        view: The view instance containing workspace_slug and project_id
        request (Request): The incoming request object containing user information

    Returns:
        bool: True if user is a member of any associated teamspace, False otherwise

    Note:
        This function first checks if teamspaces feature is enabled for the workspace
        before performing the membership check.
    """
    # check the user is part of the teamspace if the project is attached to any.
    if check_workspace_feature_flag(
        feature_key=FeatureFlag.TEAMSPACES,
        slug=view.workspace_slug,
        user_id=request.user.id,
    ):
        ## Get all the teamspace ids that the project is attached to.
        teamspace_ids = TeamspaceProject.objects.filter(
            workspace__slug=view.workspace_slug, project_id=view.project_id
        ).values_list("team_space_id", flat=True)

        # return True if the user is a member of any of the teamspace
        return TeamspaceMember.objects.filter(member=request.user, team_space_id__in=teamspace_ids).exists()
    return False
