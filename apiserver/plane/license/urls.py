from django.urls import path

from plane.license.api.views import (
    EmailCredentialCheckEndpoint,
    InstanceAdminEndpoint,
    InstanceAdminSignInEndpoint,
    InstanceConfigurationEndpoint,
    InstanceEndpoint,
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
    path(
        "email-credentials-check/",
        EmailCredentialCheckEndpoint.as_view(),
        name="email-credential-check",
    ),
]
