# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

from typing import Any
from typing import Dict
from typing import List

from pi import logger
from pi import settings

log = logger.getChild(__name__)
MAX_RETRIES = 10
KNN_TOP_K = settings.vector_db.KNN_TOP_K


def build_issue_semantic_query(
    query_title: str, query_description: str | None, workspace_id: str, issue_id: str | None, project_id: str | None, user_id: str | None
) -> Dict[str, Any]:
    """
    Build a semantic search query for issues using OpenSearch efficient k-NN filtering.
    """
    # Build workspace/project filter
    workspace_filter: Dict[str, Any] = {"term": {"project_id": project_id}} if project_id else {"term": {"workspace_id": workspace_id}}

    # Build additional filters
    filters: List[Dict[str, Any]] = [workspace_filter]
    if user_id:
        filters.append({"term": {"active_project_member_user_ids": user_id}})
    filters.append({"term": {"is_deleted": "false"}})

    # Combine filters
    combined_filter: Dict[str, Any] = {"bool": {"must": filters}}

    # Build neural search queries WITH efficient filtering
    should_queries: List[Dict[str, Any]] = []

    query_title_search = query_title
    query_description_search = query_description or None

    # Import here to avoid circular dependency
    from pi.services.retrievers.pg_store import get_ml_model_id_sync

    # Query against name_semantic field with filter
    ml_model_id = get_ml_model_id_sync()
    name_query: Dict[str, Any] = {
        "neural": {
            "name_semantic": {
                "query_text": query_title_search,
                "model_id": ml_model_id,
                "k": KNN_TOP_K,
                "filter": combined_filter,
            }
        }
    }
    should_queries.append(name_query)

    # Query against content_semantic field with filter
    content_query: Dict[str, Any] = {
        "neural": {"content_semantic": {"query_text": query_title_search, "model_id": ml_model_id, "k": KNN_TOP_K, "filter": combined_filter}}
    }
    should_queries.append(content_query)

    if query_description and query_description.strip():
        # Additional queries with description
        desc_query: Dict[str, Any] = {
            "neural": {
                "description_semantic": {
                    "query_text": query_description_search,
                    "model_id": ml_model_id,
                    "k": KNN_TOP_K,
                    "filter": combined_filter,
                }
            }
        }
        should_queries.append(desc_query)

        content_desc_query: Dict[str, Any] = {
            "neural": {"content_semantic": {"query_text": query_description, "model_id": ml_model_id, "k": KNN_TOP_K, "filter": combined_filter}}
        }
        should_queries.append(content_desc_query)

        # Combined query
        combined_query_text = f"{query_title} {query_description}"

        combined_name_query: Dict[str, Any] = {
            "neural": {"name_semantic": {"query_text": combined_query_text, "model_id": ml_model_id, "k": KNN_TOP_K, "filter": combined_filter}}
        }
        should_queries.append(combined_name_query)

        combined_desc_query: Dict[str, Any] = {
            "neural": {
                "description_semantic": {"query_text": combined_query_text, "model_id": ml_model_id, "k": KNN_TOP_K, "filter": combined_filter}
            }
        }
        should_queries.append(combined_desc_query)

        combined_content_query: Dict[str, Any] = {
            "neural": {"content_semantic": {"query_text": combined_query_text, "model_id": ml_model_id, "k": KNN_TOP_K, "filter": combined_filter}}
        }
        should_queries.append(combined_content_query)

    # Use dis_max to get the maximum score from neural queries
    query: Dict[str, Any] = {"dis_max": {"queries": should_queries}}

    if issue_id:
        query = {
            "bool": {
                "must": [query],
                "must_not": [
                    {"ids": {"values": [issue_id]}},  # exclude by _id defensively
                    {"term": {"id": issue_id}},  # exclude by explicit id field if present
                    {"term": {"duplicate_of": issue_id}},
                    {"term": {"not_duplicates_with": issue_id}},
                ],
            }
        }

    return {"query": query, "_source": {"excludes": ["name_semantic", "content_semantic", "description_semantic"]}}


