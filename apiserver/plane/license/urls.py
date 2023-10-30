from django.urls import path

from plane.license.api.views import InstanceEndpoint, TransferOwnerEndpoint

urlpatterns = [
    path(
        "instances/",
        InstanceEndpoint.as_view(),
        name="instance",
    ),
    path(
        "instances/transfer-owner/",
        TransferOwnerEndpoint.as_view(),
        name="instance",
    ),
]
