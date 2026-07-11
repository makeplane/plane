# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import logging
from urllib.parse import urlparse

# Third party imports
from rest_framework import serializers

# Django imports
from django.conf import settings

# Module imports
from plane.utils.ip_address import validate_url

logger = logging.getLogger(__name__)


def validate_webhook_url(url, request=None):
    """Validate a webhook URL against SSRF and disallowed-domain rules.

    Shared by the internal app API and the public token API webhook
    serializers so the SSRF/URL guards can never drift between the two
    surfaces. Resolves the host and rejects private/internal targets (unless
    explicitly allow-listed via ``WEBHOOK_ALLOWED_IPS``/``WEBHOOK_ALLOWED_HOSTS``),
    then rejects hosts matching ``WEBHOOK_DISALLOWED_DOMAINS`` (and the request
    host, as a loop-back guard).

    Args:
        url: The webhook target URL to validate.
        request: The active request, used to append the request host to the
            disallowed-domain list (loop-back guard). Optional.

    Raises:
        rest_framework.serializers.ValidationError: If the URL resolves to a
            blocked/internal target or matches a disallowed domain.
    """
    try:
        validate_url(
            url,
            allowed_ips=settings.WEBHOOK_ALLOWED_IPS,
            allowed_hosts=settings.WEBHOOK_ALLOWED_HOSTS,
        )
    except ValueError as e:
        logger.warning("Webhook URL validation failed for %s: %s", url, e)
        raise serializers.ValidationError({"url": "Invalid or disallowed webhook URL."})

    hostname = (urlparse(url).hostname or "").rstrip(".").lower()

    # Hosts explicitly trusted via WEBHOOK_ALLOWED_HOSTS bypass the
    # disallowed-domain check — they're already trusted for SSRF, so the
    # loop-back guard would only get in the way of legitimate sibling services
    # that share a parent domain with Plane.
    if hostname in settings.WEBHOOK_ALLOWED_HOSTS:
        return

    disallowed_domains = list(settings.WEBHOOK_DISALLOWED_DOMAINS)
    if request:
        # Parse via urlparse (prefixing "//" so the host is read as a netloc)
        # so a bracketed IPv6 literal with a port (e.g. "[::1]:8000") yields the
        # bare host "::1" instead of the "[" that a naive split(":")[0] returns.
        request_host = (urlparse("//" + request.get_host()).hostname or "").rstrip(".").lower()
        if request_host:
            disallowed_domains.append(request_host)

    if any(hostname == domain or hostname.endswith("." + domain) for domain in disallowed_domains):
        raise serializers.ValidationError({"url": "URL domain or its subdomain is not allowed."})
