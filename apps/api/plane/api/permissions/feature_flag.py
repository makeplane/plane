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

from rest_framework.permissions import BasePermission
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_workspace_feature_flag


class FeatureFlagPermission(BasePermission):
    """
    Base permission class to check if a feature flag is enabled for the workspace.
    Subclass this and set the feature_flag attribute.
    """

    feature_flag = None

    def has_permission(self, request, view):
        if self.feature_flag is None:
            return True
        return check_workspace_feature_flag(self.feature_flag, view.kwargs.get("slug"))


class TeamspaceFeatureFlagPermission(FeatureFlagPermission):
    """Permission class for Teamspace feature flag"""

    feature_flag = FeatureFlag.TEAMSPACES
    message = "Payment required. Upgrade your plan to access Teamspaces"


class InitiativesFeatureFlagPermission(FeatureFlagPermission):
    """Permission class for Initiatives feature flag"""

    feature_flag = FeatureFlag.INITIATIVES
    message = "Payment required. Upgrade your plan to access Initiatives"


class ReleasesFeatureFlagPermission(FeatureFlagPermission):
    """Permission class for Releases feature flag"""

    feature_flag = FeatureFlag.RELEASES
    message = "Payment required. Upgrade your plan to access Releases"


class WorkflowFeatureFlagPermission(FeatureFlagPermission):
    """Permission class for Workflows feature flag"""

    feature_flag = FeatureFlag.WORKFLOWS
    message = "Payment required. Upgrade your plan to access Workflows"


class MultipleWorkflowsFeatureFlagPermission(FeatureFlagPermission):
    """Permission class for Multiple Workflows feature flag"""

    feature_flag = FeatureFlag.MULTIPLE_WORKFLOWS
    message = "Payment required. Upgrade your plan to access Multiple Workflows"
