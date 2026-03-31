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

"""
docs_semantic index definition (PI-managed data, API-managed schema).

Not registered with django-opensearch-dsl because there is no Django model.
Used by manage_search_index for index create/rebuild/delete operations.
"""

from django.conf import settings as django_settings

PLANE_DOCS_INDEX_NAME = (
    f"{django_settings.OPENSEARCH_INDEX_PREFIX}_docs_semantic"
    if django_settings.OPENSEARCH_INDEX_PREFIX
    else "docs_semantic"
)

PLANE_DOCS_INDEX_BODY = {
    "settings": {"index": {"knn": True, "default_pipeline": "docs-embedding-pipeline"}},
    "mappings": {
        "properties": {
            "id": {"type": "keyword"},
            "section": {"type": "keyword"},
            "subsection": {"type": "keyword"},
            "content": {"type": "text"},
            "content_semantic": {
                "type": "knn_vector",
                "dimension": django_settings.OPENSEARCH_EMBEDDING_DIMENSION,
                "method": {
                    "name": "hnsw",
                    "engine": "lucene",
                    "space_type": "cosinesimil",
                    "parameters": {"m": 16, "ef_construction": 512},
                },
            },
        }
    },
}


def sync_index(action):
    """Create, delete, update, or rebuild the docs_semantic index.

    Args:
        action: One of 'create', 'delete', 'rebuild', or 'update'.
    """
    from opensearchpy import connections

    client = connections.get_connection("default")
    exists = client.indices.exists(index=PLANE_DOCS_INDEX_NAME)

    if action in ("delete", "rebuild") and exists:
        client.indices.delete(index=PLANE_DOCS_INDEX_NAME)
        print(f"  Deleted docs_semantic index: {PLANE_DOCS_INDEX_NAME}")

    if action in ("create", "rebuild"):
        if not exists or action == "rebuild":
            client.indices.create(index=PLANE_DOCS_INDEX_NAME, body=PLANE_DOCS_INDEX_BODY)
            print(f"  Created docs_semantic index: {PLANE_DOCS_INDEX_NAME}")
        elif action == "create":
            print(f"  docs_semantic index already exists: {PLANE_DOCS_INDEX_NAME} (skipping)")

    if action == "update":
        if exists:
            client.indices.put_mapping(index=PLANE_DOCS_INDEX_NAME, body=PLANE_DOCS_INDEX_BODY["mappings"])
            print(f"  Updated docs_semantic index mappings: {PLANE_DOCS_INDEX_NAME}")
        else:
            print(f"  docs_semantic index does not exist: {PLANE_DOCS_INDEX_NAME} (skipping update)")
