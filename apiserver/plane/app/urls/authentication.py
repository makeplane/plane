from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView


from plane.app.views import (
    # Authentication
    SignUpEndpoint,
    SignInEndpoint,
    SignOutEndpoint,
    MagicSignInEndpoint,
    MagicSignInGenerateEndpoint,
    OauthEndpoint,
    ## End Authentication
    # Auth Extended
    ForgotPasswordEndpoint,
    VerifyEmailEndpoint,
    ResetPasswordEndpoint,
    RequestEmailVerificationEndpoint,
    ChangePasswordEndpoint,
    ## End Auth Extender
    # API Tokens
    ApiTokenEndpoint,
    ## End API Tokens
)


urlpatterns = [
    #  Social Auth
    path("social-auth/", OauthEndpoint.as_view(), name="oauth"),
    # Auth
    path("sign-up/", SignUpEndpoint.as_view(), name="sign-up"),
    path("sign-in/", SignInEndpoint.as_view(), name="sign-in"),
    path("sign-out/", SignOutEndpoint.as_view(), name="sign-out"),
    # Magic Sign In/Up
    path(
        "magic-generate/", MagicSignInGenerateEndpoint.as_view(), name="magic-generate"
    ),
    path("magic-sign-in/", MagicSignInEndpoint.as_view(), name="magic-sign-in"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Email verification
    path("email-verify/", VerifyEmailEndpoint.as_view(), name="email-verify"),
    path(
        "request-email-verify/",
        RequestEmailVerificationEndpoint.as_view(),
        name="request-reset-email",
    ),
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
    path("api-tokens/<uuid:pk>/", ApiTokenEndpoint.as_view(), name="api-tokens"),
    ## End API Tokens
]
