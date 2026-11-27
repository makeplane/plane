# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Page helpers shared by the fork's public API (plane/liviere/api) and app endpoints (plane/liviere/app).

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE
from plane.db.models import ProjectMember

# Key in Page.view_props. The app does not write page view_props (full width and sticky toolbar
# are browser-local settings), so the flag is not overwritten by the UI.
API_BLOCK_KEY = "liviere_block_api"


def api_changes_blocked(page):
    return bool((page.view_props or {}).get(API_BLOCK_KEY))


def api_changes_blocked_response():
    return Response(
        {
            "error": "Changes via the API are blocked for this page: its owner or a project admin turned on "
            "'Block API changes' in the page menu. Nothing was written."
        },
        status=status.HTTP_409_CONFLICT,
    )


def is_owner_or_admin(request, page, project_id):
    return (
        page.owned_by_id == request.user.id
        or ProjectMember.objects.filter(
            project_id=project_id, member=request.user, is_active=True, role=ROLE.ADMIN.value
        ).exists()
    )
