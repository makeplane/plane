# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.mail.models import (
    MailFilterRule,
    MailForwarding,
    MailLabel,
    Mailbox,
    MailPreference,
    MailSavedSearch,
    MailSignature,
    MailTemplate,
)


LOCAL_PART_ALLOWED_CHARS = set("abcdefghijklmnopqrstuvwxyz0123456789._-")


class MailboxSerializer(serializers.ModelSerializer):
    domain = serializers.CharField(source="domain.domain", read_only=True)
    owner_id = serializers.UUIDField(read_only=True)

    class Meta:
        model = Mailbox
        fields = ("id", "email", "local_part", "domain", "quota_mb", "owner_id")


class MailAccountCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    local_part = serializers.CharField(required=False, allow_blank=True, max_length=64)
    domain = serializers.CharField(required=False, allow_blank=True, max_length=255)
    password = serializers.CharField(write_only=True, min_length=8, max_length=256, trim_whitespace=False)

    def validate(self, attrs):
        default_domain = (self.context.get("default_domain") or "").strip().lower().rstrip(".")
        email = (attrs.get("email") or "").strip().lower()
        local_part = (attrs.get("local_part") or "").strip().lower()
        domain = (attrs.get("domain") or default_domain).strip().lower().rstrip(".")

        if email:
            local_part, _, domain_from_email = email.partition("@")
            domain = domain_from_email or domain

        if not local_part or not domain:
            raise serializers.ValidationError({"email": "A mailbox address is required."})

        if local_part.startswith((".", "-", "_")) or local_part.endswith((".", "-", "_")):
            raise serializers.ValidationError({"local_part": "Mailbox name cannot start or end with a separator."})

        if ".." in local_part or not set(local_part).issubset(LOCAL_PART_ALLOWED_CHARS):
            raise serializers.ValidationError({"local_part": "Use lowercase letters, numbers, dots, dashes, or underscores."})

        if "." not in domain or any(part == "" for part in domain.split(".")):
            raise serializers.ValidationError({"domain": "A valid mail domain is required."})

        if default_domain and domain != default_domain:
            raise serializers.ValidationError({"domain": "Use the instance mail domain."})

        attrs["local_part"] = local_part
        attrs["domain"] = domain
        attrs["email"] = f"{local_part}@{domain}"
        return attrs


class MailAccountLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate_email(self, value):
        return value.strip().lower()


class ScopedMailModelSerializer(BaseSerializer):
    class Meta:
        fields = "__all__"
        read_only_fields = (
            "id",
            "mailbox",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "deleted_at",
        )


class MailSignatureSerializer(ScopedMailModelSerializer):
    class Meta(ScopedMailModelSerializer.Meta):
        model = MailSignature


class MailTemplateSerializer(ScopedMailModelSerializer):
    class Meta(ScopedMailModelSerializer.Meta):
        model = MailTemplate


class MailFilterRuleSerializer(ScopedMailModelSerializer):
    class Meta(ScopedMailModelSerializer.Meta):
        model = MailFilterRule


class MailLabelSerializer(ScopedMailModelSerializer):
    class Meta(ScopedMailModelSerializer.Meta):
        model = MailLabel


class MailSavedSearchSerializer(ScopedMailModelSerializer):
    class Meta(ScopedMailModelSerializer.Meta):
        model = MailSavedSearch


class MailForwardingSerializer(ScopedMailModelSerializer):
    class Meta(ScopedMailModelSerializer.Meta):
        model = MailForwarding


class MailPreferenceSerializer(ScopedMailModelSerializer):
    default_signature = serializers.PrimaryKeyRelatedField(
        queryset=MailSignature.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta(ScopedMailModelSerializer.Meta):
        model = MailPreference
