# Third Party Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.types.issues.relation import WorkItemRelationTypes
from plane.graphql.utils.feature_flag import _validate_feature_flag

RELATION_TYPE_MAP = {
    WorkItemRelationTypes.START_AFTER.value: WorkItemRelationTypes.START_BEFORE.value,
    WorkItemRelationTypes.FINISH_AFTER.value: WorkItemRelationTypes.FINISH_BEFORE.value,
    WorkItemRelationTypes.BLOCKING.value: WorkItemRelationTypes.BLOCKED_BY.value,
    WorkItemRelationTypes.BLOCKED_BY.value: WorkItemRelationTypes.BLOCKED_BY.value,
    WorkItemRelationTypes.START_BEFORE.value: WorkItemRelationTypes.START_BEFORE.value,
    WorkItemRelationTypes.FINISH_BEFORE.value: WorkItemRelationTypes.FINISH_BEFORE.value,
}


def get_work_item_relation_type(relation_type):
    return RELATION_TYPE_MAP.get(relation_type, relation_type)


def is_timeline_dependency_feature_flagged(
    user_id: str, workspace_slug: str, raise_exception: bool = True
):
    try:
        is_feature_flagged = _validate_feature_flag(
            user_id=user_id,
            workspace_slug=workspace_slug,
            feature_key=FeatureFlagsTypesEnum.TIMELINE_DEPENDENCY.value,
            default_value=False,
        )

        if not is_feature_flagged:
            if raise_exception:
                message = (
                    "Timeline dependency feature flag is not enabled for the workspace"
                )
                error_extensions = {
                    "code": "TIMELINE_DEPENDENCY_FEATURE_FLAG_NOT_ENABLED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)
            return False
        return is_feature_flagged
    except Exception:
        if raise_exception:
            message = "Error checking if timeline dependency feature flag is enabled"
            error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)
        return False


@sync_to_async
def is_timeline_dependency_feature_flagged_async(
    user_id: str, workspace_slug: str, raise_exception: bool = True
):
    return is_timeline_dependency_feature_flagged(
        user_id, workspace_slug, raise_exception
    )
