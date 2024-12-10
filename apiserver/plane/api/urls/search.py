from django.urls import path

from plane.api.views import (
    GlobalSearchEndpoint
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/search/",
        GlobalSearchEndpoint.as_view(),
        name="project",
    ),
]