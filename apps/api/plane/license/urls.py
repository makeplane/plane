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

from plane.license.api.views.user import InstanceUserManagementViewSet

from django.urls import path

from plane.license.api.views import (
    EmailCredentialCheckEndpoint,
    InstanceAdminEndpoint,
    InstanceAdminSignInEndpoint,
    InstanceAdminSignUpEndpoint,
    InstanceAdminEmailCheckEndpoint,
    InstanceConfigurationEndpoint,
    DisableEmailFeatureEndpoint,
    InstanceEndpoint,
    SignUpScreenVisitedEndpoint,
    InstanceAdminUserMeEndpoint,
    InstanceAdminSignOutEndpoint,
    InstanceAdminUserSessionEndpoint,
    InstanceWorkSpaceAvailabilityCheckEndpoint,
    InstanceWorkSpaceEndpoint,
    AdminFeatureFlagEndpoint,
    CheckUpdateEndpoint,
    InstanceAdminPasswordResetEndpoint
)

from plane.authentication.views import (
        # Admin authentication
    GoogleOauthInitiateAdminEndpoint,
    GoogleCallbackAdminEndpoint,
    GitHubOauthInitiateAdminEndpoint,
    GitHubCallbackAdminEndpoint,
    GitLabOauthInitiateAdminEndpoint,
    GitLabCallbackAdminEndpoint,
    GiteaOauthInitiateAdminEndpoint,
    GiteaCallbackAdminEndpoint,
    OIDCAuthInitiateAdminEndpoint,
    OIDCCallbackAdminEndpoint,
    SAMLAuthInitiateAdminEndpoint,
    LDAPSignInAuthAdminEndpoint,
    MagicGenerateAdminEndpoint,
    MagicSignInAdminEndpoint,
)

urlpatterns = [
    path("", InstanceEndpoint.as_view(), name="instance"),
    path("check-updates/", CheckUpdateEndpoint.as_view(), name="check-update"),
    path("admins/", InstanceAdminEndpoint.as_view(), name="instance-admins"),
    path("admins/me/", InstanceAdminUserMeEndpoint.as_view(), name="instance-admins"),
    path(
        "admins/session/",
        InstanceAdminUserSessionEndpoint.as_view(),
        name="instance-admin-session",
    ),
    path(
        "admins/sign-out/",
        InstanceAdminSignOutEndpoint.as_view(),
        name="instance-admins",
    ),
    path("admins/<uuid:pk>/", InstanceAdminEndpoint.as_view(), name="instance-admins"),
    path(
        "configurations/",
        InstanceConfigurationEndpoint.as_view(),
        name="instance-configuration",
    ),
    path(
        "configurations/disable-email-feature/",
        DisableEmailFeatureEndpoint.as_view(),
        name="disable-email-configuration",
    ),
    path(
        "admins/sign-in/",
        InstanceAdminSignInEndpoint.as_view(),
        name="instance-admin-sign-in",
    ),
    path(
        "admins/sign-up/",
        InstanceAdminSignUpEndpoint.as_view(),
        name="instance-admin-sign-up",
    ),
    path(
        "admins/email-check/",
        InstanceAdminEmailCheckEndpoint.as_view(),
        name="instance-admin-email-check",
    ),
    path(
        "admins/reset-password/",
        InstanceAdminPasswordResetEndpoint.as_view(),
        name="instance-admin-password-reset",
    ),
    path(
        "admins/sign-up-screen-visited/",
        SignUpScreenVisitedEndpoint.as_view(),
        name="instance-sign-up",
    ),
    path(
        "email-credentials-check/",
        EmailCredentialCheckEndpoint.as_view(),
        name="email-credential-check",
    ),
    path(
        "workspace-slug-check/",
        InstanceWorkSpaceAvailabilityCheckEndpoint.as_view(),
        name="instance-workspace-availability",
    ),
    path("workspaces/", InstanceWorkSpaceEndpoint.as_view(), name="instance-workspace"),
    path(
        "admins/feature-flags/",
        AdminFeatureFlagEndpoint.as_view(),
        name="admin-feature-flags",
    ),    path(
        "admin/google/",
        GoogleOauthInitiateAdminEndpoint.as_view(),
        name="admin-google-initiate",
    ),
    path(
        "admin/google/callback/",
        GoogleCallbackAdminEndpoint.as_view(),
        name="admin-google-callback",
    ),
    path(
        "admin/github/",
        GitHubOauthInitiateAdminEndpoint.as_view(),
        name="admin-github-initiate",
    ),
    path(
        "admin/github/callback/",
        GitHubCallbackAdminEndpoint.as_view(),
        name="admin-github-callback",
    ),
    path(
        "admin/gitlab/",
        GitLabOauthInitiateAdminEndpoint.as_view(),
        name="admin-gitlab-initiate",
    ),
    path(
        "admin/gitlab/callback/",
        GitLabCallbackAdminEndpoint.as_view(),
        name="admin-gitlab-callback",
    ),
    path(
        "admin/gitea/",
        GiteaOauthInitiateAdminEndpoint.as_view(),
        name="admin-gitea-initiate",
    ),
    path(
        "admin/gitea/callback/",
        GiteaCallbackAdminEndpoint.as_view(),
        name="admin-gitea-callback",
    ),
    path(
        "admin/oidc/",
        OIDCAuthInitiateAdminEndpoint.as_view(),
        name="admin-oidc-initiate",
    ),
    path(
        "admin/oidc/callback/",
        OIDCCallbackAdminEndpoint.as_view(),
        name="admin-oidc-callback",
    ),
    path(
        "admin/saml/",
        SAMLAuthInitiateAdminEndpoint.as_view(),
        name="admin-saml-initiate",
    ),
    path(
        "admin/ldap/",
        LDAPSignInAuthAdminEndpoint.as_view(),
        name="admin-ldap",
    ),
    path(
        "admin/magic-generate/",
        MagicGenerateAdminEndpoint.as_view(),
        name="admin-magic-generate",
    ),
    path(
        "admin/magic-sign-in/",
        MagicSignInAdminEndpoint.as_view(),
        name="admin-magic-sign-in",
    ),
    # Instance user management
    path("users/", InstanceUserManagementViewSet.as_view(), name="instance-users-list"),
    path("users/<uuid:pk>/", InstanceUserManagementViewSet.as_view(), name="instance-user-detail"),
]
