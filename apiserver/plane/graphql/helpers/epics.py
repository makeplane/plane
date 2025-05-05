# Python imports
from typing import Optional

# Third Party Imports
from asgiref.sync import sync_to_async

# Django Imports
from django.db.models import Q

# Strawberry Imports
from strawberry.exceptions import GraphQLError
from strawberry.scalars import JSON

# Module Imports
from plane.db.models import Issue, IssueType
from plane.ee.models import ProjectFeature
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.utils.feature_flag import _validate_feature_flag


def epic_base_query(
    workspace_slug: Optional[str] = None,
    project_id: Optional[str] = None,
    user_id: Optional[str] = None,
):
    """
    Get the epic base query for objects and all objects the given workspace slug
    and project id
    """
    epic_base_query = (
        Issue.objects
        # issue intake filters
        .filter(
            Q(issue_intake__status=1)
            | Q(issue_intake__status=-1)
            | Q(issue_intake__status=2)
            | Q(issue_intake__isnull=True)
        )
        # old intake filters
        .filter(state__is_triage=False)
        # epic filters
        .filter(Q(type__isnull=False) & Q(type__is_epic=True))
        # archived filters
        .filter(archived_at__isnull=True)
        # deleted filters
        .filter(deleted_at__isnull=True)
        # draft filters
        .filter(is_draft=False)
    )

    # workspace filters
    if workspace_slug:
        epic_base_query = epic_base_query.filter(workspace__slug=workspace_slug)

    # project filters
    if project_id:
        epic_base_query = epic_base_query.filter(project_id=project_id).filter(
            project__archived_at__isnull=True
        )

    # project member filters
    if user_id:
        epic_base_query = epic_base_query.filter(
            project__project_projectmember__member_id=user_id,
            project__project_projectmember__is_active=True,
        )

    return epic_base_query


@sync_to_async
def is_epic_feature_flagged(
    user_id: str, workspace_slug: str, raise_exception: bool = True
):
    try:
        is_feature_flagged = _validate_feature_flag(
            user_id=user_id,
            workspace_slug=workspace_slug,
            feature_key=FeatureFlagsTypesEnum.EPICS.value,
            default_value=False,
        )

        if not is_feature_flagged:
            if raise_exception:
                message = "Epic feature flag is not enabled for the workspace"
                error_extensions = {
                    "code": "EPIC_FEATURE_FLAG_NOT_ENABLED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)
            return False
        return is_feature_flagged
    except Exception:
        if raise_exception:
            message = "Error checking if epic feature flag is enabled"
            error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)
        return False


@sync_to_async
def is_project_epics_enabled(
    workspace_slug: str, project_id: str, raise_exception: bool = True
):
    """
    Check if the epic feature flag is enabled for the workspace and project
    """
    try:
        project_feature = ProjectFeature.objects.filter(
            workspace__slug=workspace_slug, project_id=project_id
        ).first()

        if not project_feature.is_epic_enabled:
            if raise_exception:
                message = "Project epics are not enabled"
                error_extensions = {"code": "EPIC_NOT_ENABLED", "statusCode": 400}
                raise GraphQLError(message, extensions=error_extensions)
            return False
        return project_feature.is_epic_enabled
    except ProjectFeature.DoesNotExist:
        if raise_exception:
            message = "Project feature not found"
            error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
            raise GraphQLError(message, extensions=error_extensions)
        return False
    except Exception:
        if raise_exception:
            message = "Error checking if project epics are enabled"
            error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)
        return False


@sync_to_async
def get_project_epic_type(workspace_slug: str, project_id: str):
    """
    Get the epic type for the given project
    """
    try:
        return IssueType.objects.get(
            workspace__slug=workspace_slug,
            project_issue_types__project_id=project_id,
            is_epic=True,
            level=1,
            is_active=True,
        )
    except IssueType.DoesNotExist:
        message = "Epic type not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)


@sync_to_async
def get_project_epics(
    workspace_slug: str,
    project_id: str,
    user_id: str,
    filters: Optional[JSON] = {},
    orderBy: Optional[str] = "-created_at",
):
    """
    Get all epics for the given project
    """

    base_query = epic_base_query(
        workspace_slug=workspace_slug, project_id=project_id, user_id=user_id
    )

    epics = (
        base_query.select_related("workspace", "project", "state")
        .prefetch_related("assignees", "labels")
        .order_by(orderBy, "-created_at")
        .filter(**filters)
        .distinct()
    )

    return list(epics)


@sync_to_async
def get_epic(workspace_slug: str, project_id: str, epic_id: str):
    """
    Get the epic for the given project and epic id
    """
    base_query = epic_base_query(workspace_slug=workspace_slug, project_id=project_id)

    try:
        return base_query.get(id=epic_id)
    except Issue.DoesNotExist:
        message = "Epic not found"
        error_extensions = {"code": "NOT_FOUND", "statusCode": 404}
        raise GraphQLError(message, extensions=error_extensions)
