# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Django imports
from django.utils import timezone

# Third party imports
from rest_framework import serializers
from rest_framework.fields import empty
from rest_framework.utils import html

# Module imports
from plane.api.serializers.base import BaseSerializer
from plane.db.models import APIToken
from plane.utils.service_account import DEFAULT_SERVICE_ACCOUNT_ROLE, SERVICE_ACCOUNT_ROLES


class OmittableDateTimeField(serializers.DateTimeField):
    """A DateTimeField where an empty HTML form value means "omitted", not null.

    DRF maps an empty string from a form/multipart body to ``None`` when
    ``allow_null`` is set, which is indistinguishable from an explicit JSON
    ``null``. Rotation needs that distinction (omitted → inherit the source
    token's expiry; null → never expire), so an empty HTML value is treated as
    absent instead — the key is then omitted from ``validated_data``.
    """

    def get_value(self, dictionary):
        """Return ``empty`` for a blank HTML value so it reads as omitted, not null."""
        if html.is_html_input(dictionary) and dictionary.get(self.field_name, "") == "":
            return empty
        return super().get_value(dictionary)


def _validate_future_expiry(value):
    """Reject a non-null expiry that is not in the future (a DOA credential)."""
    if value is not None and value <= timezone.now():
        raise serializers.ValidationError("expired_at must be in the future.")
    return value


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
    # No `default` so an omitted description is absent from validated_data (→ the
    # helper applies its generated default), while an explicit "" is preserved as
    # a deliberate empty description.
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Optional description stored on the API token; a default is generated when omitted",
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
    """Request body for minting a service account token."""

    label = serializers.CharField(
        required=False, allow_blank=True, max_length=255, help_text="Optional human-readable token label"
    )
    description = serializers.CharField(
        required=False, allow_blank=True, default="", help_text="Optional token description"
    )
    expired_at = serializers.DateTimeField(
        required=False,
        allow_null=True,
        validators=[_validate_future_expiry],
        help_text="Optional expiry; the token never expires when omitted",
    )


class ServiceAccountTokenRotateSerializer(serializers.Serializer):
    """Request body for rotating a service account token.

    Only the expiry is caller-settable — the replacement inherits the source
    token's label and description. ``expired_at`` uses :class:`OmittableDateTimeField`
    and declares no ``default``, so DRF omits the key from ``validated_data`` when
    the caller omits the field (or sends an empty form value). That lets rotation
    tell "not supplied" (inherit the source token's expiry) apart from an explicit
    ``null`` (never expire).
    """

    expired_at = OmittableDateTimeField(
        required=False,
        allow_null=True,
        validators=[_validate_future_expiry],
        help_text=(
            "Expiry for the replacement token. Omit to inherit the source token's expiry; "
            "pass null to deliberately make the replacement never expire. A supplied timestamp "
            "must be in the future."
        ),
    )


class ServiceAccountTokenCreatedSerializer(serializers.Serializer):
    """Response for a newly minted/rotated token — includes the value ONCE."""

    id = serializers.UUIDField(read_only=True)
    label = serializers.CharField(read_only=True)
    is_active = serializers.BooleanField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)
    expired_at = serializers.DateTimeField(read_only=True, allow_null=True)
    token = serializers.CharField(read_only=True, help_text="Plaintext API token — shown once")
