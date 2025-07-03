# OpenSearch Documents

This directory contains OpenSearch document definitions for Plane's search functionality. These documents define how Django models are indexed and searched in OpenSearch/Elasticsearch.

## Overview

The documents in this folder provide full-text search capabilities across various Plane entities including issues, projects, workspaces, and more. Each document type corresponds to a Django model and defines:

- Field mappings and analyzers
- Index settings and configurations
- Data preparation methods
- Related model handling for automatic reindexing

## Document Types

| Document | Model | Purpose | Semantic Search |
|----------|--------|---------|----------------|
| `IssueDocument` | Issue | Full-text search of issues with semantic search support | ✅ (name, description, content) |
| `IssueCommentDocument` | IssueComment | Search within issue comments | ❌ |
| `ProjectDocument` | Project | Project search and discovery | ❌ |
| `WorkspaceDocument` | Workspace | Workspace search functionality | ❌ |
| `ModuleDocument` | Module | Module/sprint search | ❌ |
| `CycleDocument` | Cycle | Cycle search and filtering | ❌ |
| `PageDocument` | Page | Page content search with semantic capabilities | ✅ (name, description) |
| `IssueViewDocument` | IssueView | Search saved issue views | ❌ |
| `TeamspaceDocument` | Teamspace | Teamspace search and discovery | ❌ |

## Architecture

### Base Document (`base.py`)

The `BaseDocument` class provides common functionality for all search documents:

- **Performance Optimizations**: Configured with optimal shard/replica counts and refresh intervals
- **Custom Analyzers**: Includes edge n-gram analyzer for autocomplete functionality
- **Custom Fields**: 
  - `JsonKeywordField`: For storing JSON data as searchable strings
  - `KnnVectorField`: For semantic search using vector embeddings
- **Semantic Field Management**: Automatically handles semantic field exclusion during partial updates
- **Upsert Behavior**: Built-in support for upsert operations that create documents if missing

### Semantic Field Architecture

The system intelligently handles semantic embeddings to optimize both performance and accuracy:

#### How It Works

1. **Model Initialization**: Issue and Page models track original semantic field values:
   ```python
   def __init__(self, *args, **kwargs):
       super().__init__(*args, **kwargs)
       self._original_name = self.name
       self._original_description_stripped = self.description_stripped
   ```

2. **Change Detection**: Signal handler compares current vs original values:
   ```python
   def _check_semantic_fields_changed(self, instance, **kwargs):
       original_name = getattr(instance, '_original_name', None)
       current_name = getattr(instance, 'name', None)
       return original_name != current_name  # (simplified)
   ```

3. **Intelligent Action Selection**:
   - **Semantic fields changed** → `action="index"` → Full reindex with new embeddings
   - **Semantic fields unchanged** → `action="update"` → Partial update, semantic fields excluded

4. **Document Processing**: Documents override `prepare()` to exclude semantic fields when unchanged:
   ```python
   def prepare(self, instance):
       data = super().prepare(instance)
       if not getattr(instance, '_semantic_fields_changed', False):
           for field in ['description_semantic', 'name_semantic']:
               data.pop(field, None)
       return data
   ```

5. **Upsert Behavior**: BaseDocument automatically handles missing documents:
   ```python
   def _prepare_action(self, object_instance, action):
       action_dict = super()._prepare_action(object_instance, action)
       if action == "update":
           action_dict["doc_as_upsert"] = True
       return action_dict
   ```

#### Benefits

- **Performance**: Avoids unnecessary embedding regeneration
- **Accuracy**: Preserves existing embeddings when content unchanged  
- **Reliability**: Handles missing documents gracefully
- **Monitoring**: Comprehensive error handling and logging

### Automatic Indexing System

#### Signal Handling

The `signal_handler.py` module provides automatic index updates with comprehensive error handling:

- **Bulk Operations**: Handles bulk create/update signals efficiently with batch processing
- **Related Model Updates**: Updates documents when related models change
- **Celery Integration**: Asynchronous processing for better performance
- **Semantic Field Detection**: Automatically detects when semantic fields change and triggers appropriate indexing action
- **Comprehensive Error Handling**: Specific error handling for:
  - **Serialization Errors**: Field access issues, validation failures, missing related objects
  - **JSON/Encoding Errors**: Non-serializable objects, character encoding problems
  - **Network/Connection Errors**: OpenSearch/Celery connectivity issues with retry support
  - **Model/Registry Errors**: Model lookup failures and document mapping issues
