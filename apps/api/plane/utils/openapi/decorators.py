"""
Helper decorators for drf-spectacular OpenAPI documentation.

This module provides domain-specific decorators that apply common
parameters, responses, and tags to API endpoints based on their context.
"""

from drf_spectacular.utils import extend_schema
from .parameters import (
    WORKSPACE_SLUG_PARAMETER,
    PROJECT_ID_PARAMETER,
    TYPE_ID_PARAMETER,
    PROPERTY_ID_PARAMETER,
)
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
        "summary": "User related information",
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
        "summary": "Workspace related endpoints",
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
        "summary": "Endpoints for project create/update/delete and fetch project details",
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
        "summary": "Endpoints for cycle create/update/delete and fetch cycle details",
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
        "summary": "Endpoints for issue create/update/delete and fetch issue details",
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
        "summary": "Endpoints for asset create/upload/delete and fetch asset details",
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
        "summary": "Endpoints for work item create/update/delete and fetch work item details",
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
        "summary": "Endpoints for label create/update/delete and fetch label details",
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
        "summary": "Endpoints for issue link create/update/delete and fetch issue link details",
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
        "summary": "Endpoints for issue comment create/update/delete and fetch issue comment details",
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
        "summary": "Endpoints for issue activity/search and fetch issue activity details",
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
        "summary": "Endpoints for issue attachment create/update/delete and fetch issue attachment details",
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
        "summary": "Endpoints for module create/update/delete and fetch module details",
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
        "summary": "Endpoints for state create/update/delete and fetch state details",
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_worklog_docs(**kwargs):
    """Decorator for issue worklog endpoints"""
    defaults = {
        "tags": ["Work Item Worklogs"],
        "summary": "Endpoints for issue worklog create/update/delete and fetch issue worklog details",
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_type_docs(**kwargs):
    """Decorator for issue type management endpoints"""
    defaults = {
        "tags": ["Work Item Types"],
        "summary": "Endpoints for issue type create/update/delete and fetch issue type details",
        "parameters": [WORKSPACE_SLUG_PARAMETER, PROJECT_ID_PARAMETER],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_property_docs(**kwargs):
    """Decorator for issue property management endpoints"""
    defaults = {
        "tags": ["Work Item Properties"],
        "summary": "Endpoints for issue property create/update/delete and fetch issue property details",
        "parameters": [
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            TYPE_ID_PARAMETER,
        ],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_property_option_docs(**kwargs):
    """Decorator for issue property option management endpoints"""
    defaults = {
        "tags": ["Work Item Properties"],
        "summary": "Endpoints for issue property option create/update/delete and fetch issue property option details",
        "parameters": [
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            PROPERTY_ID_PARAMETER,
        ],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))


def issue_property_value_docs(**kwargs):
    """Decorator for issue property value management endpoints"""
    defaults = {
        "tags": ["Work Item Properties"],
        "summary": "Endpoints for issue property value create/update/delete and fetch issue property value details",
        "parameters": [
            WORKSPACE_SLUG_PARAMETER,
            PROJECT_ID_PARAMETER,
            PROPERTY_ID_PARAMETER,
        ],
        "responses": {
            401: UNAUTHORIZED_RESPONSE,
            403: FORBIDDEN_RESPONSE,
            404: NOT_FOUND_RESPONSE,
        },
    }

    return extend_schema(**_merge_schema_options(defaults, kwargs))
