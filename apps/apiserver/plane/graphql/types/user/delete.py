# Python imports
from dataclasses import dataclass, field
from typing import Optional

# Strawberry imports
import strawberry

# Module imports
from plane.graphql.types.workspace import WorkspaceType


@strawberry.type
class UserDeleteType:
    can_delete: bool
    workspaces: Optional[list[WorkspaceType]]


@strawberry.input
@dataclass
class UserDeleteInputType:
    reason: Optional[str] = field(default_factory=lambda: None)
