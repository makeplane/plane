# python imports
from typing import Optional

# Strawberry imports
import strawberry


@strawberry.type
class UserProjectRolesType:
    project_id: str
    role: Optional[int]
    project_role: Optional[int]
    teamspace_role: Optional[int]
