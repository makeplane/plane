# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

from django.urls import path, include

from plane.authentication.views import SwingSSOTestEndpoint
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
    InstanceUserEndpoint,
    InstanceUserBulkImportEndpoint,
    InstanceUserResetPasswordEndpoint,
    InstanceUserWorkspaceEndpoint,
    InstanceWorkspaceBulkCreateEndpoint,
    InstanceWorkspaceBulkAssignMembersEndpoint,
    InstanceWorkspaceProjectBulkImportEndpoint,
    InstanceWorkspaceModuleBulkImportEndpoint,
    InstanceWorkSpaceDetailEndpoint,
    EmailLogMonitoringEndpoint,
    ScheduledJobMonitoringEndpoint,
    WorkerHealthMonitoringEndpoint,
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
    path("workspaces/bulk-create/", InstanceWorkspaceBulkCreateEndpoint.as_view(), name="instance-workspace-bulk-create"),
    path("workspaces/bulk-assign-members/", InstanceWorkspaceBulkAssignMembersEndpoint.as_view(), name="instance-workspace-bulk-assign-members"),
    path("bulk-import-projects/", InstanceWorkspaceProjectBulkImportEndpoint.as_view(), name="instance-bulk-import-projects"),
    path("bulk-import-modules/", InstanceWorkspaceModuleBulkImportEndpoint.as_view(), name="instance-bulk-import-modules"),
    path("workspaces/<str:slug>/", InstanceWorkSpaceDetailEndpoint.as_view(), name="instance-workspace-detail"),
    # Swing SSO test (admin-only, needs instances path for admin session cookie)
    path("swing-sso/test/", SwingSSOTestEndpoint.as_view(), name="swing-sso-test"),
    # User management
    path("users/", InstanceUserEndpoint.as_view(), name="instance-users"),
    path(
        "users/bulk-import/",
        InstanceUserBulkImportEndpoint.as_view(),
        name="instance-user-bulk-import",
    ),
    path("users/<uuid:pk>/", InstanceUserEndpoint.as_view(), name="instance-user-detail"),
    path(
        "users/<uuid:pk>/reset-password/",
        InstanceUserResetPasswordEndpoint.as_view(),
        name="instance-user-reset-password",
    ),
    path(
        "users/<uuid:pk>/workspaces/",
        InstanceUserWorkspaceEndpoint.as_view(),
        name="instance-user-workspaces",
    ),
    # Department management
    path("", include("plane.license.api.urls.department")),
    # Staff management
    path("", include("plane.license.api.urls.staff")),
    # Task category management
    path("", include("plane.license.api.urls.task_category")),
    # Monitoring
    path(
        "monitoring/email-logs/",
        EmailLogMonitoringEndpoint.as_view(),
        name="monitoring-email-logs",
    ),
    path(
        "monitoring/scheduled-jobs/",
        ScheduledJobMonitoringEndpoint.as_view(),
        name="monitoring-scheduled-jobs",
    ),
    path(
        "monitoring/worker-health/",
        WorkerHealthMonitoringEndpoint.as_view(),
        name="monitoring-worker-health",
    ),
]
