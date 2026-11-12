# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from functools import lru_cache
from urllib.parse import urlsplit

from django.conf import settings
from rest_framework.authentication import SessionAuthentication
from rest_framework.exceptions import PermissionDenied

SAFE_METHODS = ("GET", "HEAD", "OPTIONS", "TRACE")


def normalize_origin(url):
    """Return scheme://host[:port] for a URL, or None if it has no scheme or host."""
    try:
        parts = urlsplit(url.strip())
    except ValueError:
        return None
    if not parts.scheme or not parts.netloc:
        return None
    return f"{parts.scheme}://{parts.netloc}".lower()


@lru_cache(maxsize=None)
def allowed_origins():
    """Origins of Plane's own apps: the configured base URLs, CORS origins and CSRF trusted origins."""
    urls = [
        getattr(settings, name, None)
        for name in ("WEB_URL", "APP_BASE_URL", "ADMIN_BASE_URL", "SPACE_BASE_URL", "LIVE_BASE_URL")
    ]
    urls += getattr(settings, "CORS_ALLOWED_ORIGINS", [])
    urls += getattr(settings, "CSRF_TRUSTED_ORIGINS", [])
    return frozenset(filter(None, (normalize_origin(url) for url in urls if url)))


def is_allowed_origin(request):
    origin = request.META.get("HTTP_ORIGIN")
    if origin is None:
        # Browsers attach Origin to unsafe methods; requests without it come
        # from non-browser clients such as the live server.
        return True
    origin = normalize_origin(origin)
    if origin is None:
        # Includes the opaque "null" origin.
        return False
    # Same origin as the request itself. Only host[:port] is compared: whether
    # Django sees https depends on the proxy forwarding X-Forwarded-Proto, which
    # setups that terminate TLS in front of Plane's proxy do not always do.
    if origin.split("://", 1)[1] == request.get_host().lower():
        return True
    return origin in allowed_origins()


class BaseSessionAuthentication(SessionAuthentication):
    # Django's CSRF token is not used by the SPAs; instead, cookie-authenticated
    # writes must come from the request's own origin or a configured Plane origin.
    def enforce_csrf(self, request):
        if request.method in SAFE_METHODS:
            return
        if not is_allowed_origin(request):
            raise PermissionDenied("CSRF Failed: origin not allowed")
