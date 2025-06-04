from elasticsearch_dsl import Q, MultiSearch, Search
from rest_framework import status
from rest_framework.response import Response

from plane.app.views.base import BaseAPIView
from plane.ee.documents import (
    IssueDocument,
    ProjectDocument,
    CycleDocument,
    TeamspaceDocument,
    ModuleDocument,
    IssueViewDocument,
    PageDocument,
)
from plane.payment.flags.flag import FeatureFlag
from plane.payment.flags.flag_decorator import check_feature_flag
from plane.ee.serializers.app.search_serializers import (
    IssueSearchSerializer,
    ProjectSearchSerializer,
    CycleSearchSerializer,
    ModuleSearchSerializer,
    PageSearchSerializer,
    IssueViewSearchSerializer,
    TeamspaceSearchSerializer,
)


# Build a boolean filter query
def build_filters(filters):
    filter_list = [Q("term", is_deleted=False)]  # Exclude deleted items
    for f in filters:
        filter_list.append(Q("term", **f))  # Add filters
    return Q("bool", must=filter_list)  # Return filter query


# Build a search query with query_string for wildcard support
def build_query(query, search_fields):
    wildcard_query = f"{query}*"
    return Q("query_string", query=wildcard_query, fields=search_fields)


def build_search(document, filters, query, search_fields, fields_to_retrieve):
    search = document.search()
    filter_query = build_filters(filters)
    search_query = build_query(query, search_fields)
    search = search.filter(filter_query).source(fields_to_retrieve)
    if search_query:
        search = search.query(search_query)
    search = search.extra(size=100)
    return search


# # Execute search and serialize results
# def execute_search(document, filters, query, search_fields, fields_to_retrieve):
#     search = document.search()  # Start search
#     filter_query = build_filters(filters)  # Build filters
#     search_query = build_query(query, search_fields)  # Build search query
#     search = search.filter(filter_query).source(fields_to_retrieve)  # Apply filters and specify fields to retrieve
#     if search_query:
#         search = search.query(search_query)  # Apply search query if present
#     results = search.extra(size=100).execute()  # Run query with hardcoded result size
#     return results  # Return raw search results


# def serialize_results(results, serializer_class):
#     # Serialize the results
#     serializer = serializer_class(results, many=True)
#     data = serializer.data  # Retrieve serialized data
#     return data  # Return serialized data


# def execute_combined_search(query, slug, user_id, index=None):
#     # Define filters and search fields for each document type
#     combined_filters = [
#         Q('term', workspace_slug=slug),
#         Q('term', active_project_member_user_ids=user_id) | Q('term', active_member_user_ids=user_id),
#         Q('term', project_is_archived=False) | Q('term', is_archived=False)
#     ]

#     combined_search_fields = [
#         "name", "description", "pretty_sequence", "project_indentifier",
#         "identifier"
#     ]

#     # Define the fields to retrieve
#     fields_to_retrieve = [
#         "name", "id", "sequence_id", "project_identifier", "project_id",
#         "workspace_slug", "type_id", "identifier", "logo_props",
#         "project_ids", "project_identifiers", "is_epic"
#     ]

#     # Create a MultiSearch object
#     ms = MultiSearch()

#     # Create individual search objects for each document type
#     for document in [IssueDocument, ProjectDocument, CycleDocument, ModuleDocument, PageDocument, IssueViewDocument, TeamspaceDocument]:
#         if index and document.Index.name != index:
#             continue  # Skip if a specific index is specified and doesn't match

#         search = Search(index=document.Index.name)
#         filter_query = Q("bool", must=combined_filters)
#         search_query = build_query(query, combined_search_fields)
#         search = search.filter(filter_query).source(fields_to_retrieve)
#         if search_query:
#             search = search.query(search_query)

#         ms = ms.add(search)

#     # Execute the MultiSearch
#     responses = ms.execute()

#     # Map index names to organized result keys and serializers
#     index_to_key_map = {
#         "issues": ("work_item", IssueSearchSerializer),
#         "projects": ("project", ProjectSearchSerializer),
#         "cycles": ("cycle", CycleSearchSerializer),
#         "modules": ("module", ModuleSearchSerializer),
#         "pages": ("page", PageSearchSerializer),
#         "issue_views": ("work_item_view", IssueViewSearchSerializer),
#         "teamspaces": ("teamspace", TeamspaceSearchSerializer)
#     }

#     # Organize and serialize results by document type
#     organized_results = {key: [] for key, _ in index_to_key_map.values()}
#     organized_results["epic"] = []  # Add a separate key for epics

#     for response in responses:
#         index_name = response.search.index
#         for hit in response:
#             if index_name == "issues" and getattr(hit, "is_epic", False):
#                 serializer = IssueSearchSerializer(hit, many=False)
#                 organized_results["epic"].append(serializer.data)
#             else:
#                 result_key, serializer_class = index_to_key_map.get(index_name, (None, None))
#                 if result_key:
#                     serializer = serializer_class(hit, many=False)
#                     organized_results[result_key].append(serializer.data)

