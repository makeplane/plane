from django.urls import path

from .views import (
    CSRFTokenEndpoint,
    ForgotPasswordEndpoint,
    SetUserPasswordEndpoint,
    ResetPasswordEndpoint,
    ChangePasswordEndpoint,
    # App
    EmailCheckEndpoint,
    GitLabCallbackEndpoint,
    GitLabOauthInitiateEndpoint,
    GitHubCallbackEndpoint,
    GitHubOauthInitiateEndpoint,
    GoogleCallbackEndpoint,
    GoogleOauthInitiateEndpoint,
    MagicGenerateEndpoint,
    MagicSignInEndpoint,
    MagicSignUpEndpoint,
    SignInAuthEndpoint,
    SignOutAuthEndpoint,
    SignUpAuthEndpoint,
    ForgotPasswordSpaceEndpoint,
    ResetPasswordSpaceEndpoint,
    # Space
    EmailCheckSpaceEndpoint,
    GitLabCallbackSpaceEndpoint,
    GitLabOauthInitiateSpaceEndpoint,
    GitHubCallbackSpaceEndpoint,
    GitHubOauthInitiateSpaceEndpoint,
    GoogleCallbackSpaceEndpoint,
    GoogleOauthInitiateSpaceEndpoint,
    MagicGenerateSpaceEndpoint,
    MagicSignInSpaceEndpoint,
    MagicSignUpSpaceEndpoint,
    SignInAuthSpaceEndpoint,
    SignUpAuthSpaceEndpoint,
    SignOutAuthSpaceEndpoint,
)

urlpatterns = [
    # credentials
    path("sign-in/", SignInAuthEndpoint.as_view(), name="sign-in"),
    path("sign-up/", SignUpAuthEndpoint.as_view(), name="sign-up"),
    path("spaces/sign-in/", SignInAuthSpaceEndpoint.as_view(), name="space-sign-in"),
    path("spaces/sign-up/", SignUpAuthSpaceEndpoint.as_view(), name="space-sign-up"),
    # signout
    path("sign-out/", SignOutAuthEndpoint.as_view(), name="sign-out"),
    path("spaces/sign-out/", SignOutAuthSpaceEndpoint.as_view(), name="space-sign-out"),
    # csrf token
    path("get-csrf-token/", CSRFTokenEndpoint.as_view(), name="get_csrf_token"),
    # Magic sign in
    path("magic-generate/", MagicGenerateEndpoint.as_view(), name="magic-generate"),
    path("magic-sign-in/", MagicSignInEndpoint.as_view(), name="magic-sign-in"),
    path("magic-sign-up/", MagicSignUpEndpoint.as_view(), name="magic-sign-up"),
    path(
        "spaces/magic-generate/",
        MagicGenerateSpaceEndpoint.as_view(),
        name="space-magic-generate",
    ),
    path(
        "spaces/magic-sign-in/",
        MagicSignInSpaceEndpoint.as_view(),
        name="space-magic-sign-in",
    ),
    path(
        "spaces/magic-sign-up/",
        MagicSignUpSpaceEndpoint.as_view(),
        name="space-magic-sign-up",
    ),
    ## Google Oauth
    path("google/", GoogleOauthInitiateEndpoint.as_view(), name="google-initiate"),
    path("google/callback/", GoogleCallbackEndpoint.as_view(), name="google-callback"),
    path(
        "spaces/google/",
        GoogleOauthInitiateSpaceEndpoint.as_view(),
        name="space-google-initiate",
    ),
    path(
        "spaces/google/callback/",
        GoogleCallbackSpaceEndpoint.as_view(),
        name="space-google-callback",
    ),
    ## Github Oauth
    path("github/", GitHubOauthInitiateEndpoint.as_view(), name="github-initiate"),
    path("github/callback/", GitHubCallbackEndpoint.as_view(), name="github-callback"),
    path(
        "spaces/github/",
        GitHubOauthInitiateSpaceEndpoint.as_view(),
        name="space-github-initiate",
    ),
    path(
        "spaces/github/callback/",
        GitHubCallbackSpaceEndpoint.as_view(),
        name="space-github-callback",
    ),
    ## Gitlab Oauth
    path("gitlab/", GitLabOauthInitiateEndpoint.as_view(), name="gitlab-initiate"),
    path("gitlab/callback/", GitLabCallbackEndpoint.as_view(), name="gitlab-callback"),
    path(
        "spaces/gitlab/",
        GitLabOauthInitiateSpaceEndpoint.as_view(),
        name="space-gitlab-initiate",
    ),
    path(
        "spaces/gitlab/callback/",
        GitLabCallbackSpaceEndpoint.as_view(),
        name="space-gitlab-callback",
    ),
    # Email Check
    path("email-check/", EmailCheckEndpoint.as_view(), name="email-check"),
    path("spaces/email-check/", EmailCheckSpaceEndpoint.as_view(), name="email-check"),
    # Password
    path("forgot-password/", ForgotPasswordEndpoint.as_view(), name="forgot-password"),
    path(
        "reset-password/<uidb64>/<token>/",
        ResetPasswordEndpoint.as_view(),
        name="forgot-password",
    ),
    path(
        "spaces/forgot-password/",
        ForgotPasswordSpaceEndpoint.as_view(),
        name="space-forgot-password",
    ),
    path(
        "spaces/reset-password/<uidb64>/<token>/",
        ResetPasswordSpaceEndpoint.as_view(),
        name="space-forgot-password",
    ),
    path("change-password/", ChangePasswordEndpoint.as_view(), name="forgot-password"),
    path("set-password/", SetUserPasswordEndpoint.as_view(), name="set-password"),
]
