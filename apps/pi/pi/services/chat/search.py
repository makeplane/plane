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

import base64
import json
from typing import Any
from typing import Dict
from typing import List
from typing import Optional
from typing import Tuple
from uuid import UUID

from pydantic import UUID4

from pi import logger
from pi import settings
from pi.app.schemas.chat import ChatSearchPagination
from pi.app.schemas.chat import ChatSearchResult
from pi.core.vectordb.client import VectorStore

log = logger.getChild(__name__)

UNIFIED_CHAT_INDEX = settings.vector_db.CHAT_SEARCH_INDEX


class ChatSearchService:
    """Simplified service for searching chats, using OpenSearch's built-in highlighting."""

    def __init__(self):
        self.vector_store = VectorStore()

    async def search_chats(
        self,
        query: str,
        user_id: UUID4,
        workspace_id: UUID4,
        is_project_chat: Optional[bool] = False,
        cursor: Optional[str] = None,
        per_page: int = 30,
    ) -> Tuple[List[ChatSearchResult], ChatSearchPagination]:
        """
        Optimized search that leverages OpenSearch's native highlighting for speed.

        Args:
            query: Search text
            user_id: Filter by user
            workspace_id: Filter by workspace
            is_project_chat: Filter by project chat type
            cursor: Pagination cursor
            per_page: Results per page
        """
        try:
            offset = self._get_offset_from_cursor(cursor, per_page)

            cleaned_query = query.strip() if query else ""
            user_id_str = str(user_id)
            workspace_id_str = str(workspace_id)

            search_body = {
                "query": self._build_query(cleaned_query, user_id_str, workspace_id_str, is_project_chat),
                "size": per_page,
                "from": offset,
                "sort": [{"updated_at": {"order": "desc"}}],
                "collapse": {
                    "field": "chat_id",
                    # We only need the message_id from the best matching message now.
                    "inner_hits": {"name": "best_match_message", "size": 1, "_source": ["message_id"]},
                },
                "_source": ["chat_id", "title", "created_at", "updated_at", "workspace_id"],
                "track_total_hits": False,
                # THIS BLOCK ASKS OPENSEARCH TO DO THE HIGHLIGHTING FOR US
                "highlight": {
                    "pre_tags": ["<b>"],
                    "post_tags": ["</b>"],
                    "fields": {
                        "title": {
                            "number_of_fragments": 1,
                            "fragment_size": 150,
                            "no_match_size": 150,  # Return field even if no match
                        },
                        "content": {
                            "number_of_fragments": 1,
                            "fragment_size": 180,
                            "no_match_size": 0,  # Don't return content if no match
                        },
                    },
                },
            }

            response = await self.vector_store.async_search(index=UNIFIED_CHAT_INDEX, body=search_body)

            hits = response.get("hits", {}).get("hits", [])

            results = []
            for hit in hits:
                try:
                    # The formatting function no longer needs the query, as OpenSearch handled it.
                    result = self._format_hit_from_opensearch(hit)
                    if result:
                        results.append(result)
                except Exception as e:
                    log.warning(f"Error formatting hit: {e}", exc_info=True)
                    continue

            has_more = len(results) == per_page
            pagination = self._build_pagination(cursor, per_page, has_more, len(results))

            return results, pagination

        except Exception as e:
            log.error(f"Error searching chats: {e}", exc_info=True)
            return [], self._empty_pagination()

    def _build_query(self, query: str, user_id: str, workspace_id: str, is_project_chat: Optional[bool]) -> Dict[str, Any]:
        """Builds the search query. This remains unchanged."""
        filters = [{"term": {"user_id": user_id}}, {"term": {"workspace_id": workspace_id}}, {"term": {"is_deleted": False}}]

        if is_project_chat is not None:
            filters.append({"term": {"is_project_chat": is_project_chat}})

        if query:
            return {
                "bool": {
                    "should": [
                        {"multi_match": {"query": query, "fields": ["title^3", "content^1.5"], "type": "phrase", "boost": 2.0}},
                        {"multi_match": {"query": query, "fields": ["title^2", "content"], "type": "best_fields", "operator": "and"}},
                    ],
                    "filter": filters,
                    "minimum_should_match": 1,
                }
            }
        else:
            return {"bool": {"must": [{"match_all": {}}], "filter": filters}}

    def _format_hit_from_opensearch(self, hit: Dict[str, Any]) -> Optional[ChatSearchResult]:
        """
        Formats a search hit using the 'highlight' field provided by OpenSearch.
        This completely replaces the manual Python-based highlighting and snippet generation.
        """
        source = hit["_source"]
        highlight = hit.get("highlight", {})

        # OpenSearch returns a list of highlighted fragments. We just need the first one.
        highlighted_content = highlight.get("content", [None])[0]
        highlighted_title = highlight.get("title", [source.get("title", "")])[0]

        # Determine the snippet and match type based on what OpenSearch highlighted
        if highlighted_content:
            snippet = highlighted_content
            match_type = "message"
        else:
            snippet = highlighted_title
            match_type = "title"

        # Get the specific message_id from the inner_hits
        message_id = None
        inner_hits = hit.get("inner_hits", {}).get("best_match_message", {}).get("hits", {}).get("hits", [])
        if inner_hits:
            best_hit = inner_hits[0]["_source"]
            message_id = best_hit.get("message_id")

        try:
            return ChatSearchResult(
                id=UUID(source["chat_id"]),
                title=highlighted_title,
                snippet=snippet,
                match_type=match_type,
                message_id=UUID(message_id) if message_id else None,
                created_at=source.get("created_at"),
                updated_at=source.get("updated_at"),
                workspace_id=UUID(source["workspace_id"]) if source.get("workspace_id") else None,
            )
        except (ValueError, TypeError) as e:
            log.warning(f"Error creating ChatSearchResult from hit {source.get('chat_id')}: {e}")
            return None

    def _get_offset_from_cursor(self, cursor: Optional[str], per_page: int) -> int:
        """Get pagination offset from cursor."""
        if not cursor:
            return 0
        try:
            cursor_data = json.loads(base64.b64decode(cursor).decode())
            page = cursor_data.get("page", 0)
            return page * per_page
        except Exception:
            return 0

    def _build_pagination(self, cursor: Optional[str], per_page: int, has_more: bool, result_count: int) -> ChatSearchPagination:
        """Build clean pagination response for search."""
        current_page = 0
        if cursor:
            try:
                cursor_data = json.loads(base64.b64decode(cursor).decode())
                current_page = cursor_data.get("page", 0)
            except Exception:
                pass

        next_cursor = None
        if has_more:
            next_page_data = {"page": current_page + 1}
            next_cursor = base64.b64encode(json.dumps(next_page_data).encode()).decode()

        return ChatSearchPagination(next_cursor=next_cursor, count=result_count)

    def _empty_pagination(self) -> ChatSearchPagination:
        """Return empty pagination for errors."""
        return ChatSearchPagination(next_cursor=None, count=0)

    async def close(self):
        """Close vector store connection."""
        await self.vector_store.close()
