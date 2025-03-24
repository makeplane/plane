from elasticsearch_dsl import Q, AttrList
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.ee.documents import (
    IssueDocument, ProjectDocument, CycleDocument,
    TeamspaceDocument, ModuleDocument, IssueViewDocument,
    PageDocument
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.serializers.app.search_serializers import (
    IssueSearchSerializer, ProjectSearchSerializer, CycleSearchSerializer,
    ModuleSearchSerializer, PageSearchSerializer, IssueViewSearchSerializer,
    TeamspaceSearchSerializer
)


# Build a boolean filter query
def build_filters(filters):
    filter_list = [Q('term', is_deleted=False)]  # Exclude deleted items
    for f in filters:
        filter_list.append(Q('term', **f))  # Add filters
    return Q("bool", must=filter_list)  # Return filter query


# Build a search query with query_string for wildcard support
def build_query(query, search_fields):
    wildcard_query = f"{query}*"
    return Q('query_string', query=wildcard_query, fields=search_fields)


# Execute search and serialize results
def execute_search(document, filters, query, search_fields, serializer_class):
    search = document.search()  # Start search
    filter_query = build_filters(filters)  # Build filters
    search_query = build_query(query, search_fields)  # Build search query
    search = search.filter(filter_query)  # Apply filters
    if search_query:
        search = search.query(search_query)  # Apply search query if present
    results = search.extra(size=100).execute()  # Run query with hardcoded result size

    # Serialize the results
    serializer = serializer_class(results, many=True)
    return serializer.data  # Return serialized data


class EnhancedGlobalSearchEndpoint(BaseAPIView):

    def filter_issues(self, query, slug, is_epic=False):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False),
            dict(is_epic=is_epic)
        ]
        search_fields = ["name", "description", "pretty_sequence", "project_indentifier"]
        return execute_search(
            IssueDocument, filters, query, search_fields, IssueSearchSerializer
        )

    def filter_epics(self, query, slug):
        return self.filter_issues(
            query, slug, is_epic=True
        )

    def filter_projects(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}"),
            dict(is_archived=False)
        ]
        search_fields = ["name", "identifier"]
        return execute_search(
            ProjectDocument, filters, query, search_fields, ProjectSearchSerializer
        )

    def filter_cycles(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False)
        ]
        search_fields = ["name", "description"]
        return execute_search(
            CycleDocument, filters, query, search_fields, CycleSearchSerializer
        )

    def filter_modules(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False)
        ]
        search_fields = ["name", "description"]
        return execute_search(
            ModuleDocument, filters, query, search_fields, ModuleSearchSerializer
        )

    def filter_pages(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}")
        ]
        search_fields = ["name", "description"]
        return execute_search(
            PageDocument, filters, query, search_fields, PageSearchSerializer
        )

    def filter_views(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False)
        ]
        search_fields = ["name", "description"]
        return execute_search(
            IssueViewDocument, filters, query, search_fields, IssueViewSearchSerializer
        )

    def filter_teamspaces(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}")
        ]
        search_fields = ["name"]
        return execute_search(
            TeamspaceDocument, filters, query, search_fields, TeamspaceSearchSerializer
        )

    @check_feature_flag(FeatureFlag.ADVANCED_SEARCH)
    def get(self, request, slug):
        query = request.query_params.get("search", False)

        if not query:
            return Response(
                {
                    "results": {
                        # "workspace": [],
                        "project": [],
                        "work_item": [],
                        "cycle": [],
                        "module": [],
                        "work_item_view": [],
                        "page": [],
                        "epic": [],
                        "teamspace": [],
                    }
                },
                status=status.HTTP_200_OK,
            )

        MODELS_MAPPER = {
            # "workspace": self.filter_workspaces,
            "project": self.filter_projects,
            "work_item": self.filter_issues,
            "cycle": self.filter_cycles,
            "module": self.filter_modules,
            "work_item_view": self.filter_views,
            "page": self.filter_pages,
            "epic": self.filter_epics,
            "teamspace": self.filter_teamspaces,
        }

        results = {}

        for model, func in MODELS_MAPPER.items():
            results[model] = func(query, slug)

        return Response({"results": results}, status=status.HTTP_200_OK)
