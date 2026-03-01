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

"""plane URL Configuration"""

from django.conf import settings
from django.urls import include, path, re_path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

# Module imports
from plane.ee.views.space.intake import (
    IntakeEmailWebhookEndpoint,
    IntakeEmailAttachmentEndpoint,
)

handler404 = "plane.app.views.error_404.custom_404_view"

urlpatterns = [
    # urls used by the web app
    path("api/", include("plane.app.urls")),
    path("api/public/", include("plane.space.urls")),
    path("api/instances/", include("plane.license.urls")),
    # external api urls
    path("api/v1/", include("plane.api.urls")),
    # internal urls with hmac or secret key authentication
    path("api/internal/", include("plane.internal.urls")),
    path("auth/", include("plane.authentication.urls")),
    path("api/payments/", include("plane.payment.urls")),
    path("api/silo/", include("plane.silo.urls")),
    path("", include("plane.web.urls")),
    path("graphql/", include("plane.graphql.urls")),
    path("auth/o/", include(("plane.authentication.oauth_urls", "oauth2_provider"))),
    # this is a webhook endpoint for email intake - this endpoint should not be exposed to ingress
    path("intake/email/", IntakeEmailWebhookEndpoint.as_view()),
    path("intake/email/attachments/", IntakeEmailAttachmentEndpoint.as_view()),
    path("marketplace/", include("plane.marketplace.urls")),
]

if settings.ENABLE_DRF_SPECTACULAR:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path(
            "api/schema/swagger-ui/",
            SpectacularSwaggerView.as_view(url_name="schema"),
            name="swagger-ui",
        ),
        path(
            "api/schema/redoc/",
            SpectacularRedocView.as_view(url_name="schema"),
            name="redoc",
        ),
    ]

if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [re_path(r"^__debug__/", include(debug_toolbar.urls))] + urlpatterns
    except ImportError:
        pass
