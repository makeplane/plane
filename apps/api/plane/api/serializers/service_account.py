# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.utils.service_account import DEFAULT_SERVICE_ACCOUNT_ROLE, SERVICE_ACCOUNT_ROLES


class ServiceAccountCreateSerializer(serializers.Serializer):
    """Request body for provisioning a workspace service account."""

    name = serializers.CharField(max_length=255, help_text="Display name for the service account")
    role = serializers.ChoiceField(
        choices=sorted(SERVICE_ACCOUNT_ROLES),
        default=DEFAULT_SERVICE_ACCOUNT_ROLE,
        help_text="Workspace role: admin, member, or guest",
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
