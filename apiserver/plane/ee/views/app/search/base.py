# Standard library imports

# Third-party imports
from django.conf import settings
from opensearchpy.exceptions import ConnectionError, NotFoundError, RequestError
from rest_framework import status
from rest_framework.response import Response

# Local application imports
from plane.app.views.base import BaseAPIView
from plane.ee.documents import (
    IssueDocument,
    ProjectDocument,
    CycleDocument,
    TeamspaceDocument,
    ModuleDocument,
    IssueViewDocument,
    PageDocument,
    IssueCommentDocument,
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
    IssueCommentSearchSerializer,
)
from plane.ee.utils.opensearch_helper import OpenSearchHelper
from plane.utils.exception_logger import log_exception


class EnhancedGlobalSearchEndpoint(BaseAPIView):
    def filter_issues(self, query, slug, is_epic=False):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_project_member_user_ids": self.request.user.id},
            {"project_is_archived": False},
            {"is_epic": is_epic},
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
        boosts = {
            "name": 1.25,
            "description": 1.0,
            "project_identifier": 1.5,
            "pretty_sequence": 1.5,
            "sequence_id": 1.5,
        }

        result_key = "epic" if is_epic else "work_item"

        helper = OpenSearchHelper(
            document_cls=IssueDocument,
            filters=filters,
            query=query,
            search_fields=[
                "name",
                "description",
                "project_identifier",
                "pretty_sequence",
                "sequence_id",
            ],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=boosts,
            operator="and",  # Use AND operator for stricter matching
            result_key=result_key,
            serializer_class=IssueSearchSerializer,
        )

        return helper

    def filter_epics(self, query, slug):
        return self.filter_issues(query, slug, is_epic=True)

    def filter_projects(self, query, slug):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_member_user_ids": self.request.user.id},
            {"is_archived": False},
        ]
        search_fields = ["name", "identifier"]
        fields_to_retrieve = [
            "name",
            "id",
            "identifier",
            "workspace_slug",
            "logo_props",
        ]
        boosts = {"name": 2.0, "identifier": 2.0}

        helper = OpenSearchHelper(
            document_cls=ProjectDocument,
            filters=filters,
            query=query,
            search_fields=["name", "identifier"],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=boosts,
            operator="and",  # Use AND operator for stricter matching
            result_key="project",
            serializer_class=ProjectSearchSerializer,
        )

        return helper

    def filter_cycles(self, query, slug):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_project_member_user_ids": self.request.user.id},
            {"project_is_archived": False},
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
        boosts = {"name": 2.0, "description": 1.0}

        helper = OpenSearchHelper(
            document_cls=CycleDocument,
            filters=filters,
            query=query,
            search_fields=["name", "description"],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=boosts,
            operator="and",  # Use AND operator for stricter matching
            result_key="cycle",
            serializer_class=CycleSearchSerializer,
        )

        return helper

    def filter_modules(self, query, slug):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_project_member_user_ids": self.request.user.id},
            {"project_is_archived": False},
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
        boosts = {"name": 2.0, "description": 1.0}

        helper = OpenSearchHelper(
            document_cls=ModuleDocument,
            filters=filters,
            query=query,
            search_fields=["name", "description"],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=boosts,
            operator="and",  # Use AND operator for stricter matching
            result_key="module",
            serializer_class=ModuleSearchSerializer,
        )

        return helper

    def filter_pages(self, query, slug):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_member_user_ids": self.request.user.id},
        ]
        # Ensure all fields required by PageSearchSerializer are included
        fields_to_retrieve = [
            "name",
            "id",
            "project_ids",
            "project_identifiers",
            "logo_props",
            "workspace_slug",
        ]
        boosts = {"name": 2.0, "description": 1.0}

        helper = OpenSearchHelper(
            document_cls=PageDocument,
            filters=filters,
            query=query,
            search_fields=["name", "description"],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=boosts,
            operator="and",  # Use AND operator for stricter matching
            result_key="page",
            serializer_class=PageSearchSerializer,
        )

        return helper

    def filter_views(self, query, slug):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_project_member_user_ids": self.request.user.id},
            {"project_is_archived": False},
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
        boosts = {"name": 2.0, "description": 1.0}

        helper = OpenSearchHelper(
            document_cls=IssueViewDocument,
            filters=filters,
            query=query,
            search_fields=["name", "description"],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=boosts,
            operator="and",  # Use AND operator for stricter matching
            result_key="work_item_view",
            serializer_class=IssueViewSearchSerializer,
        )

        return helper

    def filter_teamspaces(self, query, slug):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_member_user_ids": self.request.user.id},
        ]
        fields_to_retrieve = ["name", "id", "workspace_slug", "logo_props"]
        boosts = {"name": 2.0}

        helper = OpenSearchHelper(
            document_cls=TeamspaceDocument,
            filters=filters,
            query=query,
            search_fields=["name"],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=boosts,
            operator="and",  # Use AND operator for stricter matching
            result_key="teamspace",
            serializer_class=TeamspaceSearchSerializer,
        )

        return helper

    def filter_work_item_comments(self, query, slug):
        # permission filters
        filters = [
            {"workspace_slug": slug},
            {"active_project_member_user_ids": self.request.user.id},
            {"project_is_archived": False},
        ]

        fields_to_retrieve = [
            "id",
            "comment",
            "project_identifier",
            "project_id",
            "workspace_slug",
            "actor_id",
            "issue_id",
        ]

        result_key = "work_item_comment"

        helper = OpenSearchHelper(
            document_cls=IssueCommentDocument,
            filters=filters,
            query=query,
            search_fields=["comment"],
            source_fields=fields_to_retrieve,
            page=1,
            page_size=100,
            boosts=None,
            operator="and",
            result_key=result_key,
            serializer_class=IssueCommentSearchSerializer,
        )

        return helper

    @check_feature_flag(FeatureFlag.ADVANCED_SEARCH)
    def get(self, request, slug):
        query = request.query_params.get("search", False)

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
            "work_item_comment": [],
        }

        if not query:
            return Response(
                {"results": organized_results},
                status=status.HTTP_200_OK,
            )

        # Create helpers for each search type
        search_helpers = [
            self.filter_issues(query, slug, is_epic=False),
            self.filter_epics(query, slug),
            self.filter_projects(query, slug),
            self.filter_cycles(query, slug),
            self.filter_modules(query, slug),
            self.filter_pages(query, slug),
            self.filter_views(query, slug),
            self.filter_teamspaces(query, slug),
            self.filter_work_item_comments(query, slug),
        ]

        try:
            # Execute multi-search and get results organized by result_key
            results = OpenSearchHelper.execute_multi_search(search_helpers)

            # Merge results into organized_results
            for key, data in results.items():
                organized_results[key] = data

            return Response({"results": organized_results}, status=status.HTTP_200_OK)
        except (ConnectionError, NotFoundError) as e:
            log_exception(e)
            return Response(
                {"error": "Search service unavailable"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        except RequestError as e:
            log_exception(e)
            return Response(
                {"error": "Invalid search request", "detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception as e:
            log_exception(e)
            raise
