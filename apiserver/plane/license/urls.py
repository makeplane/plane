from django.urls import path

from plane.license.api.views import InstanceEndpoint

urlpatterns = [
    path(
        "instances/",
        InstanceEndpoint.as_view(),
        name="instance",
    ),
]
