"""
Common documentation utilities for drf-spectacular OpenAPI generation.
This module provides reusable examples, parameters, responses, and authentication extensions for API documentation.
"""

from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    OpenApiResponse,
    extend_schema,
)
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.extensions import OpenApiAuthenticationExtension
from rest_framework import status

# Authentication Extensions
class APIKeyAuthenticationExtension(OpenApiAuthenticationExtension):
    """
    OpenAPI authentication extension for plane.api.middleware.api_authentication.APIKeyAuthentication
    """
    target_class = 'plane.api.middleware.api_authentication.APIKeyAuthentication'
    name = 'ApiKeyAuthentication'

    def get_security_definition(self, auto_schema):
        """
        Return the security definition for API key authentication.
        """
        return {
            'type': 'apiKey',
            'in': 'header',
            'name': 'X-API-Key',
            'description': 'API key authentication. Provide your API key in the X-API-Key header.',
        }


class APITokenAuthenticationExtension(OpenApiAuthenticationExtension):
    """
    OpenAPI authentication extension for any additional token authentication classes.
    """
    target_class = 'plane.authentication.api_token.APITokenAuthentication'
    name = 'ApiTokenAuthentication'

    def get_security_definition(self, auto_schema):
        """
        Return the security definition for API token authentication.
        """
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'Token',
            'description': 'API token authentication. Provide your token in the Authorization header as "Bearer <token>".',
        }


# Common Parameters
WORKSPACE_SLUG_PARAMETER = OpenApiParameter(
    name="slug",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.PATH,
    description="Workspace slug identifier",
    required=True,
    examples=[
        OpenApiExample(
            name="Example workspace slug",
            value="my-workspace",
            description="A typical workspace slug"
        )
    ]
)

PROJECT_ID_PARAMETER = OpenApiParameter(
    name="project_id",
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    description="Project UUID identifier",
    required=True,
    examples=[
        OpenApiExample(
            name="Example project ID",
            value="550e8400-e29b-41d4-a716-446655440000",
            description="A typical project UUID"
        )
    ]
)

ISSUE_ID_PARAMETER = OpenApiParameter(
    name="issue_id", 
    type=OpenApiTypes.UUID,
    location=OpenApiParameter.PATH,
    description="Issue UUID identifier",
    required=True,
)

# Common Query Parameters
CURSOR_PARAMETER = OpenApiParameter(
    name="cursor",
    type=OpenApiTypes.STR,
    location=OpenApiParameter.QUERY,
    description="Pagination cursor for getting next set of results",
    required=False,
)

PER_PAGE_PARAMETER = OpenApiParameter(
    name="per_page",
    type=OpenApiTypes.INT,
    location=OpenApiParameter.QUERY,
    description="Number of results per page (default: 20, max: 100)",
    required=False,
    examples=[
        OpenApiExample(name="Default", value=20),
        OpenApiExample(name="Maximum", value=100),
    ]
)

# Common Responses
UNAUTHORIZED_RESPONSE = OpenApiResponse(
    description="Authentication credentials were not provided or are invalid.",
    examples=[
        OpenApiExample(
            name="Unauthorized",
            value={
                "error": "Authentication credentials were not provided",
                "error_code": "AUTHENTICATION_REQUIRED"
            }
        )
    ]
)

FORBIDDEN_RESPONSE = OpenApiResponse(
    description="Permission denied. User lacks required permissions.",
    examples=[
        OpenApiExample(
            name="Forbidden",
            value={
                "error": "You do not have permission to perform this action",
                "error_code": "PERMISSION_DENIED"
            }
        )
    ]
)

NOT_FOUND_RESPONSE = OpenApiResponse(
    description="The requested resource was not found.",
    examples=[
        OpenApiExample(
            name="Not Found",
            value={
                "error": "Not found",
                "error_code": "RESOURCE_NOT_FOUND"
            }
        )
    ]
)

VALIDATION_ERROR_RESPONSE = OpenApiResponse(
    description="Validation error occurred with the provided data.",
    examples=[
        OpenApiExample(
            name="Validation Error",
            value={
                "error": "Validation failed",
                "details": {
                    "field_name": ["This field is required."]
                }
            }
        )
    ]
)

# Common Examples for File Upload
FILE_UPLOAD_EXAMPLE = OpenApiExample(
    name="File Upload Success",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "asset": "uploads/workspace_1/file_example.pdf",
        "attributes": {
            "name": "example-document.pdf",
            "size": 1024000,
            "mimetype": "application/pdf"
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
)

# Workspace Examples
WORKSPACE_EXAMPLE = OpenApiExample(
    name="Workspace",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "My Workspace",
        "slug": "my-workspace",
        "organization_size": "1-10",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
)

# Project Examples  
PROJECT_EXAMPLE = OpenApiExample(
    name="Project",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Mobile App Development",
        "description": "Development of the mobile application",
        "identifier": "MAD",
        "network": 2,
        "project_lead": "550e8400-e29b-41d4-a716-446655440001",
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
)

# Issue Examples
ISSUE_EXAMPLE = OpenApiExample(
    name="Issue",
    value={
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "Implement user authentication",
        "description": "Add OAuth 2.0 authentication flow",
        "sequence_id": 1,
        "priority": "high",
        "assignees": ["550e8400-e29b-41d4-a716-446655440001"],
        "labels": ["550e8400-e29b-41d4-a716-446655440002"],
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z"
    }
)

def workspace_docs(**kwargs):
    """Decorator for workspace-related endpoints"""
    defaults = {
        'tags': ['Workspaces'],
        'parameters': [WORKSPACE_SLUG_PARAMETER],
        'responses': {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        }
    }
    defaults.update(kwargs)
    return extend_schema(**defaults)

def project_docs(**kwargs):
    """Decorator for project-related endpoints"""
    defaults = {
        'tags': ['Projects'],
        'parameters': [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        'responses': {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        }
    }
    defaults.update(kwargs)
    return extend_schema(**defaults)

def issue_docs(**kwargs):
    """Decorator for issue-related endpoints"""
    defaults = {
        'tags': ['Issues'],
        'parameters': [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        'responses': {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        }
    }
    defaults.update(kwargs)
    return extend_schema(**defaults)

# Preprocessing hooks for schema filtering
def preprocess_filter_api_v1_paths(endpoints):
    """
    Preprocessing hook to filter endpoints to only include /api/v1/ paths.
    This ensures only API v1 endpoints are included in the generated schema.
    """
    filtered_endpoints = []
    for (path, path_regex, method, callback) in endpoints:
        # Only include paths that start with /api/v1/
        if path.startswith('/api/v1/'):
            filtered_endpoints.append((path, path_regex, method, callback))
    return filtered_endpoints 
