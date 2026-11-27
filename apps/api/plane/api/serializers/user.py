# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

# Module imports
from plane.db.models import User, WorkspaceMember
from plane.utils.permissions import ROLE

from .base import BaseSerializer


def is_workspace_guest(user, slug):
    """Workspace guests do not get other users' email addresses, as in the web app's
    workspace member list. Non-members count as guests."""
    return not WorkspaceMember.objects.filter(
        workspace__slug=slug, member=user, is_active=True, role__gt=ROLE.GUEST.value
    ).exists()


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

    def _can_see_emails(self, instance):
        """Fail closed: needs `context["request"]`, or `context["include_email"]` for
        callers with no request (webhook payloads)."""
        if self.context.get("include_email"):
            return True
        request = self.context.get("request")
        if request is None or not request.user.is_authenticated:
            return False
        if instance.pk == request.user.pk:
            return True
        # Looked up once per request, not per serialized user.
        if not hasattr(request, "_can_see_user_emails"):
            slug = request.resolver_match.kwargs.get("slug") if request.resolver_match else None
            request._can_see_user_emails = bool(slug) and not is_workspace_guest(request.user, slug)
        return request._can_see_user_emails

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if not self._can_see_emails(instance):
            data.pop("email", None)
        return data
