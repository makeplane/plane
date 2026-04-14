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

from typing import List

from langchain_core.callbacks.manager import AsyncCallbackManagerForRetrieverRun
from langchain_core.callbacks.manager import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from pi import logger
from pi.core.vectordb import VectorStore

log = logger.getChild(__name__)

vector_db = VectorStore()


class PageChunkRetriever(BaseRetriever):
    num_docs: int = 5
    chunk_similarity_threshold: float = 0.8

    def _get_relevant_documents(
        self,
        query: str,
        run_manager: CallbackManagerForRetrieverRun,
        workspace_id: str = "",
        project_id: str = "",
        user_id: str = "",
    ) -> List[Document]:
        if not workspace_id and not project_id:
            log.error("Neither project id nor workspace id provided")
            return []

        from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured_sync

        if check_ml_model_configured_sync():
            response = vector_db.pages_search_semantic(
                query=query,
                workspace_id=workspace_id,
                project_id=project_id,
                user_id=user_id,
                threshold=self.chunk_similarity_threshold,
                output_fields=["id", "name", "description"],
            )
        else:
            response = vector_db.pages_search_text(
                query=query,
                workspace_id=workspace_id,
                user_id=user_id,
                project_id=project_id,
                output_fields=["id", "name", "description"],
            )

        return self._parse_response(response)

    async def _aget_relevant_documents(
        self,
        query: str,
        run_manager: AsyncCallbackManagerForRetrieverRun,
        workspace_id: str = "",
        project_id: str = "",
        user_id: str = "",
    ) -> List[Document]:
        if not workspace_id and not project_id:
            log.error("Neither project id nor workspace id provided")
            return []

        from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured

        if await check_ml_model_configured():
            response = await vector_db.async_pages_search_semantic(
                query=query,
                workspace_id=workspace_id,
                project_id=project_id,
                user_id=user_id,
                threshold=self.chunk_similarity_threshold,
                output_fields=["id", "name", "description"],
            )
        else:
            response = await vector_db.async_pages_search_text(
                query=query,
                workspace_id=workspace_id,
                user_id=user_id,
                project_id=project_id,
                output_fields=["id", "name", "description"],
            )

        return self._parse_response(response)

    def _parse_response(self, response) -> list[Document]:
        documents: list[Document] = []

        for hit in response[: self.num_docs]:
            title = hit.get("name") or "Untitled Page"
            description = hit.get("description") or "No content available"
            issue_id = hit.get("id") or "Unknown ID"

            documents.append(
                Document(
                    page_content=description,
                    metadata={
                        # Use 'name' to match downstream formatter
                        "name": title,
                        "relevance": round(hit.get("Score", 0), 3),
                        "page_id": issue_id,
                    },
                )
            )

        return documents
