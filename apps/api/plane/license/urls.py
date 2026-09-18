# Copyright (c) 2023-present Plane Software, Inc. and contributors
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
    InstanceWorkSpaceAvailabilityCheckEndpoint,
    InstanceWorkSpaceEndpoint,
    InstanceWorkspaceResearchEndpoint,
    InstanceUserListEndpoint,
    InstanceUserBulkDeactivateEndpoint,
    InstanceUserClearImportedEndpoint,
    InstanceUserLifecycleEndpoint,
    InstanceUserReactivateEndpoint,
    InstanceUserRoleEndpoint,
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
    path(
        "workspaces/<uuid:pk>/research/",
        InstanceWorkspaceResearchEndpoint.as_view(),
        name="instance-workspace-research",
    ),
    path("users/", InstanceUserListEndpoint.as_view(), name="instance-users"),
    path(
        "users/bulk-deactivate/",
        InstanceUserBulkDeactivateEndpoint.as_view(),
        name="instance-users-bulk-deactivate",
    ),
    path(
        "users/clear-imported/",
        InstanceUserClearImportedEndpoint.as_view(),
        name="instance-users-clear-imported",
    ),
    path(
        "users/<uuid:pk>/",
        InstanceUserLifecycleEndpoint.as_view(),
        name="instance-user-lifecycle",
    ),
    path(
        "users/<uuid:pk>/reactivate/",
        InstanceUserReactivateEndpoint.as_view(),
        name="instance-user-reactivate",
    ),
    path(
        "users/<uuid:pk>/roles/",
        InstanceUserRoleEndpoint.as_view(),
        name="instance-user-roles",
    ),
]
