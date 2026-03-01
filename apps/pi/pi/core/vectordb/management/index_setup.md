# OpenSearch Index Setup Commands

These are OpenSearch Dev Tools commands for creating indices with ingest pipelines and knn_vector fields.

## 1. Create Ingest Pipelines

### Docs Pipeline (Content embedding)

```http
PUT /_ingest/pipeline/docs-embedding-pipeline
{
  "description": "Content embedding for docs",
  "processors": [
    {
      "ml_inference": {
        "model_id": "YOUR_ML_MODEL_ID",
        "input_map": [{"input": "content"}],
        "model_input": "{ \"parameters\": { \"texts\": [ \"${input_map.input}\" ] } }",
        "output_map": [{"content_semantic": "$.inference_results[0].output[0].data"}],
        "if": "ctx.content != null && ctx.content != '' && ctx.content.trim() != ''"
      }
    }
  ]
}
```

## 2. Create Indices

### Issues Index

```http
PUT /issues_semantic
{
  "settings": {
    "index": {
      "default_pipeline": "issue-embedding-pipeline",
      "knn": true
    }
  },
  "mappings": {
    "properties": {
      "active_project_member_user_ids": { "type": "keyword" },
      "archived_at": { "type": "keyword" },
      "content": { "type": "text" },
      "content_semantic": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "lucene",
          "space_type": "cosinesimil",
          "parameters": {
            "m": 16,
            "ef_construction": 512
          }
        }
      },
      "created_by_id": { "type": "keyword" },
      "deleted_at": { "type": "keyword" },
      "description": { "type": "text" },
      "description_semantic": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "lucene",
          "space_type": "cosinesimil",
          "parameters": {
            "m": 16,
            "ef_construction": 512
          }
        }
      },
      "duplicate_of": { "type": "keyword" },
      "id": { "type": "keyword" },
      "is_archived": { "type": "keyword" },
      "is_deleted": { "type": "keyword" },
      "issue_id": { "type": "keyword" },
      "labels": { "type": "keyword" },
      "name": { "type": "text" },
      "name_semantic": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "lucene",
          "space_type": "cosinesimil",
          "parameters": {
            "m": 16,
            "ef_construction": 512
          }
        }
      },
      "not_duplicates_with": { "type": "keyword" },
      "priority": { "type": "keyword" },
      "project_id": { "type": "keyword" },
      "project_identifier": { "type": "keyword" },
      "sequence_id": { "type": "keyword" },
      "state_id": { "type": "keyword" },
      "type_id": { "type": "keyword" },
      "workspace_id": { "type": "keyword" },
      "workspace_slug": { "type": "keyword" }
    }
  }
}
```

### Pages Index

```http
PUT /pages_semantic
{
  "settings": {
    "index": {
      "default_pipeline": "pages-embedding-pipeline",
      "knn": true
    }
  },
  "mappings": {
    "properties": {
      "access": { "type": "keyword" },
      "description": { "type": "text" },
      "description_semantic": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "lucene",
          "space_type": "cosinesimil",
          "parameters": {
            "m": 16,
            "ef_construction": 512
          }
        }
      },
      "id": { "type": "keyword" },
      "name": { "type": "text" },
      "name_semantic": {
        "type": "knn_vector",
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "lucene",
          "space_type": "cosinesimil",
          "parameters": {
            "m": 16,
            "ef_construction": 512
          }
        }
      },
      "owned_by_id": { "type": "keyword" },
      "page_id": { "type": "keyword" },
      "project_ids": { "type": "keyword" },
      "workspace_id": { "type": "keyword" }
    }
  }
}
```

### Docs Index

```http
PUT /docs_semantic
{
  "settings": {
    "index": {
      "default_pipeline": "docs-embedding-pipeline",
      "knn": true
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
        "dimension": 1536,
        "method": {
          "name": "hnsw",
          "engine": "lucene",
          "space_type": "cosinesimil",
          "parameters": {
            "m": 16,
            "ef_construction": 512
          }
        }
      }
    }
  }
}
```

### Unified Chat-Messages Index (Recommended)
```http
PUT /plane_runway_search_pi_chat_messages
{
  "mappings": {
    "properties": {
      "message_id": { "type": "keyword" },
      "chat_id":    { "type": "keyword" },
      "user_id":    { "type": "keyword" },
      "workspace_id": { "type": "keyword" },

      "is_project_chat": { "type": "boolean" },
      "is_deleted":      { "type": "boolean" },

      "title": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "raw": { "type": "keyword"}
        }
      },
      "content": {
        "type": "text",
        "analyzer": "standard",
        "fields": {
          "raw": { "type": "keyword"}
        }
      },

      "sequence": { "type": "integer" },

      "created_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      },
      "updated_at": {
        "type": "date",
        "format": "strict_date_optional_time||epoch_millis"
      },

      "user_type": { "type": "keyword" }
    }
  }
}
```

## Notes

- Replace `YOUR_ML_MODEL_ID` with your actual ML model ID from the ML setup
- Run the pipeline creation commands before creating the indices
- The dimension is set to 1536 for Cohere embed-v-4-0 model
- Indices will automatically use the pipelines to generate embeddings on document ingestion 