def build_pages_semantic_query(query: str, workspace_id: str, user_id: str, project_id: str | None) -> Dict[str, Any]:
    """
    Build a semantic search query for pages using OpenSearch efficient k-NN filtering.
    """
    # Build scope filter
    scope_filter: Dict[str, Any] = {"term": {"project_ids": project_id}} if project_id else {"term": {"workspace_id": workspace_id}}

    # Access and ownership filter
    access_filter: Dict[str, Any] = {
        "bool": {
            "should": [
                {"term": {"access": "0"}},  # public doc
                {"bool": {"must": [{"term": {"access": "1"}}, {"term": {"owned_by_id": user_id}}]}},  # private + owned
            ],
            "minimum_should_match": 1,
        }
    }

    # Combine all filters
    combined_filter: Dict[str, Any] = {"bool": {"must": [scope_filter, access_filter, {"term": {"is_deleted": "false"}}]}}

    # Import here to avoid circular dependency
    from pi.services.retrievers.pg_store import get_ml_model_id_sync

    # Neural search queries with efficient filtering
    ml_model_id = get_ml_model_id_sync()
    name_query: Dict[str, Any] = {
        "neural": {"name_semantic": {"query_text": query, "model_id": ml_model_id, "k": KNN_TOP_K, "filter": combined_filter}}
    }

    desc_query: Dict[str, Any] = {
        "neural": {"description_semantic": {"query_text": query, "model_id": ml_model_id, "k": KNN_TOP_K, "filter": combined_filter}}
    }

    neural_queries: List[Dict[str, Any]] = [name_query, desc_query]

    # Use dis_max directly (no external Boolean wrapper needed)
    query_body: Dict[str, Any] = {"dis_max": {"queries": neural_queries}}

    return {"query": query_body, "_source": {"excludes": ["name_semantic", "description_semantic"]}}


def build_issue_text_search_query(
    query_title: str, query_description: str | None, workspace_id: str, issue_id: str | None, project_id: str | None, user_id: str | None
) -> Dict[str, Any]:
    """
    Build a text search query for issues using OpenSearch match queries.
    Note: Removed reranking functionality as requested.
    """
    if project_id:
        filter_query = {"term": {"project_id": project_id}}
    else:
        filter_query = {"term": {"workspace_id": workspace_id}}

    # Build should clauses dynamically
    should_clauses = [
        # query_title vs title matches
        {"match": {"name": {"query": query_title, "fuzziness": "AUTO", "prefix_length": 1, "minimum_should_match": "70%"}}},
        # query_title vs description matches
        {"match": {"description": {"query": query_title, "fuzziness": "AUTO", "prefix_length": 1, "minimum_should_match": "70%"}}},
    ]

    # Add query_description clauses only if it's not empty or None
    if query_description and query_description.strip():
        # query_description vs title matches
        should_clauses.extend([
            {"match": {"name": {"query": query_description, "fuzziness": "AUTO", "prefix_length": 1, "minimum_should_match": "70%"}}},
            # query_description vs description matches
            {"match": {"description": {"query": query_description, "fuzziness": "AUTO", "prefix_length": 1, "minimum_should_match": "70%"}}},
        ])

    # Add user_id filter if provided
    filters = [filter_query]
    if user_id:
        filters.append({"term": {"active_project_member_user_ids": user_id}})

    query = {"bool": {"should": should_clauses, "filter": filters, "minimum_should_match": 1}}

    if issue_id:
        query["bool"]["must_not"] = [{"term": {"duplicate_of": issue_id}}, {"term": {"not_duplicates_with": issue_id}}]

    # Return simple query body without reranking
    search_body = {"query": query}
    return search_body


def parse_semantic_search_response(response: Dict[str, Any], threshold: float = 0.77, *fields) -> List[Dict[str, Any]]:
    """
    Parse OpenSearch semantic search response.
    """
    results: List[Dict[str, Any]] = []

    if len(response["hits"]["hits"]) == 0:
        return results
    else:
        for hit in response["hits"]["hits"]:
            idx = hit["_id"]
            score = hit["_score"]
            if score < threshold:
                continue
            parsed_output = {"ID": idx, "Score": score}
            for field in fields:
                try:
                    value = hit["_source"].get(field, "")
                    parsed_output.update({field: value})
                except Exception as e:
                    log.error("Error retrieving field %s: %s", field, e)
            results.append(parsed_output)

    return results


def parse_text_search_response(response: Dict[str, Any], min_score_percent: int = 70, min_filter: float = 0.1, *fields) -> List[Dict[str, Any]]:
    """
    Parse OpenSearch text search response.
    """
    # Get max score for relative threshold
    if len(response["hits"]["hits"]) > 0:
        max_score = response["hits"]["max_score"]
        min_score = max_score * (min_score_percent / 100)
        # Filter results by relative score
        filtered_results = [hit for hit in response["hits"]["hits"] if (hit["_score"] >= min_score) and (hit["_score"] > min_filter)]
    else:
        filtered_results = []

    if len(filtered_results) == 0:
        return []
    else:
        results = []
        for hit in filtered_results:
            idx = hit["_id"]
            score = hit["_score"]
            parsed_output = {"ID": idx, "Score": score}
            for field in fields:
                value = hit["_source"].get(field, "")
                parsed_output.update({field: value})
            results.append(parsed_output)

        return results
