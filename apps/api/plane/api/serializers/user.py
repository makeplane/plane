# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from contextvars import ContextVar

from rest_framework import serializers

# Module imports
from plane.db.models import User, WorkspaceMember
from plane.utils.permissions import ROLE

from .base import BaseSerializer

# Id of the calling workspace guest while serializing a request, else None.
_guest_viewer_id = ContextVar("guest_viewer_id", default=None)


def is_workspace_guest(user, slug):
    """Workspace guests do not get other users' email addresses, as in the web app's
    workspace member list."""
    return not WorkspaceMember.objects.filter(
        workspace__slug=slug, member=user, is_active=True, role__gt=ROLE.GUEST.value
    ).exists()


def hide_emails_from_guest(request, slug):
    """Called per request: users expanded for a guest are serialized without email."""
    guest = bool(slug and request.GET.get("expand")) and is_workspace_guest(request.user, slug)
    _guest_viewer_id.set(request.user.id if guest else None)


class UserLiteSerializer(BaseSerializer):
    """
    Lightweight user serializer for minimal data transfer.

    Provides essential user information including names, avatar, and contact details
    optimized for member lists, assignee displays, and user references.
    """

    avatar_url = serializers.CharField(
        help_text="Avatar URL",
        read_only=True,
    )

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "avatar",
            "avatar_url",
            "display_name",
            "email",
        ]
        read_only_fields = fields

    def to_representation(self, instance):
        data = super().to_representation(instance)
        viewer_id = _guest_viewer_id.get()
        if viewer_id and instance.pk != viewer_id:
            data.pop("email", None)
        return data
