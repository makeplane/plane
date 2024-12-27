# Python imports
import re

# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views import BaseAPIView
from plane.db.models import Workspace, Page, Issue
from plane.app.permissions import WorkspaceEntityPermission


class WorkspaceSearchEndpoint(BaseAPIView):
    """Endpoint to search across multiple fields in the workspace and
    also show related workspace if found
    """

    permission_classes = [WorkspaceEntityPermission]

    def filter_workspaces(self, query, slug):
        """Filter workspaces based on the query"""
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return (
            Workspace.objects.filter(q, workspace_member__member=self.request.user)
            .distinct()
            .values("name", "id", "slug")
        )

    def filter_pages(self, query, slug):
        """Filter pages based on the query"""
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return (
            Page.objects.filter(
                q, workspace__slug=slug, archived_at__isnull=True, is_global=True
            )
            .filter(Q(owned_by=self.request.user) | Q(access=0))
            .distinct()
            .values("name", "id", "workspace__slug")
        )

    def get(self, request, slug):
        query = request.GET.get("search", False)
        if not query:
            return Response(
                {"error": "Search query is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        MODELS_MAPPER = {"workspace": self.filter_workspaces, "page": self.filter_pages}

        results = {}

        for model in MODELS_MAPPER.keys():
            func = MODELS_MAPPER.get(model, None)
            results[model] = func(query, slug)
        return Response({"results": results}, status=status.HTTP_200_OK)
