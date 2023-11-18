from django.urls import path

from plane.license.api.views import (
    InstanceEndpoint,
    TransferPrimaryOwnerEndpoint,
    InstanceAdminEndpoint,
    InstanceConfigurationEndpoint,
)

urlpatterns = [
    path(
        "instances/",
        InstanceEndpoint.as_view(),
        name="instance",
    ),
    path(
        "instances/transfer-primary-owner/",
        TransferPrimaryOwnerEndpoint.as_view(),
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
]
