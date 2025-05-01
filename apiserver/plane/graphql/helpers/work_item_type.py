# Third Party Imports
from asgiref.sync import sync_to_async

# Module Imports
from plane.db.models import IssueType
from plane.graphql.utils.feature_flag import _validate_feature_flag
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum


@sync_to_async
def is_work_item_type_feature_flagged(user_id: str, workspace_slug: str):
    return _validate_feature_flag(
        user_id=user_id,
        workspace_slug=workspace_slug,
        feature_key=FeatureFlagsTypesEnum.ISSUE_TYPES.value,
        default_value=False,
    )


@sync_to_async
def default_work_item_type(workspace_slug: str, project_id: str):
    """
    Get the default work item type for the project
    """
    try:
        issue_type = IssueType.objects.get(
            workspace__slug=workspace_slug,
            project_issue_types__project_id=project_id,
            is_default=True,
        )
        return issue_type
    except IssueType.DoesNotExist:
        return None
