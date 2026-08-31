# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.
#
# Mitigates (does not eliminate) the enumeration risk on unique-key fields: the
# VALUE_MUST_BE_UNIQUE check in ProjectCustomFieldValueSerializer.validate() is
# workspace-wide and does not check whether the requester can see the other
# project holding the conflicting value, so a member of one project could
# otherwise probe guessed values quickly to learn what exists elsewhere in the
# workspace. Scoped per-user (not per-project): the attack this mitigates spans
# projects, so a per-project throttle would not slow it down.

from rest_framework.throttling import SimpleRateThrottle


class ProjectCustomFieldValueWriteThrottle(SimpleRateThrottle):
    scope = "project_custom_field_value_write"

    def get_cache_key(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return None
        return f"throttle_project_custom_field_value_write_{request.user.id}"
