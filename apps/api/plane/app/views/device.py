# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.serializers import DeviceSerializer
from plane.app.views.base import BaseViewSet
from plane.db.models import Device, DeviceWorkspaceCursor, WorkspaceMember, WorkspaceSyncSequence


class DeviceViewSet(BaseViewSet):
    """Register/unregister an iOS/macOS device for APNs-based sync wakeups.

    A device is upserted by (user, apns_token) — re-registering the same token
    (e.g. app relaunch) just refreshes `last_active_at`/`apns_env` rather than
    creating duplicates, which keeps `apns_push_task` from double-notifying the
    same physical device under two Device rows.
    """

    serializer_class = DeviceSerializer
    model = Device

    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def create(self, request):
        serializer = DeviceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        device, _ = Device.objects.update_or_create(
            user=request.user,
            apns_token=serializer.validated_data["apns_token"],
            defaults={
                "platform": serializer.validated_data["platform"],
                "apns_env": serializer.validated_data.get("apns_env", Device.ApnsEnvironment.PRODUCTION),
            },
        )

        # Seed a cursor (at the workspace's current seq, not 0) for every
        # workspace the user belongs to, so a freshly-registered device isn't
        # immediately treated as "behind" and APNs-pushed for the entire
        # pre-registration event history — it should only be woken for events
        # from this point forward until it does its first `/sync` connect,
        # which then replays and advances the cursor normally.
        workspace_ids = WorkspaceMember.objects.filter(
            member=request.user, is_active=True
        ).values_list("workspace_id", flat=True)
        for workspace_id in workspace_ids:
            current_seq = getattr(
                WorkspaceSyncSequence.objects.filter(workspace_id=workspace_id).first(), "last_seq", 0
            )
            DeviceWorkspaceCursor.objects.get_or_create(
                device=device, workspace_id=workspace_id, defaults={"last_seq": current_seq}
            )

        return Response(DeviceSerializer(device).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, pk=None):
        Device.objects.filter(pk=pk, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
