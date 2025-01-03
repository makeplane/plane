# Python imports
from enum import Enum

# Strawberry imports
import strawberry


@strawberry.enum
class UserAssetEnumType(Enum):
    USER_AVATAR = "USER_AVATAR"
    USER_COVER = "USER_COVER"

    def __str__(self):
        return self.value
