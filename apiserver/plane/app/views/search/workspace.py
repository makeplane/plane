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

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def filter_workspaces(self, query, slug):
        """Filter workspaces based on the query"""
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return (
            Workspace.objects.filter(
                q, workspace_member__member=self.request.user
            )
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
                q,
                workspace__slug=slug,
                archived_at__isnull=True,
                is_global=True,
            )
            .filter(
                Q(
                    owned_by=self.request.user,
                )
                | Q(access=0)
            )
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

        MODELS_MAPPER = {
            "workspace": self.filter_workspaces,
            "page": self.filter_pages,
        }

        results = {}

        for model in MODELS_MAPPER.keys():
            func = MODELS_MAPPER.get(model, None)
            results[model] = func(query, slug)
        return Response({"results": results}, status=status.HTTP_200_OK)


class WorkspaceEntitySearchEndpoint(BaseAPIView):

    permission_classes = [
        WorkspaceEntityPermission,
    ]

    def filter_issues(self, slug, query, count):
        """Filter issues based on the query"""
        fields = ["name", "sequence_id", "project__identifier"]
        q = Q()

        if query:
            for field in fields:
                if field == "sequence_id":
                    # Match whole integers only (exclude decimal numbers)
                    sequences = re.findall(r"\b\d+\b", query)
                    for sequence_id in sequences:
                        q |= Q(**{"sequence_id": sequence_id})
                else:
                    q |= Q(**{f"{field}__icontains": query})

        issues = (
            Issue.issue_objects.filter(
                q,
                project__project_projectmember__member=self.request.user,
                project__project_projectmember__is_active=True,
                workspace__slug=slug,
            )
            .order_by("-created_at")
            .distinct()
            .values(
                "name",
                "id",
                "sequence_id",
                "project__identifier",
                "project_id",
                "priority",
                "state_id",
                "type_id",
            )[:count]
        )

        return issues

    def get(self, request, slug):
        query = request.query_params.get("query", False)
        query_type = request.query_params.get("query_type", "issue")
        count = int(request.query_params.get("count", 5))

        MODELS_MAPPER = {
            "issue": self.filter_issues,
        }

        func = MODELS_MAPPER.get(query_type, None)
        results = func(slug, query, count)
        return Response(results, status=status.HTTP_200_OK)
