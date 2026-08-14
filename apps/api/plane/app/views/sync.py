# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import status
from rest_framework.response import Response

from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers import SyncEventSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import DeviceWorkspaceCursor, SyncEvent, Workspace

# Replay is capped per request; a client far behind (e.g. offline for a long
# time) should treat a full page as "there may be more" and keep paging with
# the last returned seq, rather than the server building an unbounded response.
MAX_REPLAY_EVENTS = 500


class SyncReplayEndpoint(BaseAPIView):
    """Replay `SyncEvent`s for reconnect/offline catch-up.

    Called both directly by web (which talks to Django already) and by
    apps/live's `/sync` WebSocket controller — using the same user credential
    (session/API token) forwarded from the client, exactly like
    apps/live/src/services/page/* already forwards the browser's cookie back to
    Django for page persistence. No separate service-to-service secret is
    needed: this is a normal per-user, workspace-scoped authenticated read.
    """

    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        try:
            since_seq = int(request.GET.get("since_seq", 0))
        except (TypeError, ValueError):
            return Response({"error": "since_seq must be an integer."}, status=status.HTTP_400_BAD_REQUEST)

        workspace = Workspace.objects.filter(slug=slug).first()
        if workspace is None:
            return Response({"error": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        events = list(
            SyncEvent.objects.filter(workspace=workspace, seq__gt=since_seq)
            .select_related("actor")
            .order_by("seq")[:MAX_REPLAY_EVENTS]
        )

        # A device_id query param lets a resuming client advance its cursor in
        # the same call, rather than a second round-trip after processing —
        # optional because web (no Device row) just uses the response directly.
        device_id = request.GET.get("device_id")
        if device_id and events:
            latest_seq = events[-1].seq
            DeviceWorkspaceCursor.objects.filter(
                device_id=device_id, device__user=request.user, workspace=workspace
            ).update(last_seq=latest_seq)

        return Response(
            {
                "events": SyncEventSerializer(events, many=True).data,
                "has_more": len(events) == MAX_REPLAY_EVENTS,
            },
            status=status.HTTP_200_OK,
        )
