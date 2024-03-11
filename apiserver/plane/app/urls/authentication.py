from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView


from plane.app.views import (
    # Authentication
    SignInEndpoint,
    SignOutEndpoint,
    MagicGenerateEndpoint,
    MagicSignInEndpoint,
    OauthEndpoint,
    EmailCheckEndpoint,
    ## End Authentication
    # Auth Extended
    ForgotPasswordEndpoint,
    ResetPasswordEndpoint,
    ChangePasswordEndpoint,
    ## End Auth Extender
    # API Tokens
    ApiTokenEndpoint,
    ## End API Tokens
)


urlpatterns = [
    #  Social Auth
    path("email-check/", EmailCheckEndpoint.as_view(), name="email"),
    path("social-auth/", OauthEndpoint.as_view(), name="oauth"),
    # Auth
    path("sign-in/", SignInEndpoint.as_view(), name="sign-in"),
    path("sign-out/", SignOutEndpoint.as_view(), name="sign-out"),
    # magic sign in
    path(
        "magic-generate/",
        MagicGenerateEndpoint.as_view(),
        name="magic-generate",
    ),
    path(
        "magic-sign-in/", MagicSignInEndpoint.as_view(), name="magic-sign-in"
    ),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Password Manipulation
    path(
        "users/me/change-password/",
        ChangePasswordEndpoint.as_view(),
        name="change-password",
    ),
    path(
        "reset-password/<uidb64>/<token>/",
        ResetPasswordEndpoint.as_view(),
        name="password-reset",
    ),
    path(
        "forgot-password/",
        ForgotPasswordEndpoint.as_view(),
        name="forgot-password",
    ),
    # API Tokens
    path("api-tokens/", ApiTokenEndpoint.as_view(), name="api-tokens"),
    path(
        "api-tokens/<uuid:pk>/", ApiTokenEndpoint.as_view(), name="api-tokens"
    ),
    ## End API Tokens
]
