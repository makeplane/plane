# strawberry imports
from enum import Enum

import strawberry
import strawberry_django

# Module Imports
from plane.db.models import Device


@strawberry.enum
class DeviceInformationEnumType(Enum):
    ANDROID = "ANDROID"
    IOS = "IOS"

    def __str__(self):
        return self.value


@strawberry_django.type(Device)
class DeviceInformationType:
    user: str
    device_id: str
    device_type: DeviceInformationEnumType
    push_token: str
    is_active: bool

    @strawberry.field
    def user(self) -> int:
        return self.user_id
