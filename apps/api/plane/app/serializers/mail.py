# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from rest_framework import serializers

from plane.app.serializers.base import BaseSerializer
from plane.mail.models import (
    MailFilterRule,
    MailForwarding,
    MailLabel,
    MailPreference,
    MailSavedSearch,
    MailSignature,
    MailTemplate,
)


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
