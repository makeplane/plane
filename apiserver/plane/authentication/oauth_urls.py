from django.urls import path
from django.views.decorators.csrf import csrf_exempt
import oauth2_provider.views as oauth2_views

from plane.authentication.views.oauth import (
    OAuthTokenEndpoint,
    CustomAuthorizationView,
    OAuthApplicationInstalledWorkspacesEndpoint,
)

# OAuth2 provider endpoints
urlpatterns = [
    path("authorize-app/", CustomAuthorizationView.as_view(), name="authorize"),
    path("token/", csrf_exempt(OAuthTokenEndpoint.as_view()), name="token"),
    path("revoke-token/", oauth2_views.RevokeTokenView.as_view(), name="revoke-token"),
    path(
        "authorized-tokens/",
        oauth2_views.AuthorizedTokensListView.as_view(),
        name="authorized-token-list",
    ),
    path(
        "authorized-tokens/<pk>/delete/",
        oauth2_views.AuthorizedTokenDeleteView.as_view(),
        name="authorized-token-delete",
    ),
    path(
        "app-installation/",
        OAuthApplicationInstalledWorkspacesEndpoint.as_view(),
        name="app-installation",
    ),
]
