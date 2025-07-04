# Strawberry imports
import strawberry


@strawberry.type
class WorkspaceFeatureType:
    is_project_grouping_enabled: bool
    is_initiative_enabled: bool
    is_teams_enabled: bool
    is_customer_enabled: bool
