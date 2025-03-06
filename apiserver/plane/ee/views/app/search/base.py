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


def serialize_data(data):
    # Add any data transformations here for unserializable data.
    if isinstance(data, AttrList):
        return list(data)
    return data


def search_document(
        document, filters, query, search_fields, result_fields, result_size=100
    ):
    search = document.search()

    query_list = []
    # Generate permission filters
    for f in filters:
        query_list.append(Q('term', **f))

    # Generate search filters
    search_filter = Q('query_string', query=f"*{query}*", fields=search_fields)

    query_list.append(search_filter)

    final_search_query = Q("bool", must=query_list)

    results = search.query(final_search_query).extra(size=result_size).execute()

    # NOTE: This is a quick implementation to return the search data
    # TODO: We should explore using serializers
    return [
        {
            field: serialize_data(getattr(r, field)) for field in result_fields
        } for r in results
    ]


class EnchancedGlobalSearchEndpoint(BaseAPIView):

    def filter_issues(self, query, slug, is_epic=False):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False),
            dict(is_epic=is_epic)
        ]

        search_fields = ["name", "description", "pretty_sequence", "project_indentifier"]
        result_fields = [
            "name", "id", "sequence_id", "project_identifier",
            "project_id", "workspace_slug", "type_id"
        ]

        return search_document(
            IssueDocument, filters, query, search_fields, result_fields
        )

    def filter_epics(self, query, slug):
        return self.filter_issues(
            query, slug, is_epic=True
        )

    # def filter_workspaces(self, query, slug, project_id, workspace_search):
    #     # permission filters
    #     filters = [dict(active_member_user_ids=f"{self.request.user.id}")]
    #     search_fields = ["name"]
    #     result_fields = ["name", "id", "slug"]

    #     return search_document(
    #         WorkspaceDocument, filters, query, search_fields, result_fields
    #     )

    def filter_projects(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}"),
            dict(is_archived=False)
        ]
        search_fields = ["name", "identifier"]
        result_fields = ["name", "id", "identifier", "workspace_slug", "logo_props"]

        results = search_document(
            ProjectDocument, filters, query, search_fields, result_fields
        )
        return results

    def filter_cycles(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False)
        ]
        search_fields = ["name", "description"]
        result_fields = [
            "name", "id", "project_id", "logo_props",
            "project_identifier", "workspace_slug"
        ]

        results = search_document(
            CycleDocument, filters, query, search_fields, result_fields
        )
        return results

    def filter_modules(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False)
        ]
        search_fields = ["name", "description"]
        result_fields = [
            "name", "id", "project_id", "logo_props",
            "project_identifier", "workspace_slug"
        ]

        results = search_document(
            ModuleDocument, filters, query, search_fields, result_fields
        )
        return results

    def filter_pages(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}")
        ]
        search_fields = ["name", "description"]
        result_fields = [
            "name", "id", "project_ids", "logo_props",
            "project_identifiers", "workspace_slug"
        ]

        results = search_document(
            PageDocument, filters, query, search_fields, result_fields
        )
        return results

    def filter_views(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_project_member_user_ids=f"{self.request.user.id}"),
            dict(project_is_archived=False)
        ]
        search_fields = ["name", "description"]
        result_fields = [
            "name", "id", "project_id", "logo_props",
            "project_identifier", "workspace_slug"
        ]

        results = search_document(
            IssueViewDocument, filters, query, search_fields, result_fields
        )
        return results

    def filter_teamspaces(self, query, slug):
        # permission filters
        filters = [
            dict(workspace_slug=f"{slug}"),
            dict(active_member_user_ids=f"{self.request.user.id}")
        ]
        search_fields = ["name"]
        result_fields = ["name", "id", "workspace_slug", "logo_props"]

        results = search_document(
            TeamspaceDocument, filters, query, search_fields, result_fields
        )
        return results

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

        for model in MODELS_MAPPER.keys():
            func = MODELS_MAPPER.get(model, None)
            results[model] = func(query, slug)
        return Response({"results": results}, status=status.HTTP_200_OK)
