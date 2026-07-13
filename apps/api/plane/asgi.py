# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")

# Bootstrap OpenTelemetry before Django wires up so DjangoInstrumentor can
# patch the ASGI handler. No-op unless OTEL_ENABLED=1.
from plane.observability.setup import configure_otel  # noqa: E402

configure_otel()

from channels.routing import ProtocolTypeRouter  # noqa: E402
from django.core.asgi import get_asgi_application  # noqa: E402

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
application = ProtocolTypeRouter({"http": get_asgi_application()})
