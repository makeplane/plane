from django.urls import path

from plane.api.views import (
    UserAPIEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/users/",
        UserAPIEndpoint.as_view(),
        name="users",
    ),
]
