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

    target_class = "plane.api.middleware.api_authentication.APIKeyAuthentication"
    name = "ApiKeyAuthentication"
    priority = 1

    def get_security_definition(self, auto_schema):
        """
        Return the security definition for API key authentication.
        """
        return {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API key authentication. Provide your API key in the X-API-Key header.",
        }


class APITokenAuthenticationExtension(OpenApiAuthenticationExtension):
    """
    OpenAPI authentication extension for any additional token authentication classes.
    """

    target_class = "plane.authentication.api_token.APITokenAuthentication"
    name = "ApiTokenAuthentication"

    def get_security_definition(self, auto_schema):
        """
        Return the security definition for API token authentication.
        """
        return {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "Token",
            "description": 'API token authentication. Provide your token in the Authorization header as "Bearer <token>".',
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
            description="A typical workspace slug",
        )
    ],
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
            description="A typical project UUID",
        )
    ],
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
    ],
)

# Common Responses
UNAUTHORIZED_RESPONSE = OpenApiResponse(
    description="Authentication credentials were not provided or are invalid.",
    examples=[
        OpenApiExample(
            name="Unauthorized",
            value={
                "error": "Authentication credentials were not provided",
                "error_code": "AUTHENTICATION_REQUIRED",
            },
        )
    ],
)

FORBIDDEN_RESPONSE = OpenApiResponse(
    description="Permission denied. User lacks required permissions.",
    examples=[
        OpenApiExample(
            name="Forbidden",
            value={
                "error": "You do not have permission to perform this action",
                "error_code": "PERMISSION_DENIED",
            },
        )
    ],
)

NOT_FOUND_RESPONSE = OpenApiResponse(
    description="The requested resource was not found.",
    examples=[
        OpenApiExample(
            name="Not Found",
            value={"error": "Not found", "error_code": "RESOURCE_NOT_FOUND"},
        )
    ],
)

VALIDATION_ERROR_RESPONSE = OpenApiResponse(
    description="Validation error occurred with the provided data.",
    examples=[
        OpenApiExample(
            name="Validation Error",
            value={
                "error": "Validation failed",
                "details": {"field_name": ["This field is required."]},
            },
        )
    ],
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
            "mimetype": "application/pdf",
        },
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T10:30:00Z",
    },
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
        "updated_at": "2024-01-15T10:30:00Z",
    },
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
        "updated_at": "2024-01-15T10:30:00Z",
    },
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
        "updated_at": "2024-01-15T10:30:00Z",
    },
)


def workspace_docs(**kwargs):
    """Decorator for workspace-related endpoints"""
    defaults = {
        "tags": ["Workspaces"],
        "parameters": [WORKSPACE_SLUG_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }
    defaults.update(kwargs)
    return extend_schema(**defaults)


def project_docs(**kwargs):
    """Decorator for project-related endpoints"""
    defaults = {
        "tags": ["Projects"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }
    defaults.update(kwargs)
    return extend_schema(**defaults)


def issue_docs(**kwargs):
    """Decorator for issue-related endpoints"""
    defaults = {
        "tags": ["Work Items"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }
    defaults.update(kwargs)
    return extend_schema(**defaults)


# Preprocessing hooks for schema filtering
def preprocess_filter_api_v1_paths(endpoints):
    """
    Filter OpenAPI endpoints to only include /api/v1/ paths and exclude PUT methods.
    """
    filtered = []
    for path, path_regex, method, callback in endpoints:
        # Only include paths that start with /api/v1/ and exclude PUT methods
        if path.startswith("/api/v1/") and method.upper() != "PUT":
            filtered.append((path, path_regex, method, callback))
    return filtered


def postprocess_assign_tags(result, generator, request, public):
    """
    Post-process the OpenAPI schema to assign tags to endpoints based on URL patterns.
    Tags are defined in SPECTACULAR_SETTINGS["TAGS"].
    """
    # Define tag mapping based on URL patterns - ORDER MATTERS (most specific first)
    tag_mappings = [
        {
            "patterns": [
                "/projects/{project_id}/intake-issues/{",
                "/intake-issues/",
            ],
            "tag": "Intake",
        },
        {
            "patterns": [
                "/projects/{project_id}/cycles/",
                "/cycles/{cycle_id}/",
                "/archived-cycles/",
                "/cycle-issues/",
                "/transfer-issues/",
                "/transfer/",
            ],
            "tag": "Cycles",
        },
        {
            "patterns": [
                "/projects/{project_id}/modules/",
                "/modules/{module_id}/",
                "/archived-modules/",
                "/module-issues/",
            ],
            "tag": "Modules",
        },
        {
            "patterns": [
                "/projects/{project_id}/issues/",
                "/issue-attachments/",
            ],
            "tag": "Work Items",
        },
        {
            "patterns": ["/projects/{project_id}/states/", "/states/{state_id}/"],
            "tag": "States",
        },
        {"patterns": ["/projects/{project_id}/labels/", "/labels/{"], "tag": "Labels"},
        {"patterns": ["/members/", "/members/{"], "tag": "Members"},
        {"patterns": ["/assets/", "/user-assets/", "/generic-asset"], "tag": "Assets"},
        {"patterns": ["/users/", "/users/{"], "tag": "Users"},
        {"patterns": ["/projects/", "/projects/{", "/archive/"], "tag": "Projects"},
    ]

    # Assign tags to endpoints based on URL patterns
    for path, path_info in result.get("paths", {}).items():
        for method, operation in path_info.items():
            if method.upper() in ["GET", "POST", "PATCH", "DELETE"]:
                # Find the appropriate tag - check most specific patterns first
                assigned_tag = "General"  # Default tag

                for tag_info in tag_mappings:
                    for pattern in tag_info["patterns"]:
                        if pattern in path:
                            assigned_tag = tag_info["tag"]
                            break
                    if assigned_tag != "General":
                        break

                # Assign the tag
                operation["tags"] = [assigned_tag]

                # Add better summaries based on method and path
                if "summary" not in operation:
                    operation["summary"] = generate_operation_summary(
                        method.upper(), path, assigned_tag
                    )

    return result


def generate_operation_summary(method, path, tag):
    """
    Generate a human-readable summary for an operation.
    """
    # Extract the main resource from the path
    path_parts = [part for part in path.split("/") if part and not part.startswith("{")]

    if len(path_parts) > 0:
        resource = path_parts[-1].replace("-", " ").title()
    else:
        resource = tag

    # Generate summary based on method
    method_summaries = {
        "GET": f"Retrieve {resource}",
        "POST": f"Create {resource}",
        "PATCH": f"Update {resource}",
        "DELETE": f"Delete {resource}",
    }

    # Handle specific cases
    if "archive" in path.lower():
        if method == "POST":
            return f'Archive {tag.rstrip("s")}'
        elif method == "DELETE":
            return f'Unarchive {tag.rstrip("s")}'

    if "transfer" in path.lower():
        return f'Transfer {tag.rstrip("s")}'

    return method_summaries.get(method, f"{method} {resource}")
