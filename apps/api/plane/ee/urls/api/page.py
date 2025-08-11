from django.urls import path

from plane.ee.views.api.page import WikiBulkOperationAPIView, ProjectPageDetailAPIEndpoint, WorkspacePageDetailAPIEndpoint, PublishedPageDetailAPIEndpoint

urlpatterns = [
    path(
        "workspaces/<str:slug>/pages/bulk-operation/",
        WikiBulkOperationAPIView.as_view(),
        name="api-pages-bulk-operation",
    ),
    path(
        "public/anchor/<str:anchor>/pages/",
        PublishedPageDetailAPIEndpoint.as_view(http_method_names=["get"]),
        name="published-page-detail",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/pages/<uuid:pk>/",
        ProjectPageDetailAPIEndpoint.as_view(http_method_names=["get"]),
        name="project-page-detail",
    ),
    path(
        "workspaces/<str:slug>/pages/<uuid:pk>/",
        WorkspacePageDetailAPIEndpoint.as_view(http_method_names=["get"]),
        name="workspace-page-detail",
    )

]
