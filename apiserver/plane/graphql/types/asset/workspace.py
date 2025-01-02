# Python imports
from enum import Enum

# Strawberry imports
import strawberry


@strawberry.enum
class WorkspaceAssetEnumType(Enum):
    WORKSPACE_LOGO = "WORKSPACE_LOGO"
    PROJECT_COVER = "PROJECT_COVER"
    PAGE_DESCRIPTION = "PAGE_DESCRIPTION"

    def __str__(self):
        return self.value
