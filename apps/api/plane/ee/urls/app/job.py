# Django imports
from django.urls import path

# Module imports
from plane.ee.views import ImportJobView
from plane.ee.views import ImportReportView

urlpatterns = [
    # Job endpoints
    path(
        "workspaces/<str:slug>/import-jobs/",
        ImportJobView.as_view(),
        name="import-jobs-list",
    ),
    path(
        "workspaces/<str:slug>/import-jobs/<uuid:pk>/",
        ImportJobView.as_view(),
        name="import-job-detail",
    ),
    # Report endpoints
    path(
        "workspaces/<str:slug>/import-reports/",
        ImportReportView.as_view(),
        name="import-reports",
    ),
    path(
        "workspaces/<str:slug>/import-reports/<uuid:pk>/",
        ImportReportView.as_view(),
        name="import-report",
    ),
]
