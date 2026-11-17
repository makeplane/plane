# OpenAPI Utilities Module

This module provides a well-organized structure for OpenAPI/drf-spectacular utilities, replacing the monolithic `openapi_spec_helpers.py` file with a more maintainable modular approach.

## Structure

```
plane/utils/openapi/
├── __init__.py          # Main module that re-exports everything
├── auth.py              # Authentication extensions
├── parameters.py        # Common OpenAPI parameters
├── responses.py         # Common OpenAPI responses
├── examples.py          # Common OpenAPI examples
├── decorators.py        # Helper decorators for different endpoint types
└── hooks.py            # Schema preprocessing hook and summary helper
```

## Usage

### Import Everything (Recommended for backwards compatibility)

```python
from plane.utils.openapi import (
    asset_docs,
    ASSET_ID_PARAMETER,
    UNAUTHORIZED_RESPONSE,
    # ... other imports
)
```

### Import from Specific Modules (Recommended for new code)

```python
from plane.utils.openapi.decorators import asset_docs
from plane.utils.openapi.parameters import ASSET_ID_PARAMETER
from plane.utils.openapi.responses import UNAUTHORIZED_RESPONSE
```

## Module Contents

### auth.py

- `APIKeyAuthenticationExtension` - X-API-Key authentication (imported in `plane/api/apps.py` so drf-spectacular registers it)

### parameters.py

- Path parameters: `WORKSPACE_SLUG_PARAMETER`, `PROJECT_ID_PARAMETER`, `ISSUE_ID_PARAMETER`, `ASSET_ID_PARAMETER`
- Query parameters: `CURSOR_PARAMETER`, `PER_PAGE_PARAMETER`

### responses.py

- Auth responses: `UNAUTHORIZED_RESPONSE`, `FORBIDDEN_RESPONSE`
- Resource responses: `NOT_FOUND_RESPONSE`, `VALIDATION_ERROR_RESPONSE`
- Asset responses: `PRESIGNED_URL_SUCCESS_RESPONSE`, `ASSET_UPDATED_RESPONSE`, etc.
- Generic asset responses: `GENERIC_ASSET_UPLOAD_SUCCESS_RESPONSE`, `ASSET_DOWNLOAD_SUCCESS_RESPONSE`, etc.

### examples.py

- `FILE_UPLOAD_EXAMPLE`, `WORKSPACE_EXAMPLE`, `PROJECT_EXAMPLE`, `ISSUE_EXAMPLE`

### decorators.py

One `*_docs()` decorator per resource, each wrapping `extend_schema` with the right tag and shared defaults:
`user_docs`, `workspace_docs`, `project_docs`, `cycle_docs`, `issue_docs`, `intake_docs`, `asset_docs`, `work_item_docs`, `label_docs`, `issue_link_docs`, `issue_comment_docs`, `issue_activity_docs`, `issue_attachment_docs`, `work_item_relation_docs`, `module_docs`, `module_issue_docs`, `state_docs`, `sticky_docs`, `estimate_docs`, `estimate_point_docs`.

### hooks.py

- `preprocess_filter_api_v1_paths()` - Keeps only `/api/v1/` paths and drops `PUT` operations and any path containing `server`
- `generate_operation_summary()` - Generates operation summaries (exported, not wired into the settings)

## Configuration

The schema is only generated when `ENABLE_DRF_SPECTACULAR=1` is set in the API environment. `plane/settings/common.py` then loads `SPECTACULAR_SETTINGS` from `plane/settings/openapi.py` (which registers the preprocessing hook) and `plane/urls.py` serves:

- `/api/schema/` - OpenAPI schema
- `/api/schema/swagger-ui/` - Swagger UI
- `/api/schema/redoc/` - ReDoc

## Where it is used

All public API views in `plane/api/views/` import from this module: `asset.py`, `cycle.py`, `estimate.py`, `intake.py`, `invite.py`, `issue.py`, `member.py`, `module.py`, `project.py`, `state.py`, `sticky.py` and `user.py`. The legacy `openapi_spec_helpers.py` file has been removed.
