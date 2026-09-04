# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""API-key authenticated Page endpoints for the public v1 API."""

from plane.api.middleware.api_authentication import APIKeyAuthentication
from plane.app.serializers import PageSerializer
from plane.app.views.page.base import (
    PageDuplicateEndpoint as AppPageDuplicateEndpoint,
    PageFavoriteViewSet as AppPageFavoriteViewSet,
    PageViewSet as AppPageViewSet,
    PagesDescriptionViewSet as AppPagesDescriptionViewSet,
)
from plane.app.views.page.version import PageVersionEndpoint as AppPageVersionEndpoint
from plane.db.models import Project, ProjectMember


class PageViewSet(AppPageViewSet):
    """Expose the existing Page CRUD handlers through API-key authentication."""

    authentication_classes = [APIKeyAuthentication]

    def list(self, request, slug, project_id):
        """Return project pages in the v1 cursor-pagination envelope."""
        queryset = self.get_queryset()
        project = Project.objects.get(pk=project_id)
        if (
            ProjectMember.objects.filter(
                workspace__slug=slug,
                project_id=project_id,
                member=request.user,
                role=5,
                is_active=True,
            ).exists()
            and not project.guest_view_all_features
        ):
            queryset = queryset.filter(owned_by=request.user)

        return self.paginate(
            request=request,
            queryset=queryset,
            on_results=lambda pages: PageSerializer(pages, many=True).data,
        )


class PageFavoriteViewSet(AppPageFavoriteViewSet):
    """Expose Page favorite handlers through API-key authentication."""

    authentication_classes = [APIKeyAuthentication]


class PagesDescriptionViewSet(AppPagesDescriptionViewSet):
    """Expose Page description handlers through API-key authentication."""

    authentication_classes = [APIKeyAuthentication]


class PageVersionEndpoint(AppPageVersionEndpoint):
    """Expose Page version handlers through API-key authentication."""

    authentication_classes = [APIKeyAuthentication]


class PageDuplicateEndpoint(AppPageDuplicateEndpoint):
    """Expose Page duplication through API-key authentication."""

    authentication_classes = [APIKeyAuthentication]
