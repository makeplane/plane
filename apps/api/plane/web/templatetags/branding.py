# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django import template
from django.conf import settings

register = template.Library()


@register.simple_tag
def absolute_static(path):
    """Absolute URL of a static file on this instance, for emails (mail clients need full URLs).

    Uses the unhashed path, which WhiteNoise serves alongside the hashed copy, so it works
    whether or not collectstatic's manifest is present.
    """
    base = (settings.WEB_URL or "").rstrip("/")
    return f"{base}{settings.STATIC_URL}{path.lstrip('/')}"
