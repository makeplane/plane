# Python imports
from enum import Enum

# Strawberry imports
import strawberry


@strawberry.enum
class ProjectAssetEnumType(Enum):
    PROJECT_COVER = "PROJECT_COVER"
    ISSUE_ATTACHMENT = "ISSUE_ATTACHMENT"
    ISSUE_DESCRIPTION = "ISSUE_DESCRIPTION"
    PAGE_DESCRIPTION = "PAGE_DESCRIPTION"
    COMMENT_DESCRIPTION = "COMMENT_DESCRIPTION"
    DRAFT_ISSUE_DESCRIPTION = "DRAFT_ISSUE_DESCRIPTION"

    def __str__(self):
        return self.value
