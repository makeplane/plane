# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import Webhook, WebhookLog
from plane.db.models.webhook import validate_domain, validate_schema
from plane.utils.webhook import validate_webhook_url


class WebhookSerializer(DynamicBaseSerializer):
    url = serializers.URLField(validators=[validate_schema, validate_domain])

    def _validate_webhook_url(self, url):
        """Validate a webhook URL against SSRF and disallowed-domain rules.

        Thin adapter binding the serializer's request context to the shared
        ``validate_webhook_url`` guard so the SSRF/URL checks live in a single
        place shared with the public token API.
        """
        validate_webhook_url(url, self.context.get("request"))

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # secret_key is the HMAC signing secret. It is only revealed on creation
        # and secret regeneration (opt-in via the show_secret_key context flag),
        # never on list/retrieve/update.
        #
        # This context flag is the enforcement point for secret_key; the fields=
        # allowlists in views/webhook/base.py are defence in depth.
        if not self.context.get("show_secret_key"):
            data.pop("secret_key", None)
        return data

    def create(self, validated_data):
        url = validated_data.get("url", None)
        self._validate_webhook_url(url)
        return Webhook.objects.create(**validated_data)

    def update(self, instance, validated_data):
        url = validated_data.get("url", None)
        if url:
            self._validate_webhook_url(url)
        return super().update(instance, validated_data)

    class Meta:
        model = Webhook
        fields = "__all__"
        read_only_fields = ["workspace", "secret_key", "deleted_at"]


class WebhookLogSerializer(DynamicBaseSerializer):
    class Meta:
        model = WebhookLog
        fields = "__all__"
        read_only_fields = ["workspace", "webhook"]
