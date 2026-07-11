# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer
from plane.db.models import Webhook
from plane.db.models.webhook import validate_domain, validate_schema
from plane.utils.webhook import validate_webhook_url


class WebhookSerializer(BaseSerializer):
    """Public token-API serializer for workspace webhooks.

    Mirrors the internal app-API webhook serializer: enforces the schema/domain
    validators plus the shared SSRF/disallowed-domain guard, and keeps
    ``secret_key`` server-generated (read-only) so it is returned on create but
    never accepted as input.
    """

    url = serializers.URLField(validators=[validate_schema, validate_domain])

    def _validate_webhook_url(self, url):
        """Validate a webhook URL against SSRF and disallowed-domain rules.

        Thin adapter binding the serializer's request context to the shared
        ``validate_webhook_url`` guard, mirroring the internal app-API
        serializer so the SSRF/URL checks cannot drift between the two.
        """
        validate_webhook_url(url, self.context.get("request"))

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
        fields = [
            "id",
            "url",
            "is_active",
            "secret_key",
            "project",
            "issue",
            "module",
            "cycle",
            "issue_comment",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "workspace",
            "secret_key",
            "created_at",
            "updated_at",
        ]
