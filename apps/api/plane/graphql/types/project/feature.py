# Strawberry imports
import strawberry


@strawberry.type
class ProjectFeatureType:
    # Project
    module_view: bool
    cycle_view: bool
    issue_views_view: bool
    page_view: bool
    intake_view: bool
    guest_view_all_features: bool
    # Project features
    is_project_updates_enabled: bool
    is_epic_enabled: bool
    is_workflow_enabled: bool
