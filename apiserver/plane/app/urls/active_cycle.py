from django.urls import path

from plane.app.views import (
    ActiveCycleEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/active-cycles/",
        ActiveCycleEndpoint.as_view(),
        name="workspace-active-cycle",
    ),
]
