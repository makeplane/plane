# Copyright (c) 2023-present Gizmo Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path

from plane.license.api.views import (
    EmailCredentialCheckEndpoint,
    InstanceAdminEndpoint,
    InstanceAdminSignInEndpoint,
    InstanceAdminSignUpEndpoint,
    InstanceConfigurationEndpoint,
    DisableEmailFeatureEndpoint,
    InstanceEndpoint,
    SignUpScreenVisitedEndpoint,
    InstanceAdminUserMeEndpoint,
    InstanceAdminSignOutEndpoint,
    InstanceAdminUserSessionEndpoint,
    InstanceUserEndpoint,
    InstanceWorkSpaceAvailabilityCheckEndpoint,
    InstanceWorkSpaceEndpoint,
    InstanceWorkspaceMemberEndpoint,
    MailboxEndpoint,
    MailAliasEndpoint,
    MailConfigEndpoint,
)

urlpatterns = [
    path("", InstanceEndpoint.as_view(), name="instance"),
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
        name="instance-admin-sign-in",
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
    path("workspaces/<uuid:pk>/", InstanceWorkSpaceEndpoint.as_view(), name="instance-workspace-detail"),
    path(
        "workspaces/<uuid:workspace_id>/members/",
        InstanceWorkspaceMemberEndpoint.as_view(),
        name="instance-workspace-members",
    ),
    path(
        "workspaces/<uuid:workspace_id>/members/<uuid:pk>/",
        InstanceWorkspaceMemberEndpoint.as_view(),
        name="instance-workspace-member-detail",
    ),
    path("users/", InstanceUserEndpoint.as_view(), name="instance-users"),
    path("users/<uuid:pk>/", InstanceUserEndpoint.as_view(), name="instance-user-detail"),
    # Mail stack administration (god-mode -> Mail)
    path("mail/config/", MailConfigEndpoint.as_view(), name="instance-mail-config"),
    path("mailboxes/", MailboxEndpoint.as_view(), name="instance-mailboxes"),
    path("mailboxes/<uuid:pk>/", MailboxEndpoint.as_view(), name="instance-mailbox-detail"),
    path("mail-aliases/", MailAliasEndpoint.as_view(), name="instance-mail-aliases"),
    path("mail-aliases/<uuid:pk>/", MailAliasEndpoint.as_view(), name="instance-mail-alias-detail"),
]
