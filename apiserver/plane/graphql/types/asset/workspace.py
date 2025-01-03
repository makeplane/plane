# Python imports
from enum import Enum

# Strawberry imports
import strawberry

# module imports
from plane.graphql.types.asset.base import FileAssetEntityType


@strawberry.enum
class WorkspaceAssetEnumType(Enum):
    WORKSPACE_LOGO = FileAssetEntityType.WORKSPACE_LOGO.value
    PROJECT_COVER = FileAssetEntityType.PROJECT_COVER.value
    PAGE_DESCRIPTION = FileAssetEntityType.PAGE_DESCRIPTION.value

    def __str__(self):
        return self.value
