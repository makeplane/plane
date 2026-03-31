# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
import os
import socket
import ipaddress
from urllib.parse import urlparse

# Third party imports
from rest_framework import serializers

# Allow private/loopback webhook URLs for self-hosted instances.
# When enabled, SSRF protection (private/loopback/reserved/link-local IP
# blocking) is bypassed for webhook URLs.  Only enable this in trusted
# self-hosted environments where webhooks target local services.
ALLOW_PRIVATE_WEBHOOKS = os.environ.get("PLANE_ALLOW_PRIVATE_WEBHOOKS", "0").lower() in ("1", "true", "yes")

if ALLOW_PRIVATE_WEBHOOKS:
    logging.getLogger(__name__).warning(
        "PLANE_ALLOW_PRIVATE_WEBHOOKS is enabled — webhooks can target "
        "private/internal IPs. Only enable this in trusted self-hosted "
        "environments."
    )

# Module imports
from .base import DynamicBaseSerializer
from plane.db.models import Webhook, WebhookLog
from plane.db.models.webhook import validate_domain, validate_schema


def _validate_webhook_url(url, request):
    """Validate a webhook URL: resolve hostname, check IP restrictions, and
    block disallowed domains.

    Raises ``serializers.ValidationError`` on failure.
    """
    hostname = urlparse(url).hostname
    if not hostname:
        raise serializers.ValidationError({"url": "Invalid URL: No hostname found."})

    # Normalize hostname: strip trailing dot (FQDN) and lowercase to
    # prevent bypass via canonical variants like "plane.so." or "Plane.SO".
    hostname = hostname.rstrip(".").lower()

    # Resolve the hostname to IP addresses
    try:
        ip_addresses = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise serializers.ValidationError({"url": "Hostname could not be resolved."})

    if not ip_addresses:
        raise serializers.ValidationError({"url": "No IP addresses found for the hostname."})

    # Block private/loopback/reserved/link-local IPs unless explicitly allowed
    if not ALLOW_PRIVATE_WEBHOOKS:
        for addr in ip_addresses:
            ip = ipaddress.ip_address(addr[4][0])
            if ip.is_private or ip.is_loopback or ip.is_reserved or ip.is_link_local:
                raise serializers.ValidationError({"url": "URL resolves to a blocked IP address."})

    # Additional validation for disallowed domains and their subdomains
    disallowed_domains = ["plane.so"]
    if request:
        request_host = request.get_host().split(":")[0].rstrip(".").lower()
        disallowed_domains.append(request_host)

    if any(hostname == domain or hostname.endswith("." + domain) for domain in disallowed_domains):
        raise serializers.ValidationError({"url": "URL domain or its subdomain is not allowed."})


def _validate_domain_for_webhook(value):
    """Conditionally apply domain validation.

    When ALLOW_PRIVATE_WEBHOOKS is enabled, skip the domain validator so
    that loopback hosts like localhost / 127.0.0.1 are not rejected at the
    field level.  The full URL validation in _validate_webhook_url() still
    enforces disallowed-domain blocking.
    """
    if ALLOW_PRIVATE_WEBHOOKS:
        return
    validate_domain(value)


class WebhookSerializer(DynamicBaseSerializer):
    url = serializers.URLField(validators=[validate_schema, _validate_domain_for_webhook])

    def create(self, validated_data):
        url = validated_data.get("url", None)
        _validate_webhook_url(url, self.context.get("request"))
        return Webhook.objects.create(**validated_data)

    def update(self, instance, validated_data):
        url = validated_data.get("url", None)
        if url:
            _validate_webhook_url(url, self.context.get("request"))
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
