# Python imports
from enum import Enum

# Strawberry imports
import strawberry

# module imports
from plane.graphql.types.asset.base import FileAssetEntityType


@strawberry.enum
class ProjectAssetEnumType(Enum):
    PROJECT_COVER = FileAssetEntityType.PROJECT_COVER.value
    PAGE_DESCRIPTION = FileAssetEntityType.PAGE_DESCRIPTION.value
    ISSUE_DESCRIPTION = FileAssetEntityType.ISSUE_DESCRIPTION.value
    DRAFT_ISSUE_DESCRIPTION = FileAssetEntityType.DRAFT_ISSUE_DESCRIPTION.value
    COMMENT_DESCRIPTION = FileAssetEntityType.COMMENT_DESCRIPTION.value
    ISSUE_ATTACHMENT = FileAssetEntityType.ISSUE_ATTACHMENT.value
    DRAFT_ISSUE_ATTACHMENT = FileAssetEntityType.DRAFT_ISSUE_ATTACHMENT.value

    def __str__(self):
        return self.value
