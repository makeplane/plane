# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from .base import BaseSerializer
from plane.db.models import APIToken, APIActivityLog
from plane.db.models.api import API_TOKEN_SCOPES
from rest_framework import serializers
from django.utils import timezone


class APITokenSerializer(BaseSerializer):
    class Meta:
        model = APIToken
        fields = "__all__"
        read_only_fields = [
            "token",
            "expired_at",
            "created_at",
            "updated_at",
            "workspace",
            "user",
            "is_active",
            "last_used",
            "user_type",
            # Fixed at creation; widening an issued token's access needs a new token
            "scopes",
        ]


class APITokenCreateSerializer(BaseSerializer):
    """Validates the fields a user may set when creating an API token."""

    scopes = serializers.ListField(
        child=serializers.ChoiceField(choices=API_TOKEN_SCOPES),
        allow_empty=False,
        required=False,
        help_text="Any of read, write and delete. Defaults to all three.",
    )

    class Meta:
        model = APIToken
        fields = ["label", "description", "expired_at", "scopes"]
        # The endpoint has always accepted an empty label
        extra_kwargs = {"label": {"allow_blank": True}}

    def validate_scopes(self, value):
        # Drop duplicates and store in a stable order
        return [scope for scope in API_TOKEN_SCOPES if scope in value]


class APITokenReadSerializer(BaseSerializer):
    is_active = serializers.SerializerMethodField()

    class Meta:
        model = APIToken
        exclude = ("token",)

    def get_is_active(self, obj: APIToken) -> bool:
        if obj.expired_at is None:
            return True
        return timezone.now() < obj.expired_at


class APIActivityLogSerializer(BaseSerializer):
    class Meta:
        model = APIActivityLog
        fields = "__all__"
