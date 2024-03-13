from django.urls import path

from .views import (
    CSRFTokenEndpoint,
    EmailCheckEndpoint,
    GitHubCallbackEndpoint,
    GitHubOauthInitiateEndpoint,
    GoogleCallbackEndpoint,
    GoogleOauthInitiateEndpoint,
    MagicGenerateEndpoint,
    MagicSignInEndpoint,
    SignInAuthEndpoint,
    SignOutAuthEndpoint,
    SignUpAuthEndpoint,
)

urlpatterns = [
    # credentials
    path(
        "sign-in/",
        SignInAuthEndpoint.as_view(),
        name="sign-in",
    ),
    path(
        "sign-up/",
        SignUpAuthEndpoint.as_view(),
        name="sign-up",
    ),
    # signout
    path(
        "sign-out/",
        SignOutAuthEndpoint.as_view(),
        name="sign-out",
    ),
    # csrf token
    path(
        "get-csrf-token/",
        CSRFTokenEndpoint.as_view(),
        name="get_csrf_token",
    ),
    # Magic sign in
    path(
        "magic-generate/",
        MagicGenerateEndpoint.as_view(),
        name="magic-generate",
    ),
    path(
        "magic-sign-in/",
        MagicSignInEndpoint.as_view(),
        name="magic-sign-in",
    ),
    ## Google Oauth
    path(
        "google/",
        GoogleOauthInitiateEndpoint.as_view(),
        name="google-initiate",
    ),
    path(
        "google/callback/",
        GoogleCallbackEndpoint.as_view(),
        name="google-callback",
    ),
    ## Github Oauth
    path(
        "github/",
        GitHubOauthInitiateEndpoint.as_view(),
        name="github-initiate",
    ),
    path(
        "github/callback/",
        GitHubCallbackEndpoint.as_view(),
        name="github-callback",
    ),
    # Email Check
    path(
        "email-check/",
        EmailCheckEndpoint.as_view(),
        name="email-check",
    ),
]
