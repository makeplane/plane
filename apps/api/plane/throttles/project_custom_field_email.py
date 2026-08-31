# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework.throttling import SimpleRateThrottle


class ProjectCustomFieldDataEmailThrottle(SimpleRateThrottle):
    scope = "project_custom_field_data_email"

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None
        project_id = view.kwargs.get("project_id")
        return f"throttle_project_custom_field_data_email_{request.user.id}_{project_id}"
