# Third party imports
from typing import Optional

# Strawberry imports
import strawberry_django

# Module imports
from plane.db.models import WorkspaceMemberInvite
from plane.graphql.types.workspace import WorkspaceType


@strawberry_django.type(WorkspaceMemberInvite)
class WorkspaceInviteType:
    id: Optional[str]
    email: Optional[str]
    accepted: Optional[bool]
    token: Optional[str]
    message: Optional[str]
    responded_at: Optional[str]
    role: Optional[str]

    workspace: Optional[WorkspaceType]
