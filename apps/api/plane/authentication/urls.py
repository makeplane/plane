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
    # OIDC
    OIDCAuthInitiateEndpoint,
    OIDCallbackEndpoint,
    OIDCLogoutEndpoint,
    # Cloud OIDC
    OIDCAuthCloudCallbackEndpoint,
    # SAML
    SAMLAuthInitiateEndpoint,
    SAMLCallbackEndpoint,
    SAMLMetadataEndpoint,
    SAMLLogoutEndpoint,
    # CLoud SAML
    SAMLAuthCloudMetadataEndpoint,
    SAMLAuthCloudCallbackEndpoint,
    SSOAuthInitiateEndpoint,
    # LDAP
    LDAPSignInAuthEndpoint,
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
    GiteaCallbackEndpoint,
    GiteaOauthInitiateEndpoint,
    GiteaCallbackSpaceEndpoint,
    GiteaOauthInitiateSpaceEndpoint,
    # mobile web view authentication
    MobileEmailCheckEndpoint,
    MobileMagicGenerateEndpoint,
    MobileSignInAuthEndpoint,
    MobileSignUpAuthEndpoint,
    MobileMagicSignInEndpoint,
    MobileMagicSignUpEndpoint,
    MobileSessionTokenCheckEndpoint,
    MobileSignOutAuthEndpoint,
    MobileSessionTokenEndpoint,
    MobileTokenEndpoint,
    MobileRefreshTokenEndpoint,
    MobileGoogleOauthInitiateEndpoint,
    MobileGoogleCallbackEndpoint,
    MobileGitHubOauthInitiateEndpoint,
    MobileGitHubCallbackEndpoint,
    # SSO
    IdentityProviderEndpoint,
    DomainEndpoint,
    DomainVerificationEndpoint,
    GroupSyncConfigEndpoint,
    GroupMappingEndpoint,
    MobileOIDCAuthInitiateEndpoint,
    MobileOIDCallbackEndpoint,
    MobileOIDCLogoutEndpoint,
    MobileSAMLAuthInitiateEndpoint,
    MobileSAMLCallbackEndpoint,
    MobileSAMLLogoutEndpoint,
    MobileSAMLMetadataEndpoint,
    # Desktop
    DesktopGoogleOauthInitiateEndpoint,
    DesktopGoogleCallbackEndpoint,
    DesktopGitHubOauthInitiateEndpoint,
    DesktopGitHubCallbackEndpoint,
    DesktopGitLabOauthInitiateEndpoint,
    DesktopGitLabCallbackEndpoint,
    DesktopGiteaOauthInitiateEndpoint,
    DesktopGiteaCallbackEndpoint,
    DesktopTokenExchangeEndpoint,
    DesktopSignOutEndpoint,
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
    ## Gitea Oauth
    path("gitea/", GiteaOauthInitiateEndpoint.as_view(), name="gitea-initiate"),
    path("gitea/callback/", GiteaCallbackEndpoint.as_view(), name="gitea-callback"),
    path(
        "spaces/gitea/",
        GiteaOauthInitiateSpaceEndpoint.as_view(),
        name="space-gitea-initiate",
    ),
    path(
        "spaces/gitea/callback/",
        GiteaCallbackSpaceEndpoint.as_view(),
        name="space-gitea-callback",
    ),
    # OIDC
    path("oidc/", OIDCAuthInitiateEndpoint.as_view(), name="oidc"),
    path("oidc/callback/", OIDCallbackEndpoint.as_view(), name="oidc"),
    path("oidc/logout/", OIDCLogoutEndpoint.as_view(), name="oidc"),
    # SAML
    path("saml/", SAMLAuthInitiateEndpoint.as_view(), name="saml"),
    path("saml/callback/", SAMLCallbackEndpoint.as_view(), name="saml"),
    path("saml/metadata/", SAMLMetadataEndpoint.as_view(), name="saml"),
    path("saml/logout/", SAMLLogoutEndpoint.as_view(), name="saml"),
    # LDAP
    path("ldap/", LDAPSignInAuthEndpoint.as_view(), name="ldap"),
    # mobile web view authentication
    path(
        "mobile/email-check/",
        MobileEmailCheckEndpoint.as_view(),
        name="mobile-email-check",
    ),
    path(
        "mobile/magic-generate/",
        MobileMagicGenerateEndpoint.as_view(),
        name="mobile-magic-generate",
    ),
    path("mobile/sign-in/", MobileSignInAuthEndpoint.as_view(), name="mobile-sign-in"),
    path(
        "mobile/sign-up/",
        MobileSignUpAuthEndpoint.as_view(),
        name="mobile-sign-up",
    ),
    path(
        "mobile/magic-sign-in/",
        MobileMagicSignInEndpoint.as_view(),
        name="mobile-magic-sign-in",
    ),
    path(
        "mobile/magic-sign-up/",
        MobileMagicSignUpEndpoint.as_view(),
        name="mobile-magic-sign-up",
    ),
    path(
        "mobile/token-check/",
        MobileSessionTokenCheckEndpoint.as_view(),
        name="mobile-token-check",
    ),
    path("mobile/sign-out/", MobileSignOutAuthEndpoint.as_view(), name="mobile-sign-out"),
    path(
        "mobile/session-token/",
        MobileSessionTokenEndpoint.as_view(),
        name="mobile-token",
    ),
    path("mobile/token/", MobileTokenEndpoint.as_view(), name="mobile-token"),
    # mobile web view refresh token
    path(
        "mobile/refresh-token/",
        MobileRefreshTokenEndpoint.as_view(),
        name="mobile-refresh-token",
    ),
    # mobile web view google oauth
    path(
        "mobile/google/",
        MobileGoogleOauthInitiateEndpoint.as_view(),
        name="mobile-google-initiate",
    ),
    path(
        "mobile/google/callback/",
        MobileGoogleCallbackEndpoint.as_view(),
        name="mobile-google-callback",
    ),
    # mobile web view github oauth
    path(
        "mobile/github/",
        MobileGitHubOauthInitiateEndpoint.as_view(),
        name="mobile-github-initiate",
    ),
    path(
        "mobile/github/callback/",
        MobileGitHubCallbackEndpoint.as_view(),
        name="mobile-github-callback",
    ),
    # # mobile web view gitlab oauth
    # path(
    #     "mobile/gitlab/",
    #     MobileGitlabOauthInitiateEndpoint.as_view(),
    #     name="mobile-gitlab-initiate",
    # ),
    # path(
    #     "mobile/gitlab/callback/",
    #     MobileGitlabCallbackEndpoint.as_view(),
    #     name="mobile-gitlab-callback",
    # ),
    # Cloud SSO
    path("sso/", SSOAuthInitiateEndpoint.as_view(), name="sso-initiate"),
    # Cloud OIDC
    path("sso/oidc/callback/<uuid:workspace_id>/", OIDCAuthCloudCallbackEndpoint.as_view(), name="cloud-oidc-callback"),
    # Cloud SAML
    path("sso/saml/metadata/<uuid:workspace_id>/", SAMLAuthCloudMetadataEndpoint.as_view(), name="cloud-saml-metadata"),
    path("sso/saml/callback/<uuid:workspace_id>/", SAMLAuthCloudCallbackEndpoint.as_view(), name="cloud-saml-callback"),
    # SSO
    path("sso/workspaces/<str:slug>/providers/", IdentityProviderEndpoint.as_view(), name="sso-provider"),
    path("sso/workspaces/<str:slug>/providers/<uuid:pk>/", IdentityProviderEndpoint.as_view(), name="sso-provider"),
    path("sso/workspaces/<str:slug>/domains/", DomainEndpoint.as_view(), name="sso-domain"),
    path("sso/workspaces/<str:slug>/domains/<uuid:pk>/", DomainEndpoint.as_view(), name="sso-domain"),
    path(
        "sso/workspaces/<str:slug>/domains/<uuid:pk>/verification/",
        DomainVerificationEndpoint.as_view(),
        name="sso-domain-verification",
    ),
    # Group Sync
    path(
        "sso/workspaces/<str:slug>/group-sync/config/",
        GroupSyncConfigEndpoint.as_view(),
        name="group-sync-config",
    ),
    path(
        "sso/workspaces/<str:slug>/group-sync/mappings/",
        GroupMappingEndpoint.as_view(),
        name="group-mappings",
    ),
    path(
        "sso/workspaces/<str:slug>/group-sync/mappings/<uuid:pk>/",
        GroupMappingEndpoint.as_view(),
        name="group-mappings",
    ),
    # mobile web view oidc
    path(
        "mobile/oidc/",
        MobileOIDCAuthInitiateEndpoint.as_view(),
        name="mobile-oidc-initiate",
    ),
    path(
        "mobile/oidc/callback/",
        MobileOIDCallbackEndpoint.as_view(),
        name="mobile-oidc-callback",
    ),
    path(
        "mobile/oidc/logout/",
        MobileOIDCLogoutEndpoint.as_view(),
        name="mobile-oidc-logout",
    ),
    # mobile web view saml
    path(
        "mobile/saml/",
        MobileSAMLAuthInitiateEndpoint.as_view(),
        name="mobile-saml-initiate",
    ),
    path(
        "mobile/saml/callback/",
        MobileSAMLCallbackEndpoint.as_view(),
        name="mobile-saml-callback",
    ),
    path(
        "mobile/saml/metadata/",
        MobileSAMLMetadataEndpoint.as_view(),
        name="mobile-saml-metadata",
    ),
    path(
        "mobile/saml/logout/",
        MobileSAMLLogoutEndpoint.as_view(),
        name="mobile-saml-logout",
    ),
    # Desktop OAuth
    path(
        "desktop/google/",
        DesktopGoogleOauthInitiateEndpoint.as_view(),
        name="desktop-google-initiate",
    ),
    path(
        "desktop/google/callback/",
        DesktopGoogleCallbackEndpoint.as_view(),
        name="desktop-google-callback",
    ),
    path(
        "desktop/github/",
        DesktopGitHubOauthInitiateEndpoint.as_view(),
        name="desktop-github-initiate",
    ),
    path(
        "desktop/github/callback/",
        DesktopGitHubCallbackEndpoint.as_view(),
        name="desktop-github-callback",
    ),
    path(
        "desktop/gitlab/",
        DesktopGitLabOauthInitiateEndpoint.as_view(),
        name="desktop-gitlab-initiate",
    ),
    path(
        "desktop/gitlab/callback/",
        DesktopGitLabCallbackEndpoint.as_view(),
        name="desktop-gitlab-callback",
    ),
    path(
        "desktop/gitea/",
        DesktopGiteaOauthInitiateEndpoint.as_view(),
        name="desktop-gitea-initiate",
    ),
    path(
        "desktop/gitea/callback/",
        DesktopGiteaCallbackEndpoint.as_view(),
        name="desktop-gitea-callback",
    ),
    path(
        "desktop/token-exchange/",
        DesktopTokenExchangeEndpoint.as_view(),
        name="desktop-token-exchange",
    ),
    path(
        "desktop/sign-out/",
        DesktopSignOutEndpoint.as_view(),
        name="desktop-sign-out",
    ),
]
