# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Content search for agents (LIVIERE.md, "Content search"). POST with the phrase in the body, so it never shows
# in a URL (request log of RequestLoggerMiddleware, proxy logs); APITokenLogMiddleware leaves the body and the
# response out of api_activity_logs for this route (plane/liviere/search/privacy.py).

from rest_framework import status
from rest_framework.response import Response

from plane.api.views.base import BaseAPIView
from plane.app.permissions import WorkspaceUserPermission
from plane.liviere.search.queries import SearchError, accessible_project, parse_params, search


class ContentSearchAPIEndpoint(BaseAPIView):
    """Work items whose title, description or comment contains a phrase, in the projects the key may see."""

    permission_classes = [WorkspaceUserPermission]

    def post(self, request, slug):
        try:
            params = parse_params(request.data)
        except SearchError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        project = None
        if params["project"]:
            project = accessible_project(slug, request.user, params["project"])
            if project is None:
                return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        return Response(
            search(
                slug,
                request.user,
                params["q"],
                project=project,
                limit=params["limit"],
                include_archived=params["archived"],
            ),
            status=status.HTTP_200_OK,
        )
