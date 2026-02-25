# [FA-CUSTOM] File-based CSV/XLSX import URL routing
from django.urls import path

from plane.app.views.importer_job.base import (
    ImportHistoryEndpoint,
    ImportJobDetailEndpoint,
    ImportStartEndpoint,
    ImportUploadEndpoint,
)

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import-issues/upload/",
        ImportUploadEndpoint.as_view(),
        name="import-upload",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import-issues/history/",
        ImportHistoryEndpoint.as_view(),
        name="import-history",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import-issues/<str:token>/",
        ImportJobDetailEndpoint.as_view(),
        name="import-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import-issues/<str:token>/start/",
        ImportStartEndpoint.as_view(),
        name="import-start",
    ),
]