#     return Response({"results": organized_results}, status=status.HTTP_200_OK)


class EnhancedGlobalSearchEndpoint(BaseAPIView):
    def filter_issues(self, query, slug, is_epic=False):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False),
            dict(is_epic=is_epic),
        ]
        search_fields = [
            "name",
            "description",
            "pretty_sequence",
            "project_indentifier",
        ]
        fields_to_retrieve = [
            "name",
            "id",
            "sequence_id",
            "project_identifier",
            "project_id",
            "workspace_slug",
            "type_id",
        ]
        search = build_search(
            IssueDocument, filters, query, search_fields, fields_to_retrieve
        )
        return search

    def filter_epics(self, query, slug):
        return self.filter_issues(query, slug, is_epic=True)

    def filter_projects(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}"),
            dict(is_archived=False),
        ]
        search_fields = ["name", "identifier"]
        fields_to_retrieve = [
            "name",
            "id",
            "identifier",
            "workspace_slug",
            "logo_props",
        ]
        search = build_search(
            ProjectDocument, filters, query, search_fields, fields_to_retrieve
        )
        return search

    def filter_cycles(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False),
        ]
        search_fields = ["name", "description"]
        fields_to_retrieve = [
            "name",
            "id",
            "project_id",
            "logo_props",
            "project_identifier",
            "workspace_slug",
        ]
        search = build_search(
            CycleDocument, filters, query, search_fields, fields_to_retrieve
        )
        return search

    def filter_modules(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False),
        ]
        search_fields = ["name", "description"]
        fields_to_retrieve = [
            "name",
            "id",
            "project_id",
            "logo_props",
            "project_identifier",
            "workspace_slug",
        ]
        search = build_search(
            ModuleDocument, filters, query, search_fields, fields_to_retrieve
        )
        return search

    def filter_pages(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}"),
        ]
        search_fields = ["name", "description"]
        fields_to_retrieve = [
            "name",
            "id",
            "project_ids",
            "logo_props",
            "project_identifiers",
            "workspace_slug",
        ]
        search = build_search(
            PageDocument, filters, query, search_fields, fields_to_retrieve
        )
        return search

    def filter_views(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False),
        ]
        search_fields = ["name", "description"]
        fields_to_retrieve = [
            "name",
            "id",
            "project_id",
            "logo_props",
            "project_identifier",
            "workspace_slug",
        ]
        search = build_search(
            IssueViewDocument, filters, query, search_fields, fields_to_retrieve
        )
        return search

    def filter_teamspaces(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}"),
        ]
        search_fields = ["name"]
        fields_to_retrieve = ["name", "id", "workspace_slug", "logo_props"]
        search = build_search(
            TeamspaceDocument, filters, query, search_fields, fields_to_retrieve
        )
        return search

    @check_feature_flag(FeatureFlag.ADVANCED_SEARCH)
    def get(self, request, slug):
        query = request.query_params.get("search", False)

        # Map index names to organized result keys and serializers
        index_to_key_map = {
            "issues": ("work_item", IssueSearchSerializer),
            "projects": ("project", ProjectSearchSerializer),
            "cycles": ("cycle", CycleSearchSerializer),
            "modules": ("module", ModuleSearchSerializer),
            "pages": ("page", PageSearchSerializer),
            "issue_views": ("work_item_view", IssueViewSearchSerializer),
            "teamspaces": ("teamspace", TeamspaceSearchSerializer),
        }

        # Initialize organized results dictionary
        organized_results = {
            "project": [],
            "work_item": [],
            "cycle": [],
            "module": [],
            "work_item_view": [],
            "page": [],
            "epic": [],
            "teamspace": [],
        }

        if not query:
            return Response(
                {"results": organized_results},
                status=status.HTTP_200_OK,
            )

        # Create a MultiSearch object
        ms = MultiSearch()

        # Add search objects from filter_ methods to MultiSearch
        ms = ms.add(self.filter_issues(query, slug))
        ms = ms.add(self.filter_epics(query, slug))
        ms = ms.add(self.filter_projects(query, slug))
        ms = ms.add(self.filter_cycles(query, slug))
        ms = ms.add(self.filter_modules(query, slug))
        ms = ms.add(self.filter_pages(query, slug))
        ms = ms.add(self.filter_views(query, slug))
        ms = ms.add(self.filter_teamspaces(query, slug))

        # Execute the MultiSearch
        responses = ms.execute()

        for response in responses:
            if not response:
                continue
            index_name = response[0].meta.index
            if index_name == "issues" and response[0].is_epic:
                organized_results["epic"].extend(
                    IssueSearchSerializer(response, many=True).data
                )
            else:
                result_key, serializer_class = index_to_key_map.get(
                    index_name, (None, None)
                )
                if result_key:
                    organized_results[result_key].extend(
                        serializer_class(response, many=True).data
                    )

        return Response({"results": organized_results}, status=status.HTTP_200_OK)
