# Django imports
from django.db.models import Q

# Third party imports
from rest_framework import status
from rest_framework.response import Response
from sentry_sdk import capture_exception

# Module imports
from .base import BaseAPIView
from plane.db.models import Workspace, Project, Issue, Cycle, Module, Page, IssueView


class GlobalSearchEndpoint(BaseAPIView):
    """Endpoint to search across multiple fields in the workspace and
    also show related workspace if found
    """

    def filter_workspaces(self, query, slug):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return Workspace.objects.filter(
            q, workspace_member__member=self.request.user
        ).values("name", "id", "slug")

    def filter_projects(self, query, slug):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return Project.objects.filter(
            q,
            Q(project_projectmember__member=self.request.user) | Q(network=2),
            workspace__slug=slug,
        ).values("name", "id", "identifier", "workspace__slug")

    def filter_issues(self, query, slug):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return Issue.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            workspace__slug=slug,
        ).values(
            "name",
            "id",
            "sequence_id",
            "project__identifier",
            "project_id",
            "workspace__slug",
        )

    def filter_cycles(self, query, slug):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return Cycle.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            workspace__slug=slug,
        ).values(
            "name",
            "id",
            "project_id",
            "workspace__slug",
        )

    def filter_modules(self, query, slug):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return Module.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            workspace__slug=slug,
        ).values(
            "name",
            "id",
            "project_id",
            "workspace__slug",
        )

    def filter_pages(self, query, slug):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return Page.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            workspace__slug=slug,
        ).values(
            "name",
            "id",
            "project_id",
            "workspace__slug",
        )

    def filter_views(self, query, slug):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return IssueView.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            workspace__slug=slug,
        ).values(
            "name",
            "id",
            "project_id",
            "workspace__slug",
        )

    def get(self, request, slug):
        try:
            query = request.query_params.get("search", False)
            if not query:
                return Response(
                    {
                        "results": {
                            "workspace": [],
                            "project": [],
                            "issue": [],
                            "cycle": [],
                            "module": [],
                            "issue_view": [],
                            "page": [],
                        }
                    },
                    status=status.HTTP_200_OK,
                )

            MODELS_MAPPER = {
                "workspace": self.filter_workspaces,
                "project": self.filter_projects,
                "issue": self.filter_issues,
                "cycle": self.filter_cycles,
                "module": self.filter_modules,
                "issue_view": self.filter_views,
                "page": self.filter_pages,
            }

            results = {}

            for model in MODELS_MAPPER.keys():
                func = MODELS_MAPPER.get(model, None)
                results[model] = func(query, slug)
            return Response({"results": results}, status=status.HTTP_200_OK)

        except Exception as e:
            capture_exception(e)
            return Response(
                {"error": "Something went wrong please try again later"},
                status=status.HTTP_400_BAD_REQUEST,
            )
