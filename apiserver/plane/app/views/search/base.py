# Python imports
import re

# Django imports
from django.db.models import Q, OuterRef, Subquery, Value, UUIDField, CharField
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework import status
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Workspace,
    Project,
    Issue,
    Cycle,
    Module,
    Page,
    IssueView,
    ProjectPage,
)


class GlobalSearchEndpoint(BaseAPIView):
    """Endpoint to search across multiple fields in the workspace and
    also show related workspace if found
    """

    def filter_workspaces(self, query, slug, project_id, workspace_search):
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

    def filter_projects(self, query, slug, project_id, workspace_search):
        fields = ["name", "identifier"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})
        return (
            Project.objects.filter(
                q,
                project_projectmember__member=self.request.user,
                project_projectmember__is_active=True,
                archived_at__isnull=True,
                workspace__slug=slug,
            )
            .distinct()
            .values("name", "id", "identifier", "workspace__slug")
        )

    def filter_issues(self, query, slug, project_id, workspace_search):
        fields = ["name", "sequence_id", "project__identifier"]
        q = Q()
        for field in fields:
            if field == "sequence_id":
                # Match whole integers only (exclude decimal numbers)
                sequences = re.findall(r"\b\d+\b", query)
                for sequence_id in sequences:
                    q |= Q(**{"sequence_id": sequence_id})
            else:
                q |= Q(**{f"{field}__icontains": query})

        issues = Issue.issue_objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            workspace__slug=slug,
        )

        if workspace_search == "false" and project_id:
            issues = issues.filter(project_id=project_id)

        return issues.distinct().values(
            "name",
            "id",
            "sequence_id",
            "project__identifier",
            "project_id",
            "workspace__slug",
        )[:100]

    def filter_cycles(self, query, slug, project_id, workspace_search):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})

        cycles = Cycle.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            workspace__slug=slug,
        )

        if workspace_search == "false" and project_id:
            cycles = cycles.filter(project_id=project_id)

        return cycles.distinct().values(
            "name",
            "id",
            "project_id",
            "project__identifier",
            "workspace__slug",
        )

    def filter_modules(self, query, slug, project_id, workspace_search):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})

        modules = Module.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            workspace__slug=slug,
        )

        if workspace_search == "false" and project_id:
            modules = modules.filter(project_id=project_id)

        return modules.distinct().values(
            "name",
            "id",
            "project_id",
            "project__identifier",
            "workspace__slug",
        )

    def filter_pages(self, query, slug, project_id, workspace_search):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})

        pages = (
            Page.objects.filter(
                q,
                projects__project_projectmember__member=self.request.user,
                projects__project_projectmember__is_active=True,
                projects__archived_at__isnull=True,
                workspace__slug=slug,
            )
            .annotate(
                project_ids=Coalesce(
                    ArrayAgg(
                        "projects__id",
                        distinct=True,
                        filter=~Q(projects__id=True),
                    ),
                    Value([], output_field=ArrayField(UUIDField())),
                ),
            )
            .annotate(
                project_identifiers=Coalesce(
                    ArrayAgg(
                        "projects__identifier",
                        distinct=True,
                        filter=~Q(projects__id=True),
                    ),
                    Value([], output_field=ArrayField(CharField())),
                ),
            )
        )

        if workspace_search == "false" and project_id:
            project_subquery = ProjectPage.objects.filter(
                page_id=OuterRef("id"),
                project_id=project_id,
            ).values_list("project_id", flat=True)[:1]

            pages = pages.annotate(
                project_id=Subquery(project_subquery)
            ).filter(project_id=project_id)

        return pages.distinct().values(
            "name",
            "id",
            "project_ids",
            "project_identifiers",
            "workspace__slug",
        )

    def filter_views(self, query, slug, project_id, workspace_search):
        fields = ["name"]
        q = Q()
        for field in fields:
            q |= Q(**{f"{field}__icontains": query})

        issue_views = IssueView.objects.filter(
            q,
            project__project_projectmember__member=self.request.user,
            project__project_projectmember__is_active=True,
            project__archived_at__isnull=True,
            workspace__slug=slug,
        )

        if workspace_search == "false" and project_id:
            issue_views = issue_views.filter(project_id=project_id)

        return issue_views.distinct().values(
            "name",
            "id",
            "project_id",
            "project__identifier",
            "workspace__slug",
        )

    def get(self, request, slug):
        query = request.query_params.get("search", False)
        workspace_search = request.query_params.get(
            "workspace_search", "false"
        )
        project_id = request.query_params.get("project_id", False)

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
            results[model] = func(query, slug, project_id, workspace_search)
        return Response({"results": results}, status=status.HTTP_200_OK)
