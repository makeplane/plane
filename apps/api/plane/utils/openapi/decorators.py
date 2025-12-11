"""
Helper decorators for drf-spectacular OpenAPI documentation.

This module provides domain-specific decorators that apply common
parameters, responses, and tags to API endpoints based on their context.
"""

from drf_spectacular.utils import extend_schema
from .parameters import WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER
from .responses import UNAUTHORIZED_RESPONSE, FORBIDDEN_RESPONSE, NOT_FOUND_RESPONSE


def _merge_schema_options(defaults, kwargs):
    """Helper function to merge responses and parameters from kwargs into defaults"""
    # Merge responses
    if "responses" in kwargs:
        defaults["responses"].update(kwargs["responses"])
        kwargs = {k: v for k, v in kwargs.items() if k != "responses"}

    # Merge parameters
    if "parameters" in kwargs:
        defaults["parameters"].extend(kwargs["parameters"])
        kwargs = {k: v for k, v in kwargs.items() if k != "parameters"}

    defaults.update(kwargs)
    return defaults


def user_docs(**kwargs):
    """Decorator for user-related endpoints"""
    defaults = {
        "tags": ["Users"],
        "parameters": [],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


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

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def project_docs(**kwargs):
    """Decorator for project-related endpoints"""
    defaults = {
        "tags": ["Projects"],
        "parameters": [WORKSPACE_SLUG_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def cycle_docs(**kwargs):
    """Decorator for cycle-related endpoints"""
    defaults = {
        "tags": ["Cycles"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


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

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def intake_docs(**kwargs):
    """Decorator for intake-related endpoints"""
    defaults = {
        "tags": ["Intake"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def asset_docs(**kwargs):
    """Decorator for asset-related endpoints with common defaults"""
    defaults = {
        "tags": ["Assets"],
        "parameters": [],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


# Issue-related decorators for specific tags
def work_item_docs(**kwargs):
    """Decorator for work item endpoints (main issue operations)"""
    defaults = {
        "tags": ["Work Items"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def label_docs(**kwargs):
    """Decorator for label management endpoints"""
    defaults = {
        "tags": ["Labels"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_link_docs(**kwargs):
    """Decorator for issue link endpoints"""
    defaults = {
        "tags": ["Work Item Links"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_comment_docs(**kwargs):
    """Decorator for issue comment endpoints"""
    defaults = {
        "tags": ["Work Item Comments"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_activity_docs(**kwargs):
    """Decorator for issue activity/search endpoints"""
    defaults = {
        "tags": ["Work Item Activity"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_attachment_docs(**kwargs):
    """Decorator for issue attachment endpoints"""
    defaults = {
        "tags": ["Work Item Attachments"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def module_docs(**kwargs):
    """Decorator for module management endpoints"""
    defaults = {
        "tags": ["Modules"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def module_issue_docs(**kwargs):
    """Decorator for module issue management endpoints"""
    defaults = {
        "tags": ["Modules"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def state_docs(**kwargs):
    """Decorator for state management endpoints"""
    defaults = {
        "tags": ["States"],
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def sticky_docs(**kwargs):
    """Decorator for sticky management endpoints"""
    defaults = {
        "tags": ["Stickies"],
        "summary": "Endpoints for sticky create/update/delete and fetch sticky details",
        "parameters": [WORKSPACE_SLUG_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))
