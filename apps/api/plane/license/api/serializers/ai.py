# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only

from django.utils.text import slugify
from rest_framework import serializers

from plane.license.models import AIModelProfile, AIProviderProfile
from plane.license.utils.encryption import encrypt_data

from .base import BaseSerializer


class AIModelProfileSerializer(BaseSerializer):
    class Meta:
        model = AIModelProfile
        fields = ["id", "model_id", "display_name", "enabled", "capabilities", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AIProviderProfileSerializer(BaseSerializer):
    api_key = serializers.CharField(write_only=True, required=False, allow_blank=True)
    clear_api_key = serializers.BooleanField(write_only=True, required=False, default=False)
    has_api_key = serializers.SerializerMethodField()
    api_key_hint = serializers.SerializerMethodField()
    model_profiles = AIModelProfileSerializer(many=True, read_only=True)

    class Meta:
        model = AIProviderProfile
        fields = [
            "id",
            "name",
            "slug",
            "protocol",
            "base_url",
            "organization_id",
            "project_id",
            "default_model",
            "enabled",
            "is_default",
            "timeout_seconds",
            "max_retries",
            "temperature",
            "top_p",
            "max_output_tokens",
            "model_profiles",
            "last_tested_at",
            "last_test_success",
            "last_test_error_code",
            "has_api_key",
            "api_key_hint",
            "api_key",
            "clear_api_key",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "has_api_key",
            "api_key_hint",
            "last_tested_at",
            "last_test_success",
            "last_test_error_code",
            "created_at",
            "updated_at",
        ]

    def validate_slug(self, value):
        normalized = slugify(value)
        if not normalized:
            raise serializers.ValidationError("A provider slug is required")
        return normalized

    def validate_timeout_seconds(self, value):
        if not 5 <= value <= 120:
            raise serializers.ValidationError("Timeout must be between 5 and 120 seconds")
        return value

    def validate_max_retries(self, value):
        if not 0 <= value <= 3:
            raise serializers.ValidationError("Retries must be between 0 and 3")
        return value

    def validate_temperature(self, value):
        if value is not None and not 0 <= value <= 2:
            raise serializers.ValidationError("Temperature must be between 0 and 2")
        return value

    def validate_top_p(self, value):
        if value is not None and not 0 <= value <= 1:
            raise serializers.ValidationError("Top p must be between 0 and 1")
        return value

    def validate_base_url(self, value):
        from plane.app.views.external.ai_provider import validate_provider_base_url

        return validate_provider_base_url(value)

    def get_has_api_key(self, obj):
        return bool(obj.api_key_encrypted)

    def get_api_key_hint(self, obj):
        # We intentionally do not decrypt a secret during serialization. A
        # separate non-secret hint can be persisted in a future migration.
        return ""

    def create(self, validated_data):
        api_key = validated_data.pop("api_key", "")
        validated_data.pop("clear_api_key", None)
        if api_key:
            validated_data["api_key_encrypted"] = encrypt_data(api_key)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        api_key = validated_data.pop("api_key", None)
        clear_api_key = validated_data.pop("clear_api_key", False)
        if clear_api_key:
            instance.api_key_encrypted = ""
        elif api_key:
            instance.api_key_encrypted = encrypt_data(api_key)
        return super().update(instance, validated_data)


class AIProviderConnectionTestSerializer(serializers.Serializer):
    """Provider fields for probing a configuration that has not been saved yet.

    Same provider fields as the create payload, minus the ones that only mean
    something once a row exists (name, slug, enabled, is_default).
    """

    base_url = serializers.CharField(max_length=500)
    api_key = serializers.CharField(required=False, allow_blank=True, default="")
    model = serializers.CharField(required=False, allow_blank=True, default="")
    default_model = serializers.CharField(required=False, allow_blank=True, default="")
    organization_id = serializers.CharField(required=False, allow_blank=True, default="")
    project_id = serializers.CharField(required=False, allow_blank=True, default="")
    timeout_seconds = serializers.IntegerField(required=False, default=30)
    max_retries = serializers.IntegerField(required=False, default=2)
    # Set when the form is editing a saved provider: a blank api_key then means
    # "keep the stored secret", so the probe has to use that secret.
    provider_id = serializers.UUIDField(required=False, allow_null=True, default=None)

    def validate_base_url(self, value):
        from plane.app.views.external.ai_provider import validate_provider_base_url

        return validate_provider_base_url(value)

    def validate_timeout_seconds(self, value):
        if not 5 <= value <= 120:
            raise serializers.ValidationError("Timeout must be between 5 and 120 seconds")
        return value

    def validate_max_retries(self, value):
        if not 0 <= value <= 3:
            raise serializers.ValidationError("Retries must be between 0 and 3")
        return value

    def validate(self, attrs):
        if not (attrs.get("model") or attrs.get("default_model")):
            raise serializers.ValidationError({"model": "A model is required"})
        return attrs