- **Intelligent Batching**: Processes large datasets in configurable batches with failure isolation
- **Detailed Logging**: Context-rich logging for debugging and monitoring

## Key Features

### 1. Edge N-gram Search
All text fields use edge n-gram analysis for fast autocomplete functionality:
```python
name = fields.TextField(analyzer=edge_ngram_analyzer, search_analyzer="standard")
```

### 2. Semantic Search
Issues and Pages support vector-based semantic search using embeddings:
```python
description_semantic = KnnVectorField(
    dimension=1536,
    space_type="cosinesimil",
    method={"name": "hnsw", "engine": "lucene"}
)
```

### 3. Permission-Aware Search
All documents include user permission fields to ensure search results respect access controls:
```python
active_project_member_user_ids = fields.ListField(fields.KeywordField())
```

### 4. Multi-Document Search
Efficient searching across multiple document types in a single network request with automatic result organization.

## Usage Guide

### Single Document Search

Search within a specific document type using `OpenSearchHelper`:

```python
from plane.ee.utils.opensearch_helper import OpenSearchHelper
from plane.ee.documents import IssueDocument
from plane.ee.serializers.app.search_serializers import IssueSearchSerializer

# Create a search helper
helper = OpenSearchHelper(
    document_cls=IssueDocument,
    filters=[
        {"workspace_slug": workspace_slug},
        {"active_project_member_user_ids": user_id},
        {"project_is_archived": False}
    ],
    query="bug fix",
    search_fields=["name", "description", "project_identifier"],
    source_fields=["name", "id", "sequence_id", "project_identifier"],
    page=1,
    page_size=25,
    boosts={"name": 1.25, "description": 1.0},
    serializer_class=IssueSearchSerializer
)

# Execute the search
results = helper.execute_and_serialize()
```

### Multi-Document Search

Search across multiple document types efficiently in a single request:

```python
from plane.ee.utils.opensearch_helper import OpenSearchHelper
from plane.ee.documents import IssueDocument, ProjectDocument, CycleDocument
from plane.ee.serializers.app.search_serializers import (
    IssueSearchSerializer,
    ProjectSearchSerializer, 
    CycleSearchSerializer
)

# Create multiple search helpers
issue_helper = OpenSearchHelper(
    document_cls=IssueDocument,
    filters=[{"workspace_slug": workspace_slug}],
    query="bug fix",
    result_key="issues",  # Required for multi-search
    serializer_class=IssueSearchSerializer
)

project_helper = OpenSearchHelper(
    document_cls=ProjectDocument,
    filters=[{"workspace_slug": workspace_slug}],
    query="bug fix",
    result_key="projects",  # Required for multi-search
    serializer_class=ProjectSearchSerializer
)

cycle_helper = OpenSearchHelper(
    document_cls=CycleDocument,
    filters=[{"workspace_slug": workspace_slug}],
    query="bug fix",
    result_key="cycles",  # Required for multi-search
    serializer_class=CycleSearchSerializer
)

# Execute multi-search
results = OpenSearchHelper.execute_multi_search([
    issue_helper,
    project_helper,
    cycle_helper
])

# Results organized by result_key:
# {
#   "issues": [...],
#   "projects": [...], 
#   "cycles": [...]
# }
```

### Multi-Search Best Practices

When using multi-search functionality:

1. **Always Set result_key**: Each helper must have a unique `result_key` for organizing results
2. **Always Set serializer_class**: Each helper must have a `serializer_class` for consistent data formatting
3. **Use Same Filters**: Apply consistent permission filters across all helpers
4. **Limit Helper Count**: Keep the number of helpers reasonable (typically 3-8) for optimal performance

**Benefits**:
- Single network round-trip to OpenSearch
- Automatic result organization by `result_key`
- Consistent serialization across document types
- Better performance than sequential searches

## Configuration

### Environment Variables
- `OPENSEARCH_ENABLED`: Enable/disable search indexing
- `OPENSEARCH_INDEX_PREFIX`: Prefix for all index names
- `OPENSEARCH_SHARD_COUNT`: Number of shards per index
- `OPENSEARCH_REPLICA_COUNT`: Number of replicas per index

### Index Settings
Each document includes optimized settings:
- **Refresh Interval**: 30s for better indexing performance
- **Translog Settings**: Optimized for bulk operations
- **Slow Log**: Query and indexing performance monitoring

