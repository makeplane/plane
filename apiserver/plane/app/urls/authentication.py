from django.urls import path

from plane.app.views import (
    ## End Auth Extender
    # API Tokens
    ApiTokenEndpoint,
    ChangePasswordEndpoint,
    ## End Authentication
    # Auth Extended
    ForgotPasswordEndpoint,
    GithubAuthEndpoint,
    # OauthEndpoint,
    # EmailCheckEndpoint,
    GoogleAuthEndpoint,
    MagicGenerateEndpoint,
    MagicSignInEndpoint,
    ResetPasswordEndpoint,
    SessionEndpoint,
    # Authentication
    SignInEndpoint,
    SignOutEndpoint,
    SignUpEndpoint,
)

urlpatterns = [
    #  Social Auth
    # path("auth/email-check/", EmailCheckEndpoint.as_view(), name="email"),
    # path("social-auth/", OauthEndpoint.as_view(), name="oauth"),
    # Auth
    path(
        "sign-in/",
        SignInEndpoint.as_view(),
        name="sign-in",
    ),
    path(
        "sign-up/",
        SignUpEndpoint.as_view(),
        name="sign-up",
    ),
    path(
        "sign-out/",
        SignOutEndpoint.as_view(),
        name="sign-out",
    ),
    # magic sign in
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
    ## Google
    path(
        "auth/google/",
        GoogleAuthEndpoint.as_view(),
        name="google-auth",
    ),
    ## End Google
    ## Github
    path(
        "auth/github/",
        GithubAuthEndpoint.as_view(),
        name="github-auth",
    ),
    ## End Github
    # path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
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
    # Sessions
    path(
        "auth/sessions/",
        SessionEndpoint.as_view(),
        name="sessions",
    ),
    path(
        "auth/sessions/<str:token>/",
        SessionEndpoint.as_view(),
        name="sessions",
    ),
    # End Sessions
    # API Tokens
    path(
        "api-tokens/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens",
    ),
    path(
        "api-tokens/<uuid:pk>/",
        ApiTokenEndpoint.as_view(),
        name="api-tokens",
    ),
    ## End API Tokens
    # User Auth Endpoint
    # path(
    #     "auth/email-check/",
    #     UserEmailEndpoint.as_view(),
    #     name="user-email-check",
    # ),
    # path(
    #     "auth/users/<str:id>/",
    #     UserIdentifierEndpoint.as_view(),
    #     name="user-identifier",
    # ),
    # path(
    #     "auth/register/",
    #     UserRegisterEndpoint.as_view(),
    #     name="user-register",
    # ),
    ## End User Auth Endpoints
]
