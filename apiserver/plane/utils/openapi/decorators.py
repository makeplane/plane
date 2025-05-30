"""
Helper decorators for drf-spectacular OpenAPI documentation.

This module provides domain-specific decorators that apply common
parameters, responses, and tags to API endpoints based on their context.
"""

from drf_spectacular.utils import extend_schema
from .parameters import WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER
from .responses import UNAUTHORIZED_RESPONSE, FORBIDDEN_RESPONSE, NOT_FOUND_RESPONSE


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


def asset_docs(**kwargs):
    """Decorator for asset-related endpoints with common defaults"""
    defaults = {
        "tags": ["Assets"],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
        },
    }
    defaults.update(kwargs)
    return extend_schema(**defaults) 