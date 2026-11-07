# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from plane.license.models import AgentDefinition, agent_permission_rank, validate_agent_env
from plane.license.utils.encryption import EncryptionError
from .base import BaseSerializer

# Placeholder returned in place of every env value. Secrets are write-only.
AGENT_ENV_MASK = "********"


def _field_default(name):
    return AgentDefinition._meta.get_field(name).default


class AgentDefinitionSerializer(BaseSerializer):
    """Admin serializer for ``AgentDefinition``.

    Reads return ``env`` as ``{KEY: "********"}``; values are never sent back.

    Writes take ``env`` as the complete desired set of variables:

    - ``env`` omitted: the stored env is left untouched.
    - ``env`` given: it replaces the stored env. Keys left out are removed.
      A value equal to the mask keeps the stored value for that key, so a client
      can send back the masked object it read, with only the values it changed.
    - The mask is rejected for a key that has no stored value (including on create).
    """

    env = serializers.JSONField(required=False, write_only=True)

    class Meta:
        model = AgentDefinition
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "adapter",
            "env",
            "default_permission_level",
            "max_permission_level",
            "attach_plane_mcp",
            "is_enabled",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_env(self, value):
        errors = validate_agent_env(value)
        if errors:
            raise serializers.ValidationError(errors)
        return value

    def validate(self, attrs):
        default_level = attrs.get(
            "default_permission_level",
            getattr(self.instance, "default_permission_level", _field_default("default_permission_level")),
        )
        max_level = attrs.get(
            "max_permission_level",
            getattr(self.instance, "max_permission_level", _field_default("max_permission_level")),
        )
        if agent_permission_rank(default_level) > agent_permission_rank(max_level):
            raise serializers.ValidationError(
                {"default_permission_level": "Default permission level cannot exceed the maximum permission level."}
            )

        if "env" in attrs:
            attrs["env"] = self._resolve_masked_env(attrs["env"])
        return attrs

    def _resolve_masked_env(self, incoming):
        masked_keys = [key for key, value in incoming.items() if value == AGENT_ENV_MASK]
        if not masked_keys:
            return incoming

        stored = {}
        if self.instance is not None:
            try:
                stored = self.instance.get_env()
            except EncryptionError:
                raise serializers.ValidationError(
                    {"env": "The stored env cannot be decrypted. Re-enter every value instead of the mask."}
                )

        unknown = [key for key in masked_keys if key not in stored]
        if unknown:
            raise serializers.ValidationError(
                {"env": f"No stored value to keep for: {', '.join(sorted(unknown))}. Provide a real value."}
            )
        return {key: (stored[key] if value == AGENT_ENV_MASK else value) for key, value in incoming.items()}

    def create(self, validated_data):
        env = validated_data.pop("env", {})
        agent = AgentDefinition(**validated_data)
        agent.set_env(env)
        agent.save()
        return agent

    def update(self, instance, validated_data):
        has_env = "env" in validated_data
        env = validated_data.pop("env", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if has_env:
            instance.set_env(env)
        instance.save()
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data["env"] = {key: AGENT_ENV_MASK for key in sorted(instance.get_env())}
            data["env_decryption_failed"] = False
        except EncryptionError:
            data["env"] = {}
            data["env_decryption_failed"] = True
        return data
