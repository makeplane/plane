# Python imports
from enum import Enum

# Strawberry imports
import strawberry

# module imports
from plane.graphql.types.asset.base import FileAssetEntityType


@strawberry.enum
class UserAssetEnumType(Enum):
    USER_AVATAR = FileAssetEntityType.USER_AVATAR.value
    USER_COVER = FileAssetEntityType.USER_COVER.value

    def __str__(self):
        return self.value
