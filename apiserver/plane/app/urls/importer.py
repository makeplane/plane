from django.urls import path


from plane.app.views import (
    ServiceIssueImportSummaryEndpoint,
    ImportServiceEndpoint,
    UpdateServiceImportStatusEndpoint,
)


urlpatterns = [
    path(
        "workspaces/<str:slug>/importers/<str:service>/",
        ServiceIssueImportSummaryEndpoint.as_view(),
        name="importer-summary",
    ),
    path(
        "workspaces/<str:slug>/projects/importers/<str:service>/",
        ImportServiceEndpoint.as_view(),
        name="importer",
    ),
    path(
        "workspaces/<str:slug>/importers/",
        ImportServiceEndpoint.as_view(),
        name="importer",
    ),
    path(
        "workspaces/<str:slug>/importers/<str:service>/<uuid:pk>/",
        ImportServiceEndpoint.as_view(),
        name="importer",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/service/<str:service>/importers/<uuid:importer_id>/",
        UpdateServiceImportStatusEndpoint.as_view(),
        name="importer-status",
    ),
]
