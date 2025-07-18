# python imports
from typing import Optional

# Third-party library imports
import strawberry


@strawberry.type
class IssueShortenedMetaInfo:
    project: strawberry.ID
    work_item: strawberry.ID
    is_epic: Optional[bool] = False
