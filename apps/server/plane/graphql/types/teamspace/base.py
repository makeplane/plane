from typing import Optional

# Django Imports
from django.db.models import Q

# strawberry imports
import strawberry


@strawberry.type
class TeamspaceHelperObjectType:
    id: Optional[str]
    project_ids: Optional[list[str]]


@strawberry.type
class TeamspaceHelperType:
    is_teamspace_enabled: bool
    is_teamspace_feature_flagged: bool
    query: Q
    teamspace_ids: Optional[list[str]]
    teamspace_project_ids: Optional[list[str]]
    teamspaces: Optional[list[TeamspaceHelperObjectType]]
