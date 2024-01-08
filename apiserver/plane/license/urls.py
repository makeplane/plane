from django.urls import path

from plane.license.api.views import (
    InstanceEndpoint,
    InstanceAdminEndpoint,
    InstanceConfigurationEndpoint,
    InstanceAdminSignInEndpoint,
    SignUpScreenVisitedEndpoint,
)

urlpatterns = [
    path(
        "",
        InstanceEndpoint.as_view(),
        name="instance",
    ),
    path(
        "admins/",
        InstanceAdminEndpoint.as_view(),
        name="instance-admins",
    ),
    path(
        "admins/<uuid:pk>/",
        InstanceAdminEndpoint.as_view(),
        name="instance-admins",
    ),
    path(
        "configurations/",
        InstanceConfigurationEndpoint.as_view(),
        name="instance-configuration",
    ),
    path(
        "admins/sign-in/",
        InstanceAdminSignInEndpoint.as_view(),
        name="instance-admin-sign-in",
    ),
    path(
        "admins/sign-up-screen-visited/",
        SignUpScreenVisitedEndpoint.as_view(),
        name="instance-sign-up",
    ),
]
