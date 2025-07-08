from django.urls import path

from plane.ee.views.api.page import WikiBulkOperationAPIView

urlpatterns = [
    path(
        "workspaces/<str:slug>/pages/bulk-operation/",
        WikiBulkOperationAPIView.as_view(),
        name="api-pages-bulk-operation",
    ),
]
