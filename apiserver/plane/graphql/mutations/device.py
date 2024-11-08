from typing import Optional

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.db.models import Device
from plane.graphql.types.device import (
    DeviceInformationType,
    DeviceInformationEnumType,
)
from plane.graphql.permissions.workspace import IsAuthenticated


@sync_to_async
def get_device_information(
    user, device_id, device_type=DeviceInformationEnumType
):
    return Device.objects.filter(
        user=user,
        device_id=device_id,
        device_type=device_type,
    ).first()


# updating notification token in user account
@strawberry.type
class DeviceInformationMutation:
    @strawberry.mutation(
        extensions=[PermissionExtension(permissions=[IsAuthenticated()])]
    )
    async def device_information(
        self,
        info: Info,
        device_id: str,
        device_type: DeviceInformationEnumType,
        push_token: str,
        is_active: Optional[bool] = True,
    ) -> DeviceInformationType:
        user = info.context.user
        device_details = await get_device_information(
            user, device_id, device_type
        )

        if not device_details:
            device_info = await sync_to_async(Device.objects.create)(
                user=user,
                device_id=device_id,
                device_type=device_type,
                push_token=push_token,
                is_active=is_active,
            )
            return device_info

        device_details.push_token = push_token
        await sync_to_async(device_details.save)()
        return device_details
