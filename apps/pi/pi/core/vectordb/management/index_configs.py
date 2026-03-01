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

from pi import settings
from pi.core.embedding_config import get_embedding_param_from_active_model

# Index configurations
# Each key is the index name, value is a dict with:
# - name: actual index name from config
# - body: index body (settings + mappings)
# - requires_pipeline: whether this index needs a pipeline

INDEX_CONFIGS = {
    settings.vector_db.DOCS_INDEX: {
        "name": settings.vector_db.DOCS_INDEX,
        "requires_pipeline": True,
        "pipeline_name": settings.vector_db.DOCS_PIPELINE_NAME,
        "body": {
            "settings": {
                "index": {
                    "default_pipeline": settings.vector_db.DOCS_PIPELINE_NAME,
                    "knn": True,
                }
            },
            "mappings": {
                "properties": {
                    "id": {"type": "keyword"},
                    "section": {"type": "keyword"},
                    "subsection": {"type": "keyword"},
                    "content": {"type": "text"},
                    "content_semantic": {
                        "type": "knn_vector",
                        "dimension": settings.vector_db.EMBEDDING_DIMENSION,
                        "method": {
                            "name": "hnsw",
                            "engine": "lucene",
                            "space_type": "cosinesimil",
                            "parameters": {"m": 16, "ef_construction": 512},
                        },
                    },
                }
            },
        },
    },
    settings.vector_db.CHAT_SEARCH_INDEX: {
        "name": settings.vector_db.CHAT_SEARCH_INDEX,
        "requires_pipeline": False,
        "body": {
            "settings": {"index": {"number_of_shards": 1, "number_of_replicas": 1}},
            "mappings": {
                "properties": {
                    "message_id": {"type": "keyword"},
                    "chat_id": {"type": "keyword"},
                    "user_id": {"type": "keyword"},
                    "workspace_id": {"type": "keyword"},
                    "is_project_chat": {"type": "boolean"},
                    "is_deleted": {"type": "boolean"},
                    "title": {
                        "type": "text",
                        "analyzer": "standard",
                        "fields": {"raw": {"type": "keyword"}},
                    },
                    "content": {
                        "type": "text",
                        "analyzer": "standard",
                        "fields": {"raw": {"type": "keyword"}},
                    },
                    "sequence": {"type": "integer"},
                    "created_at": {
                        "type": "date",
                        "format": "strict_date_optional_time||epoch_millis",
                    },
                    "updated_at": {
                        "type": "date",
                        "format": "strict_date_optional_time||epoch_millis",
                    },
                    "user_type": {"type": "keyword"},
                }
            },
        },
    },
}


def get_pipeline_body(ml_model_id: str) -> dict:
    """
    Get the pipeline body for docs embedding with dynamic parameter support.

    Args:
        ml_model_id: OpenSearch ML model ID

    Returns:
        Pipeline body configuration
    """

    # Get the correct parameter name for the active model (input, texts, or inputText)
    param_name = get_embedding_param_from_active_model()

    return {
        "description": "Content embedding for docs",
        "processors": [
            {
                "ml_inference": {
                    "model_id": ml_model_id,
                    "input_map": [{"input": "content"}],
                    "model_input": f'{{ "parameters": {{ "{param_name}": [ "${{input_map.input}}" ] }} }}',
                    "output_map": [{"content_semantic": "$.inference_results[0].output[0].data"}],
                    "if": "ctx.content != null && ctx.content != '' && ctx.content.trim() != ''",
                }
            }
        ],
    }


# Pipeline configurations
# Each key is the pipeline identifier, value is a dict with:
# - name: actual pipeline name from config
# - get_body: function to get pipeline body (requires ml_model_id)

PIPELINE_CONFIGS = {
    "docs_pipeline": {
        "name": settings.vector_db.DOCS_PIPELINE_NAME,
        "get_body": get_pipeline_body,
        "description": "Content embedding pipeline for plane documentation",
    },
}
