# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

# Python imports
from urllib.parse import urlparse

# Django imports
from django.conf import settings

# Third party imports
from rest_framework import serializers

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import Webhook, WebhookLog
from plane.db.models.webhook import validate_domain, validate_schema
from plane.utils.ip_address import validate_url


class WebhookSerializer(DynamicBaseSerializer):
    url = serializers.URLField(validators=[validate_schema, validate_domain])

    def _validate_webhook_url(self, url):
        """Validate a webhook URL against SSRF and disallowed domain rules."""
        try:
            validate_url(url, block_private=not settings.IS_SELF_MANAGED)
        except ValueError as e:
            raise serializers.ValidationError({"url": str(e)})

        hostname = (urlparse(url).hostname or "").rstrip(".").lower()
        request = self.context.get("request")
        disallowed_domains = ["plane.so"]
        if request:
            request_host = request.get_host().split(":")[0].rstrip(".").lower()
            disallowed_domains.append(request_host)

        if any(hostname == domain or hostname.endswith("." + domain) for domain in disallowed_domains):
            raise serializers.ValidationError({"url": "URL domain or its subdomain is not allowed."})

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
