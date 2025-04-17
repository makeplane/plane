# Third party imports
from enum import Enum

from plane.ee.models.workspace import WorkspaceFeature


class WorkspaceFeatureContext(Enum):
    # Workspace level project states
    IS_PROJECT_GROUPING_ENABLED = "is_project_grouping_enabled"
    IS_CUSTOMER_ENABLED = "is_customer_enabled"

def check_workspace_feature(slug, feature: WorkspaceFeatureContext):
    # Dynamically build the filter using the feature's value
    filter_kwargs = {"workspace__slug": slug, feature.value: True}
    is_workspace_feature_enabled = WorkspaceFeature.objects.filter(
        **filter_kwargs
    ).exists()

    return is_workspace_feature_enabled
