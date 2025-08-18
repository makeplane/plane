from typing import Optional

# Strawberry imports
import strawberry
from strawberry.types import Info
from strawberry.permission import PermissionExtension

# Third-party imports
from asgiref.sync import sync_to_async

# Module imports
from plane.db.models import Device
from plane.graphql.types.device import DeviceInformationType, DeviceInformationEnumType
from plane.graphql.permissions.workspace import IsAuthenticated


@sync_to_async
def all_active_devices_by_device_id(
    user_id, device_id, device_type: DeviceInformationEnumType
):
    return list(
        Device.objects.filter(
            device_id=device_id, device_type=device_type, is_active=True
        ).exclude(user_id=user_id)
    )


@sync_to_async
def get_user_device_information(user, device_id, device_type=DeviceInformationEnumType):
    try:
        return Device.objects.filter(
            user=user, device_id=device_id, device_type=device_type
        ).first()
    except Device.DoesNotExist:
        return None


@sync_to_async
def bulk_update_device_info(devices, fields):
    Device.objects.bulk_update(devices, fields, batch_size=10)


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
        user_id = user.id

        # get all device information by device id and update is_active to False
        active_devices = await all_active_devices_by_device_id(
            user_id, device_id, device_type
        )

        if len(active_devices) > 0:
            for device in active_devices:
                device.is_active = False

            await bulk_update_device_info(active_devices, ["is_active"])

        # if device information is not available then create new device information
        user_device_info = await get_user_device_information(
            user_id, device_id, device_type
        )
        if user_device_info is None:
            device_info = await sync_to_async(Device.objects.create)(
                user=user,
                device_id=device_id,
                device_type=device_type,
                push_token=push_token,
                is_active=True,
            )
            return device_info

        if user_device_info.is_active:
            user_device_info.push_token = push_token
            await sync_to_async(user_device_info.save)()
        else:
            user_device_info.is_active = True
            user_device_info.push_token = push_token
            await sync_to_async(user_device_info.save)()

        return user_device_info
