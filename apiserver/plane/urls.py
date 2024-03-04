"""plane URL Configuration

"""

from django.conf import settings
from django.urls import include, path, re_path
from django.views.generic import TemplateView

from plane.app.views.auth.github import (
    GithubCallbackEndpoint,
    GithubOauthInitiateEndpoint,
)
from plane.app.views.auth.email import (
    SignInAuthEndpoint,
    SignUpAuthEndpoint,
    SignOutAuthEndpoint,
    CSRFTokenEndpoint,
)
from plane.app.views.auth.google import (
    GoogleCallbackEndpoint,
    GoogleOauthInitiateEndpoint,
)

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html")),
    path("api/", include("plane.app.urls")),
    path("api/public/", include("plane.space.urls")),
    path("api/instances/", include("plane.license.urls")),
    path("api/v1/", include("plane.api.urls")),
    path("", include("plane.web.urls")),
    path(
        "auth/sign-in/",
        SignInAuthEndpoint.as_view(),
        name="sign-in",
    ),
    path(
        "auth/sign-up/",
        SignUpAuthEndpoint.as_view(),
        name="sign-up",
    ),
    path(
        "auth/sign-out/",
        SignOutAuthEndpoint.as_view(),
        name="sign-out",
    ),
    path(
        "get-csrf-token/", CSRFTokenEndpoint.as_view(), name="get_csrf_token"
    ),
    path(
        "auth/google/",
        GoogleOauthInitiateEndpoint.as_view(),
        name="google-initiate",
    ),
    path(
        "auth/callback/google/",
        GoogleCallbackEndpoint.as_view(),
        name="google-callback",
    ),
    path(
        "auth/github/",
        GithubOauthInitiateEndpoint.as_view(),
        name="github-initiate",
    ),
    path(
        "auth/callback/github/",
        GithubCallbackEndpoint.as_view(),
        name="github-callback",
    ),
]


if settings.DEBUG:
    try:
        import debug_toolbar

        urlpatterns = [
            re_path(r"^__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass
