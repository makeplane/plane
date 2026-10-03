# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
WSGI config for plane project.

It exposes the WSGI callable as a module-level variable named ``application``.

"""

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

# Bootstrap OpenTelemetry before Django wires up so DjangoInstrumentor can
# patch the WSGI handler. No-op unless OTEL_ENABLED=1.
from plane.observability.setup import configure_otel  # noqa: E402

configure_otel()

from django.core.wsgi import get_wsgi_application  # noqa: E402

application = get_wsgi_application()
