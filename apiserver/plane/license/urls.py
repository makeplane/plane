from django.urls import path

from plane.license.api.views import (
    InstanceEndpoint,
    InstanceAdminEndpoint,
    InstanceConfigurationEndpoint,
    AdminMagicSignInGenerateEndpoint,
    AdminSetupMagicSignInEndpoint,
    AdminSetUserPasswordEndpoint,
    SignUpScreenVisitedEndpoint,
)

urlpatterns = [
    path(
        "instances/",
        InstanceEndpoint.as_view(),
        name="instance",
    ),
    path(
        "instances/admins/",
        InstanceAdminEndpoint.as_view(),
        name="instance-admins",
    ),
    path(
        "instances/admins/<uuid:pk>/",
        InstanceAdminEndpoint.as_view(),
        name="instance-admins",
    ),
    path(
        "instances/configurations/",
        InstanceConfigurationEndpoint.as_view(),
        name="instance-configuration",
    ),
    path(
        "instances/admins/magic-generate/",
        AdminMagicSignInGenerateEndpoint.as_view(),
        name="instance-admins",
    ),
    path(
        "instances/admins/magic-sign-in/",
        AdminSetupMagicSignInEndpoint.as_view(),
        name="instance-admins",
    ),
    path(
        "instances/admins/set-password/",
        AdminSetUserPasswordEndpoint.as_view(),
        name="instance-admins",
    ),
    path(
        "instances/admins/sign-up-screen-visited/",
        SignUpScreenVisitedEndpoint.as_view(),
        name="instance-sign-up",
    ),
]