## Development Guide

### Adding a New Document Type

1. **Create the Document Class**:
```python
@registry.register_document
class MyDocument(BaseDocument):
    name = fields.TextField(analyzer=edge_ngram_analyzer)
    
    class Index(BaseDocument.Index):
        name = f"{settings.OPENSEARCH_INDEX_PREFIX}_my_entities"
    
    class Django:
        model = MyModel
        fields = ["id", "created_at"]
        queryset_pagination = 5000
        related_models = [RelatedModel]
```

2. **Add Data Preparation Methods**:
```python
def prepare_custom_field(self, instance):
    """Custom data transformation for indexing"""
    return transform_data(instance.raw_field)
```

3. **Handle Related Models**:
```python
def get_instances_from_related(self, related_instance):
    """Define how related model changes trigger reindexing"""
    if isinstance(related_instance, RelatedModel):
        return related_instance.my_model_set.all()
```

### Running Index Operations

#### Standard OpenSearch Commands

```bash
# Create indexes
python manage.py opensearch index create

# Populate indexes
python manage.py opensearch document index

# Rebuild specific index
python manage.py opensearch document index --models plane.db.models.Issue
```

#### Background Index Operations

For long-running operations, use the `manage_search_index` command which supports background execution:

```bash
# Run index creation in background
python manage.py manage_search_index --background index create

# Run document indexing in background
python manage.py manage_search_index --background document index

# Rebuild specific index in background
python manage.py manage_search_index --background document index --models plane.db.models.Issue

# Run any opensearch command in background
python manage.py manage_search_index --background <opensearch_args>
```

**Benefits of Background Execution**:
- Non-blocking for large datasets
- Suitable for production deployments
- Can be safely interrupted without affecting the main process
- Ideal for automated scripts and CI/CD pipelines

### Testing

Search functionality should be tested with:
- Unit tests for document field mappings
- Integration tests for search queries
- Performance tests for large datasets

## Operations

### Performance & Optimization

#### Pagination Settings
Each document defines `queryset_pagination` to optimize bulk indexing:
- **Issues**: 25,000 (most complex with many relationships)
- **Projects/Workspaces**: 10,000 (moderate complexity)
- **Others**: 5,000 (simpler models)

#### Prefetch Optimization
All documents use `apply_related_to_queryset()` to optimize database queries during indexing:
```python
def apply_related_to_queryset(self, qs):
    return qs.select_related("workspace").prefetch_related(
        Prefetch("project__project_projectmember", 
                queryset=ProjectMember.objects.filter(is_active=True))
    )
```

### Troubleshooting

#### Common Issues

1. **Index Not Found**: Ensure OpenSearch is running and indexes are created
2. **Permission Errors**: Check that user permission fields are correctly populated  
3. **Performance Issues**: Monitor slow query logs and adjust pagination settings
4. **Document Missing Errors**: The system now automatically handles missing documents using upsert behavior
5. **Semantic Field Issues**: Check logs for semantic field change detection and ensure original values are properly tracked

#### Error Handling & Monitoring

The enhanced signal handler provides detailed error logging for:

- **Serialization Failures**: Object field access or validation errors
- **Encoding Problems**: JSON serialization and Unicode issues  
- **Network Issues**: OpenSearch connection and timeout errors
- **Model Errors**: Django model lookup and registry issues

**Log Levels**:
- `DEBUG`: Successful operations and detailed progress
- `INFO`: Batch processing summaries and high-level operations
- `WARNING`: Recoverable issues (missing objects, unsupported models)
- `ERROR`: Failed operations requiring attention

#### Debugging

Enable Django logging to see index operations:
```python
LOGGING = {
    'loggers': {
        'django_opensearch_dsl': {
            'level': 'DEBUG',
        }
    }
}
```

## Related Components

- **OpenSearch Helper**: `plane/ee/utils/opensearch_helper.py` - Main search query builder and executor
- **Search API Views**: `plane/ee/views/app/search/` - REST API endpoints for search functionality
- **Search Serializers**: `plane/ee/serializers/app/search_serializers.py` - Data serialization for search results
- **Background Tasks**: `plane/ee/bgtasks/search_index_update_task.py` - Async index update tasks
- **Management Commands**: 
  - `plane/ee/management/commands/manage_search_index.py` - Enhanced CLI tools with background execution support
  - Built-in `opensearch` command - Standard Django OpenSearch DSL management commands 