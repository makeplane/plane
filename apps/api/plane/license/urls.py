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
    AIProviderCollectionEndpoint,
    AIProviderDetailEndpoint,
    AIProviderDiscoverModelsEndpoint,
    AIProviderDraftTestConnectionEndpoint,
    AIProviderModelDetailEndpoint,
    AIProviderModelsEndpoint,
    AIProviderSetDefaultEndpoint,
    AIProviderTestConnectionEndpoint,
    AIProviderImportLegacyEndpoint,
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
    path("ai/providers/", AIProviderCollectionEndpoint.as_view(), name="ai-provider-collection"),
    path(
        "ai/providers/test-connection/",
        AIProviderDraftTestConnectionEndpoint.as_view(),
        name="ai-provider-draft-test-connection",
    ),
    path("ai/import-legacy/", AIProviderImportLegacyEndpoint.as_view(), name="ai-provider-import-legacy"),
    path("ai/providers/<uuid:pk>/", AIProviderDetailEndpoint.as_view(), name="ai-provider-detail"),
    path(
        "ai/providers/<uuid:pk>/set-default/",
        AIProviderSetDefaultEndpoint.as_view(),
        name="ai-provider-set-default",
    ),
    path(
        "ai/providers/<uuid:pk>/test-connection/",
        AIProviderTestConnectionEndpoint.as_view(),
        name="ai-provider-test",
    ),
    path("ai/providers/<uuid:pk>/models/", AIProviderModelsEndpoint.as_view(), name="ai-provider-models"),
    path(
        "ai/providers/<uuid:pk>/models/discover/",
        AIProviderDiscoverModelsEndpoint.as_view(),
        name="ai-provider-discover-models",
    ),
    path(
        "ai/providers/<uuid:pk>/models/<str:model_id>/",
        AIProviderModelDetailEndpoint.as_view(),
        name="ai-provider-model-detail",
    ),
]
