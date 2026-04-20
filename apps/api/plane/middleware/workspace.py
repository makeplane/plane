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


"""
Workspace Resolution Middleware

Resolves workspace slug from URL kwargs and attaches workspace context
to the request object for downstream use.

Caches slug -> workspace_id mapping in Redis (TTL controlled by
Workspace.SLUG_CACHE_TTL) to avoid a DB query on every request.
"""

from uuid import UUID


class WorkspaceResolverMiddleware:
    """
    Resolves workspace slug from URL kwargs.

    Cache hit:
    - sets request.workspace_id
    - keeps request.workspace as None

    Cache miss:
    - resolves workspace from DB
    - sets both request.workspace_id and request.workspace

    Uses process_view() which receives resolved URL kwargs from Django's
    URL dispatcher.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.workspace = None
        request.workspace_id = None
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        """Called after URL resolution with the resolved kwargs."""
        slug = view_kwargs.get("slug")
        if slug:
            self._resolve_workspace(request, slug)
        return None

    def _resolve_workspace(self, request, slug):
        """Resolve slug to workspace, using cache when possible."""
        from plane.db.models import Workspace

        workspace_id = Workspace.get_cached_workspace_id(slug)

        if workspace_id is not None:
            # Cache hit: set workspace_id directly (no DB query).
            # Drop malformed entries and retry via DB slug lookup.
            try:
                workspace_uuid = workspace_id if isinstance(workspace_id, UUID) else UUID(str(workspace_id))
                request.workspace_id = str(workspace_uuid)
                return
            except (TypeError, ValueError):
                Workspace.invalidate_slug_cache(slug)

        # Cache miss — resolve from slug
        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace:
            request.workspace = workspace
            request.workspace_id = str(workspace.id)
            Workspace.set_slug_cache(slug, workspace.id)
