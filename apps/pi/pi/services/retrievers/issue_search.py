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

import asyncio

from langchain_core.callbacks.manager import AsyncCallbackManagerForRetrieverRun
from langchain_core.callbacks.manager import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from pi import logger
from pi.config import settings
from pi.core.vectordb import VectorStore

vector_db = VectorStore()

log = logger.getChild(__name__)


class IssueRetriever(BaseRetriever):
    num_docs: int = 5
    chunk_similarity_threshold: float = settings.vector_db.ISSUE_VECTOR_SEARCH_CUTOFF

    def _get_relevant_documents(
        self,
        query: str,
        run_manager: CallbackManagerForRetrieverRun,
        workspace_id: str = "",
        project_id: str = "",
        user_id: str = "",
    ) -> list[Document]:
        """Retrieves relevant issue documents.

        When an ML model is configured, runs both semantic and text search and merges
        results (hybrid mode). When no ML model is available, falls back to text-only
        (BM25) search so Pi features remain functional without an embedding model.
        """
        from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured_sync

        text_response = vector_db.issue_search_text(
            query_title=query,
            query_description="",
            workspace_id=workspace_id,
            project_id=project_id,
            user_id=user_id,
            output_fields=["id", "name", "description"],
        )

        if check_ml_model_configured_sync():
            sem_response = vector_db.issue_search_semantic(
                query_title=query,
                query_description="",
                workspace_id=workspace_id,
                project_id=project_id,
                user_id=user_id,
                threshold=self.chunk_similarity_threshold,
                output_fields=["id", "name", "description"],
            )
            response = sem_response + text_response
        else:
            response = text_response

        # Remove duplicates based on issue id
        seen_ids: set = set()
        unique_response = []
        for hit in response:
            issue_id = hit.get("ID") or hit.get("id")
            if issue_id not in seen_ids:
                seen_ids.add(issue_id)
                unique_response.append(hit)

        return self._parse_response(unique_response)

    async def _aget_relevant_documents(
        self,
        query: str,
        run_manager: AsyncCallbackManagerForRetrieverRun,
        workspace_id: str = "",
        project_id: str = "",
        user_id: str = "",
    ) -> list[Document]:
        """Asynchronously retrieves relevant issue documents.

        When an ML model is configured, runs semantic search and text search concurrently
        and merges results (hybrid mode). When no ML model is available, falls back to
        text-only search so Pi features remain functional without an embedding model.
        """

        text_task = vector_db.async_issue_search_text(
            query_title=query,
            query_description="",
            workspace_id=workspace_id,
            project_id=project_id,
            user_id=user_id,
            output_fields=["id", "name", "description"],
        )

        from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured

        if await check_ml_model_configured():
            sem_task = vector_db.async_issue_search_semantic(
                query_title=query,
                query_description="",
                workspace_id=workspace_id,
                project_id=project_id,
                user_id=user_id,
                threshold=self.chunk_similarity_threshold,
                output_fields=["id", "name", "description"],
            )
            resp_sem, resp_text = await asyncio.gather(sem_task, text_task)
            response = resp_sem + resp_text
        else:
            response = await text_task

        # Remove duplicates based on issue_id
        seen_issue_ids = set()
        unique_response = []
        for hit in response:
            issue_id = hit["ID"]
            if issue_id not in seen_issue_ids:
                seen_issue_ids.add(issue_id)
                unique_response.append(hit)

        return self._parse_response(unique_response)

    def _parse_response(self, response) -> list[Document]:
        """Parses Open Search query response and returns relevant issue documents."""
        documents: list[Document] = []
        for hit in response[: self.num_docs]:
            title = hit.get("name") or "Untitled Issue"
            description = hit.get("description") or "No content available"
            issue_id = hit.get("id") or "Unknown ID"
            documents.append(
                Document(
                    page_content=description,
                    metadata={
                        # Provide both for compatibility with downstream formatters
                        "title": title,
                        "name": title,
                        "relevance": round(hit.get("Score", 0), 3),
                        "issue_id": issue_id,
                    },
                ),
            )

        return documents
