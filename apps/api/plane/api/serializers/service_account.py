# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.api.serializers.base import BaseSerializer
from plane.db.models import APIToken
from plane.utils.service_account import DEFAULT_SERVICE_ACCOUNT_ROLE, SERVICE_ACCOUNT_ROLES


class ServiceAccountCreateSerializer(serializers.Serializer):
    """Request body for provisioning a workspace service account."""

    name = serializers.CharField(max_length=255, help_text="Name for the service account (used as the token label)")
    role = serializers.ChoiceField(
        choices=sorted(SERVICE_ACCOUNT_ROLES),
        default=DEFAULT_SERVICE_ACCOUNT_ROLE,
        help_text="Workspace role: admin, member, or guest",
    )
    # Optional caller-chosen identity. username must be globally unique and, like
    # every Plane username, is bounded only by max_length (128); a collision is
    # rejected, never silently mutated. Omitting either falls back to a synthetic
    # username / to `name` for the display name.
    # allow_blank so a "" from a caller is normalized to the synthetic/fallback
    # value (same as omitting it, and identical to the management command), rather
    # than 400-ing where the command would accept it.
    username = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=128,
        help_text="Optional globally-unique username; a synthetic svc_<uuid> is generated when omitted",
    )
    display_name = serializers.CharField(
        required=False,
        allow_null=True,
        allow_blank=True,
        max_length=255,
        help_text="Optional display name shown in the members UI; falls back to name when omitted",
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Optional description stored on the API token",
    )


class ServiceAccountSerializer(serializers.Serializer):
    """Response for a newly provisioned service account.

    ``token`` is the plaintext API key and is returned only once, at creation.
    """

    id = serializers.UUIDField(read_only=True, help_text="Service account user id")
    username = serializers.CharField(read_only=True)
    email = serializers.CharField(read_only=True)
    display_name = serializers.CharField(read_only=True)
    role = serializers.IntegerField(read_only=True, help_text="Workspace role value (20 admin, 15 member, 5 guest)")
    workspace = serializers.UUIDField(read_only=True)
    token = serializers.CharField(read_only=True, help_text="Plaintext API token — shown once")


class ServiceAccountTokenSerializer(BaseSerializer):
    """Read/list view of a service account's API token.

    The secret ``token`` value is intentionally NOT a field here, so it can never
    be exposed by the list endpoint.
    """

    class Meta:
        model = APIToken
        fields = [
            "id",
            "label",
            "description",
            "is_active",
            "is_service",
            "user_type",
            "created_at",
            "updated_at",
            "expired_at",
            "last_used",
        ]
        read_only_fields = fields


class ServiceAccountTokenCreateSerializer(serializers.Serializer):
    """Request body for minting or rotating a service account token."""

    label = serializers.CharField(
        required=False, allow_blank=True, max_length=255, help_text="Optional human-readable token label"
    )
    description = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Optional token description"
    )
    expired_at = serializers.DateTimeField(
        required=False, allow_null=True, default=None, help_text="Optional expiry; the token never expires when omitted"
    )


class ServiceAccountTokenCreatedSerializer(serializers.Serializer):
    """Response for a newly minted/rotated token — includes the value ONCE."""

    id = serializers.UUIDField(read_only=True)
    label = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    expired_at = serializers.DateTimeField(read_only=True, allow_null=True)
    token = serializers.CharField(read_only=True, help_text="Plaintext API token — shown once")
