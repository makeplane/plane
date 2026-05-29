from django.urls import path
from plane.app.views.csv_import import CSVImportValidateAPIEndpoint, CSVImportConfirmAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import/csv/validate/",
        CSVImportValidateAPIEndpoint.as_view(),
        name="project-csv-import-validate",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/import/csv/confirm/",
        CSVImportConfirmAPIEndpoint.as_view(),
        name="project-csv-import-confirm",
    ),
]
