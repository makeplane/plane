"""
OpenAPI utilities for drf-spectacular integration.

This module provides reusable components for API documentation:
- Authentication extensions
- Common parameters and responses  
- Helper decorators
- Schema preprocessing hooks
- Examples
"""

# Authentication extensions
from .auth import APIKeyAuthenticationExtension, APITokenAuthenticationExtension

# Parameters
from .parameters import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    ISSUE_ID_PARAMETER,
    ASSET_ID_PARAMETER,
    CURSOR_PARAMETER,
    PER_PAGE_PARAMETER,
)

# Responses
from .responses import (
    UNAUTHORIZED_RESPONSE,
    FORBIDDEN_RESPONSE,
    NOT_FOUND_RESPONSE,
    VALIDATION_ERROR_RESPONSE,
    PRESIGNED_URL_SUCCESS_RESPONSE,
    GENERIC_ASSET_UPLOAD_SUCCESS_RESPONSE,
    GENERIC_ASSET_VALIDATION_ERROR_RESPONSE,
    ASSET_CONFLICT_RESPONSE,
    ASSET_DOWNLOAD_SUCCESS_RESPONSE,
    ASSET_DOWNLOAD_ERROR_RESPONSE,
    ASSET_UPDATED_RESPONSE,
    ASSET_DELETED_RESPONSE,
    ASSET_NOT_FOUND_RESPONSE,
)

# Examples
from .examples import (
    FILE_UPLOAD_EXAMPLE,
    WORKSPACE_EXAMPLE,
    PROJECT_EXAMPLE,
    ISSUE_EXAMPLE,
)

# Helper decorators
from .decorators import (
    workspace_docs,
    project_docs,
    issue_docs,
    asset_docs,
)

# Schema processing hooks
from .hooks import (
    preprocess_filter_api_v1_paths,
    postprocess_assign_tags,
    generate_operation_summary,
)

__all__ = [
    # Authentication
    'APIKeyAuthenticationExtension',
    'APITokenAuthenticationExtension',
    
    # Parameters
    'WORKSPACE_SLUG_PARAMETER',
    'PROJECT_ID_PARAMETER', 
    'ISSUE_ID_PARAMETER',
    'ASSET_ID_PARAMETER',
    'CURSOR_PARAMETER',
    'PER_PAGE_PARAMETER',
    
    # Responses
    'UNAUTHORIZED_RESPONSE',
    'FORBIDDEN_RESPONSE',
    'NOT_FOUND_RESPONSE',
    'VALIDATION_ERROR_RESPONSE',
    'PRESIGNED_URL_SUCCESS_RESPONSE',
    'GENERIC_ASSET_UPLOAD_SUCCESS_RESPONSE',
    'GENERIC_ASSET_VALIDATION_ERROR_RESPONSE',
    'ASSET_CONFLICT_RESPONSE',
    'ASSET_DOWNLOAD_SUCCESS_RESPONSE',
    'ASSET_DOWNLOAD_ERROR_RESPONSE',
    'ASSET_UPDATED_RESPONSE',
    'ASSET_DELETED_RESPONSE',
    'ASSET_NOT_FOUND_RESPONSE',
    
    # Examples
    'FILE_UPLOAD_EXAMPLE',
    'WORKSPACE_EXAMPLE',
    'PROJECT_EXAMPLE',
    'ISSUE_EXAMPLE',
    
    # Decorators
    'workspace_docs',
    'project_docs',
    'issue_docs',
    'asset_docs',
    
    # Hooks
    'preprocess_filter_api_v1_paths',
    'postprocess_assign_tags',
    'generate_operation_summary',
] 