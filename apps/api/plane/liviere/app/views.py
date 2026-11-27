# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# App (session) endpoints of the Liviere/plane fork. They live under /api/, which accepts session
# authentication only, so API keys cannot reach them.

# Django imports
from django.db import transaction

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ProjectPagePermission
from plane.app.views.base import BaseAPIView
from plane.db.models import Page
from plane.liviere.pages import API_BLOCK_KEY, is_owner_or_admin


class PageApiBlockEndpoint(BaseAPIView):
    """Turn 'Block API changes' on (POST) or off (DELETE) for a page; owner or project admin only."""

    permission_classes = [ProjectPagePermission]

    def post(self, request, slug, project_id, page_id):
        return self.set_block(request, slug, project_id, page_id, True)

    def delete(self, request, slug, project_id, page_id):
        return self.set_block(request, slug, project_id, page_id, False)

    def set_block(self, request, slug, project_id, page_id, blocked):
        with transaction.atomic():
            page = Page.objects.select_for_update().get(
                pk=page_id,
                workspace__slug=slug,
                project_pages__project_id=project_id,
                project_pages__deleted_at__isnull=True,
            )
            if not is_owner_or_admin(request, page, project_id):
                return Response(
                    {"error": "Only the page owner or a project admin can change this setting"},
                    status=status.HTTP_403_FORBIDDEN,
                )
            # Merge the key, other view_props stay as they are
            page.view_props = {**(page.view_props or {}), API_BLOCK_KEY: blocked}
            page.save(update_fields=["view_props", "updated_at", "updated_by"])
        return Response({"api_changes_blocked": blocked}, status=status.HTTP_200_OK)
