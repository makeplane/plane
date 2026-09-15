# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework.permissions import BasePermission

from plane.research.utils.config import research_module_enabled


class ResearchModulePermission(BasePermission):
    """Rejects every research request while the module switch is off.

    Frontend entry hiding is only a convenience - this permission is the
    server side gate described in P0-CFG-01 / P0-CFG-03.
    """

    message = "Research module is not enabled."

    def has_permission(self, request, view):
        return research_module_enabled()
