"""plane URL Configuration"""

from oauth2_provider import urls as oauth2_urls
from django.contrib import admin


from django.conf import settings
from django.urls import include, path, re_path

# Module imports
from plane.ee.views.space.intake import (
    IntakeEmailWebhookEndpoint,
    IntakeEmailAttachmentEndpoint,
)

handler404 = "plane.app.views.error_404.custom_404_view"

urlpatterns = [
    path("api/", include("plane.app.urls")),
    path("api/public/", include("plane.space.urls")),
    path("api/instances/", include("plane.license.urls")),
    path("api/v1/", include("plane.api.urls")),
    path("auth/", include("plane.authentication.urls")),
    path("api/payments/", include("plane.payment.urls")),
    path("", include("plane.web.urls")),
    path("graphql/", include("plane.graphql.urls")),
    path("auth/o/", include(("plane.authentication.oauth_urls", "oauth2_provider"))),
    # this is a webhook endpoint for email intake - this endpoint should not be exposed to ingress
    path("intake/email/", IntakeEmailWebhookEndpoint.as_view()),
    path("intake/email/attachments/", IntakeEmailAttachmentEndpoint.as_view()),
    path("marketplace/", include("plane.marketplace.urls")),
]


if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [
            re_path(r"^__debug__/", include(debug_toolbar.urls))
        ] + urlpatterns
    except ImportError:
        pass
