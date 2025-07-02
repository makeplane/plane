# Standard library imports
import logging
from typing import Any, Dict, List, Optional, Sequence, Type

# Third-party imports
from django.conf import settings
from django_opensearch_dsl import Document
from opensearchpy import MultiSearch, Search
from opensearchpy.exceptions import (
    ConnectionError,
    NotFoundError,
    RequestError,
    TransportError,
)
from opensearchpy.helpers.query import Q
from rest_framework.serializers import Serializer

# Local imports
from plane.utils.exception_logger import log_exception


logger = logging.getLogger("plane.api")


class OpenSearchHelper:
    """
    Helper class to streamline building and executing OpenSearch queries.

    Features:
    - Standardized filter application
    - Efficient query DSL leveraging custom analyzers (match over wildcards)
    - Support for standalone searches and MultiSearch aggregations
    - Field-specific boosts
    - Automatic pagination
    - Source field filtering
    """

    _FIELD_CACHE: dict[Type[Document], dict[str, dict]] = {}
    MAX_PAGE_SIZE = 100

    @classmethod
    def _field_meta(cls, document_cls: Type[Document], field_name: str) -> dict:
        """Get field metadata from cache or populate cache if needed."""
        if document_cls not in cls._FIELD_CACHE:
            # Properties is an AttrDict that doesn't support items(),
            # we need to iterate over its attributes differently
            properties_dict = {}
            for f in document_cls._doc_type.mapping.properties.properties:
                obj = document_cls._doc_type.mapping.properties.properties[f]
                properties_dict[f] = obj.to_dict()

            cls._FIELD_CACHE[document_cls] = properties_dict

        return cls._FIELD_CACHE.get(document_cls, {}).get(field_name, {})

    def __init__(
        self,
        document_cls: Type[Document],
        filters: Optional[List[Dict[str, Any]]] = None,
        query: Optional[str] = None,
        search_fields: Optional[List[str]] = None,
        source_fields: Optional[List[str]] = None,
        page: int = 1,
        page_size: int = 25,
        boosts: Optional[Dict[str, float]] = None,
        sort: Optional[List[str]] = None,
        operator: str = "or",
        result_key: Optional[str] = None,
        serializer_class: Optional[Type[Serializer]] = None,
    ):
        """
        Initialize the OpenSearch helper.

        Args:
            document_cls: Document class to search
            filters: List of filter dictionaries to apply
            query: The search query string
            search_fields: Fields to search within
            source_fields: Fields to return in the result
            page: Page number (1-indexed)
            page_size: Number of results per page
            boosts: Dictionary mapping field names to boost values
            sort: List of fields to sort by, with optional direction (e.g. ["name", "-created_at"])
            operator: Match query operator, either "and" or "or" (default: "or")
            result_key: Key to use when mapping this helper's results in a MultiSearch response
            serializer_class: DRF Serializer class to serialize hits
        """
        self.document_cls = document_cls
        self.filters = filters or []
        self.query = query
        self.search_fields = search_fields or self._get_default_search_fields()
        self.source_fields = source_fields
        self.page = max(1, page)  # Ensure page is at least 1
        self.page_size = min(
            page_size, getattr(settings, "OPENSEARCH_MAX_PAGE_SIZE", 100)
        )
        self.boosts = boosts or {}
        self.sort = sort
        self.operator = operator.lower() if operator else "or"
        self.result_key = result_key
        self.serializer_class = serializer_class

        # Create a base search object
        self.search = self.document_cls.search()

    def _get_default_search_fields(self) -> List[str]:
        """Get default search fields based on the document class."""
        # Prefer text fields with analyzers, especially edge_ngram_analyzer
        fields = []
        for (
            field_name,
            field,
        ) in (
            self.document_cls._doc_type.mapping.properties.properties.to_dict().items()
        ):
            if field.get("type") == "text":
                fields.append(field_name)
        return fields

    def build_filters(self) -> Q:
        """
        Combine default and provided filters into a bool filter.

        Returns:
            Q object with combined filters
        """
        # Always filter out deleted items unless explicitly requested otherwise
        has_deleted_filter = any("is_deleted" in f for f in self.filters)

        filter_q = Q("bool", must=[Q("term", **f) for f in self.filters])

        # Add default filters
        if not has_deleted_filter:
            filter_q = filter_q & Q("term", is_deleted=False)

        return filter_q

    def build_query(self) -> Optional[Q]:
        """
        Construct combined match/multi-match query leveraging field analyzers.

        Returns:
            Q object with the query or None if no query was provided
        """
        if not self.query or not self.search_fields:
            return None

        # Categorize fields by their types for appropriate query construction
        edge_ngram_fields = []  # Text fields with edge_ngram analyzer
        standard_fields = []  # Regular text fields
        keyword_fields = []  # Keyword fields
        numeric_fields = []  # Integer, long, float, etc.

        for field_name in self.search_fields:
            field_info = self._field_meta(self.document_cls, field_name)
            if not field_info:
                continue

            field_type = field_info.get("type", "")

            # Handle text fields
            if field_type == "text":
                analyzer = field_info.get("analyzer", "")
                if "edge_ngram" in analyzer:
                    edge_ngram_fields.append(field_name)
                else:
                    standard_fields.append(field_name)
            # Handle keyword fields
            elif field_type == "keyword":
                keyword_fields.append(field_name)
            # Handle numeric fields (integer, long, double, etc.)
            elif field_type in ("integer", "long", "double", "float"):
                numeric_fields.append(field_name)

        # Apply boosts to all text fields (edge_ngram + standard)
        all_text_fields = edge_ngram_fields + standard_fields
        boosted_text_fields = [
            f"{f}^{self.boosts.get(f, 1.0)}" for f in all_text_fields
        ]

        # Build query components
        query_parts = []

        # Combined text fields (edge_ngram + standard) for comprehensive matching
        if boosted_text_fields:
            query_parts.append(
                Q(
                    "multi_match",
                    query=self.query,
                    fields=boosted_text_fields,
                    type="best_fields",
                    operator=self.operator,
                )
            )

        # Keyword fields
        for field in keyword_fields:
            boost = self.boosts.get(field, 1.0)
            query_parts.append(
                Q("term", **{field: {"value": self.query, "boost": boost}})
            )

        # Numeric fields - try to convert query to number if possible
        try:
            numeric_value = float(self.query)
            for field in numeric_fields:
                boost = self.boosts.get(field, 1.0)
                # For numeric fields, use a term query with the converted value
                query_parts.append(
                    Q("term", **{field: {"value": numeric_value, "boost": boost}})
                )
        except (ValueError, TypeError):
            # If query can't be converted to number, skip numeric fields
            pass

        # Combine queries with should (OR) relation if we have multiple parts
        if not query_parts:
            return None
        elif len(query_parts) == 1:
            return query_parts[0]
        else:
            # Use dis_max for better performance than bool should
            return Q("dis_max", queries=query_parts, tie_breaker=0.3)

    def to_search(self) -> Search:
        """
        Assemble Search with filters, query, pagination, source fields, and boosts.

        Returns:
            Search object ready for execution
        """
        search = self.search

        # Apply filters
        filter_q = self.build_filters()
        search = search.filter(filter_q)

        # Apply query if provided
        query_q = self.build_query()
        if query_q:
            search = search.query(query_q)

        # Apply pagination - use regular from/size approach for simplicity
        from_idx = (self.page - 1) * self.page_size
        search = search.extra(from_=from_idx, size=self.page_size)

        # Apply source fields if provided (reduces data transfer)
        if self.source_fields:
            search = search.source(includes=self.source_fields)
        else:
            # For performance, exclude heavy fields by default
            search = search.source(excludes=["description", "description_stripped"])

        # Apply sorting if provided
        if self.sort:
            search = search.sort(*self.sort)

        return search

    def execute(self) -> Sequence:
        """
        Run the search and return hits.

        Returns:
            Sequence of search hits
        """
        try:
            search = self.to_search()
            logger.debug(f"Executing search: {search.to_dict()}")
            response = search.execute()
            logger.debug(f"Search returned {len(response.hits)} results")
            return response.hits
        except (ConnectionError, RequestError, NotFoundError, TransportError) as e:
            log_exception(f"OpenSearch error: {str(e)}")
            raise

    def execute_and_serialize(self) -> List[Dict[str, Any]]:
        """
        Run the search and serialize the hits using the configured serializer_class.

        Returns:
            List of serialized data dictionaries
        """
        if not self.serializer_class:
            logger.warning("Cannot serialize results: no serializer_class configured")
            raise ValueError("Cannot serialize results: no serializer_class configured")

        try:
            hits = self.execute()
            serialized_data = self.serialize_hits(hits, self.serializer_class)
            logger.debug(f"Serialized {len(serialized_data)} results")
            return serialized_data
        except (ConnectionError, RequestError, NotFoundError, TransportError):
            # These exceptions are already handled and logged in execute()
            raise
        except Exception as e:
            log_exception(f"Error serializing search results: {str(e)}")
            raise

    @classmethod
    def multi_search(cls, helpers: List["OpenSearchHelper"]) -> MultiSearch:
        """
        Combine multiple helpers into a MultiSearch instance.

        Args:
            helpers: List of OpenSearchHelper instances

        Returns:
            MultiSearch object ready for execution
        """
        ms = MultiSearch()

        for helper in helpers:
            ms = ms.add(helper.to_search())

        return ms

    @classmethod
    def execute_multi_search(
        cls, helpers: List["OpenSearchHelper"]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Execute a multi-search query and organize results by each helper's result_key.

        Args:
            helpers: List of OpenSearchHelper instances with result_key and serializer_class set

        Returns:
            Dictionary mapping result_keys to lists of serialized results
        """
        # Validate helpers
        for i, helper in enumerate(helpers):
            if not helper.result_key:
                logger.warning(f"Helper at index {i} is missing result_key")
                raise ValueError(f"Helper at index {i} is missing result_key")
            if not helper.serializer_class:
                logger.warning(f"Helper at index {i} is missing serializer_class")
                raise ValueError(f"Helper at index {i} is missing serializer_class")

        try:
            # Create and execute multi-search
            ms = cls.multi_search(helpers)
            logger.debug(f"Executing multi-search with {len(helpers)} queries")
            responses = ms.execute()

            # Map results by result_key
            results = {}
            for helper, response in zip(helpers, responses):
                key = helper.result_key
                if key not in results:
                    results[key] = []

                # Only add results if there are any
                if response:
                    serialized = cls.serialize_hits(response, helper.serializer_class)
                    results[key].extend(serialized)
                    logger.debug(f"Added {len(serialized)} results to '{key}'")

            return results
        except (ConnectionError, RequestError, NotFoundError, TransportError) as e:
            log_exception(f"OpenSearch error during multi-search: {str(e)}")
            raise
        except Exception as e:
            log_exception(f"Error during multi-search execution: {str(e)}")
            raise

    @staticmethod
    def serialize_hits(
        hits: Sequence, serializer_class: Type[Serializer]
    ) -> List[Dict[str, Any]]:
        """
        Serialize raw hits with DRF serializers.

        Args:
            hits: Search hits to serialize
            serializer_class: DRF serializer class to use

        Returns:
            List of serialized data dictionaries
        """
        try:
            # If there are no hits, return an empty list
            if not hits:
                return []

            serializer = serializer_class(hits, many=True)
            return serializer.data
        except Exception as e:
            log_exception(f"Error serializing hits: {str(e)}")
            raise
