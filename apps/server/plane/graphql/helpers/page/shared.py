# Third Party Imports
from asgiref.sync import sync_to_async

# Strawberry Imports
from strawberry.exceptions import GraphQLError

# Module Imports
from plane.graphql.types.feature_flag import FeatureFlagsTypesEnum
from plane.graphql.utils.feature_flag import _validate_feature_flag


def is_shared_page_feature_flagged(
    user_id: str, workspace_slug: str, raise_exception: bool = True
):
    try:
        is_feature_flagged = _validate_feature_flag(
            user_id=user_id,
            workspace_slug=workspace_slug,
            feature_key=FeatureFlagsTypesEnum.SHARED_PAGES.value,
            default_value=False,
        )

        if not is_feature_flagged:
            if raise_exception:
                message = "Shared pages feature flag is not enabled for the workspace"
                error_extensions = {
                    "code": "SHARED_PAGES_FEATURE_FLAG_NOT_ENABLED",
                    "statusCode": 400,
                }
                raise GraphQLError(message, extensions=error_extensions)
            return False
        return is_feature_flagged
    except Exception:
        if raise_exception:
            message = "Error checking if shared pages feature flag is enabled"
            error_extensions = {"code": "SOMETHING_WENT_WRONG", "statusCode": 400}
            raise GraphQLError(message, extensions=error_extensions)
        return False


@sync_to_async
def is_shared_page_feature_flagged_async(
    user_id: str, workspace_slug: str, raise_exception: bool = True
):
    return is_shared_page_feature_flagged(
        user_id=user_id, workspace_slug=workspace_slug, raise_exception=raise_exception
    )
