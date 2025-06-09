# Django imports
from django.urls import path

# Module imports
from plane.ee.views import ImportJobAPIView
from plane.ee.views import ImportReportAPIView

urlpatterns = [
    # Job endpoints
    path("import-jobs/", ImportJobAPIView.as_view(), name="import-jobs"),
    path("import-jobs/<uuid:pk>/", ImportJobAPIView.as_view(), name="import-job"),
    # Report endpoints
    path("import-reports/", ImportReportAPIView.as_view(), name="import-reports"),
    path(
        "import-reports/<uuid:pk>/", ImportReportAPIView.as_view(), name="import-report"
    ),
]
