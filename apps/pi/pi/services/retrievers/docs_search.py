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

from langchain_core.callbacks.manager import AsyncCallbackManagerForRetrieverRun
from langchain_core.callbacks.manager import CallbackManagerForRetrieverRun
from langchain_core.documents import Document
from langchain_core.retrievers import BaseRetriever

from pi import logger
from pi import settings
from pi.core.vectordb import VectorStore

vector_db = VectorStore()

log = logger.getChild(__name__)


class DocsRetriever(BaseRetriever):
    num_docs: int = 5
    chunk_similarity_threshold: float = settings.vector_db.DOC_VECTOR_SEARCH_CUTOFF

    def _get_relevant_documents(
        self,
        query: str,
        run_manager: CallbackManagerForRetrieverRun,
    ) -> list[Document]:
        """Retrieves relevant documentation.

        Uses semantic search when an ML model is configured, otherwise falls back to
        text-only (BM25) search so Pi features remain functional without an embedding model.
        """
        from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured_sync

        if check_ml_model_configured_sync():
            response = vector_db.docs_search_semantic(
                query=query,
                threshold=self.chunk_similarity_threshold,
                output_fields=["id", "section", "subsection", "content"],
            )
        else:
            response = vector_db.docs_search_text(
                query=query,
                output_fields=["id", "section", "subsection", "content"],
            )

        return self._parse_response(response)

    async def _aget_relevant_documents(
        self,
        query: str,
        run_manager: AsyncCallbackManagerForRetrieverRun,
    ) -> list[Document]:
        """Asynchronously retrieves relevant documentation based on semantic or text search.

        Falls back to BM25 text search when no ML model is configured.
        """
        from pi.services.retrievers.pg_store.embedding_model import check_ml_model_configured

        if await check_ml_model_configured():
            response = await vector_db.async_docs_search_semantic(
                query=query,
                threshold=self.chunk_similarity_threshold,
                output_fields=["id", "section", "subsection", "content"],
            )
        else:
            response = await vector_db.async_docs_search_text(
                query=query,
                output_fields=["id", "section", "subsection", "content"],
            )

        return self._parse_response(response)

    def _parse_response(self, response) -> list[Document]:
        """Parses Open Search query response and returns relevant issue documents."""
        documents: list[Document] = []
        for hit in response[: self.num_docs]:
            section = hit.get("section") or "Untitled Section"
            subsection = hit.get("subsection") or "Untitled Subsection"
            content = hit.get("content") or "No content available"
            doc_id = hit.get("id") or "Unknown ID"
            documents.append(
                Document(
                    page_content=content,
                    metadata={
                        "section": section,
                        "subsection": subsection,
                        "relevance": round(hit.get("Score", 0), 3),
                        "id": doc_id,
                    },
                ),
            )

        return documents
